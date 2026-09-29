import { prisma } from "@/lib/prisma";
import { PRESENCE_WINDOW_MS, describePath, sectionLabel, clickLabel } from "@/lib/analytics";

/**
 * Owner-only analytics aggregation.
 *
 * Everything is aggregated in the database (GROUP BY / COUNT DISTINCT) so the
 * browser never downloads raw event rows. Only the small lists the dashboard
 * actually renders are fetched, and they are hard-limited.
 *
 * Every number here is real. With no recorded traffic the values are 0 and the
 * dashboard renders an explicit empty state — nothing is ever seeded.
 */

export type AnalyticsStat = { activeNow: number; todayVisitors: number; todaySessions: number; todayPageViews: number; visitors30d: number; totalVisitors: number; totalSessions: number; totalPageViews: number; returning30d: number; new30d: number; mobile30d: number; desktop30d: number };
export type TrendPoint = { day: string; visitors: number; pageViews: number };
export type BreakdownRow = { label: string; count: number; percent: number };
export type PageRow = { path: string; label: string; views: number; visitors: number };
export type SectionRow = { key: string; label: string; views: number; visitors: number };
export type LiveVisitor = { id: string; device: string; deviceCategory: string; os: string; browser: string; currentPage: string; currentSection: string | null; lastSeen: string; startedAt: string; pageViews: number; isReturning: boolean };
export type ActivityRow = { id: string; device: string; deviceCategory: string; label: string; detail: string | null; at: string };

export type AnalyticsSnapshot = {
  generatedAt: string;
  hasData: boolean;
  /** True when aggregation failed — the dashboard keeps its last good data. */
  degraded?: boolean;
  /** First moment any real traffic was recorded — never backfilled. */
  trackingSince: string | null;
  stats: AnalyticsStat;
  trend: TrendPoint[];
  devices: BreakdownRow[];
  operatingSystems: BreakdownRow[];
  browsers: BreakdownRow[];
  topPages: PageRow[];
  topSections: SectionRow[];
  liveVisitors: LiveVisitor[];
  recentActivity: ActivityRow[];
};

type CountRow = { count: number };

function pct(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

/** Don't leak the raw anonymous token — show a short opaque reference. */
function shortVisitorRef(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** Zeroed snapshot — shown when no traffic exists, never seeded with fake data. */
function emptySnapshot(degraded = false): AnalyticsSnapshot {
  const now = new Date();
  return {
    generatedAt: now.toISOString(),
    hasData: false,
    degraded,
    trackingSince: null,
    stats: {
      activeNow: 0,
      todayVisitors: 0,
      todaySessions: 0,
      todayPageViews: 0,
      visitors30d: 0,
      totalVisitors: 0,
      totalSessions: 0,
      totalPageViews: 0,
      returning30d: 0,
      new30d: 0,
      mobile30d: 0,
      desktop30d: 0,
    },
    // An explicit all-zero 30-day series so the chart axis stays honest.
    trend: Array.from({ length: 30 }, (_, index) => {
      const day = new Date(now.getTime() - (29 - index) * 24 * 60 * 60 * 1000);
      return { day: day.toISOString().slice(0, 10), visitors: 0, pageViews: 0 };
    }),
    devices: [],
    operatingSystems: [],
    browsers: [],
    topPages: [],
    topSections: [],
    liveVisitors: [],
    recentActivity: [],
  };
}

/**
 * Analytics must never be able to break the admin Overview: a failed query
 * degrades to a zeroed snapshot instead of throwing.
 */
export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  try {
    return await computeSnapshot();
  } catch (error) {
    console.error("[analytics] snapshot failed, showing zeros:", error);
    return emptySnapshot(true);
  }
}

async function computeSnapshot(): Promise<AnalyticsSnapshot> {
  const now = new Date();
  const presenceSince = new Date(now.getTime() - PRESENCE_WINDOW_MS);
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Day boundary comes from the database so "today" is consistent everywhere.
  const dayRow = await prisma.$queryRaw<{ start: Date }[]>`SELECT date_trunc('day', now()) AS start`;
  const startOfToday = dayRow[0]?.start ?? now;

  const [
    activeNow,
    todayRow,
    lifetimeVisitors,
    lifetimeSessions,
    lifetimePageViews,
    visitors30dRow,
    returningRow,
    deviceRows,
    osRows,
    browserRows,
    trendRows,
    pageRows,
    sectionRows,
    liveSessions,
    recentEvents,
    recentCount,
    firstVisitor,
  ] = await Promise.all([
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: presenceSince }, isBot: false } }),
    prisma.$queryRaw<{ sessions: number; visitors: number; page_views: number }[]>`
      SELECT COUNT(*)::int AS sessions,
             COUNT(DISTINCT visitor_id)::int AS visitors,
             COALESCE(SUM(page_view_count), 0)::int AS page_views
      FROM analytics_sessions
      WHERE started_at >= ${startOfToday} AND is_bot = false`,
    prisma.analyticsVisitor.count({ where: { isBot: false } }),
    prisma.analyticsSession.count({ where: { isBot: false } }),
    prisma.analyticsEvent.count({ where: { eventType: "page_view" } }),
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT visitor_id)::int AS count
      FROM analytics_sessions
      WHERE started_at >= ${since30} AND is_bot = false`,
    prisma.$queryRaw<{ sessions: number; returning: number }[]>`
      SELECT COUNT(*)::int AS sessions,
             COUNT(*) FILTER (WHERE s.started_at > v.first_seen_at)::int AS returning
      FROM analytics_sessions s
      JOIN analytics_visitors v ON v.id = s.visitor_id
      WHERE s.started_at >= ${since30} AND s.is_bot = false AND v.is_bot = false`,
    prisma.$queryRaw<{ key: string; count: number }[]>`
      SELECT device_category AS key, COUNT(*)::int AS count
      FROM analytics_visitors
      WHERE is_bot = false AND last_seen_at >= ${since30}
      GROUP BY device_category ORDER BY count DESC`,
    prisma.$queryRaw<{ key: string; count: number }[]>`
      SELECT COALESCE(os_name, 'Other') AS key, COUNT(*)::int AS count
      FROM analytics_visitors
      WHERE is_bot = false AND last_seen_at >= ${since30}
      GROUP BY os_name ORDER BY count DESC`,
    prisma.$queryRaw<{ key: string; count: number }[]>`
      SELECT COALESCE(browser_name, 'Other') AS key, COUNT(*)::int AS count
      FROM analytics_visitors
      WHERE is_bot = false AND last_seen_at >= ${since30}
      GROUP BY browser_name ORDER BY count DESC`,
    prisma.$queryRaw<{ day: string; visitors: number; page_views: number }[]>`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
             COALESCE((SELECT COUNT(DISTINCT s.visitor_id) FROM analytics_sessions s
                        WHERE s.is_bot = false AND s.started_at >= d.day AND s.started_at < d.day + interval '1 day'), 0)::int AS visitors,
             COALESCE((SELECT COUNT(*) FROM analytics_events e
                        WHERE e.event_type = 'page_view' AND e.created_at >= d.day AND e.created_at < d.day + interval '1 day'), 0)::int AS page_views
      FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') AS d(day)
      ORDER BY d.day`,
    prisma.$queryRaw<{ page_path: string; views: number; visitors: number }[]>`
      SELECT page_path, COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM analytics_events
      WHERE event_type = 'page_view' AND created_at >= ${since30}
      GROUP BY page_path ORDER BY views DESC LIMIT 8`,
    prisma.$queryRaw<{ section_key: string; views: number; visitors: number }[]>`
      SELECT section_key, COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM analytics_events
      WHERE event_type = 'section_view' AND section_key IS NOT NULL AND created_at >= ${since30}
      GROUP BY section_key ORDER BY views DESC LIMIT 8`,
    prisma.analyticsSession.findMany({
      where: { lastSeenAt: { gte: presenceSince }, isBot: false },
      orderBy: { lastSeenAt: "desc" },
      take: 20,
      select: {
        id: true,
        entryPath: true,
        lastPath: true,
        currentSection: true,
        deviceCategory: true,
        deviceName: true,
        osName: true,
        browserName: true,
        startedAt: true,
        lastSeenAt: true,
        pageViewCount: true,
        visitor: { select: { anonymousId: true, firstSeenAt: true } },
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        eventType: true,
        pagePath: true,
        sectionKey: true,
        targetKey: true,
        createdAt: true,
        session: { select: { deviceName: true, deviceCategory: true, browserName: true, osName: true } },
      },
    }),
    prisma.analyticsEvent.count(),
    prisma.analyticsVisitor.findFirst({ orderBy: { firstSeenAt: "asc" }, select: { firstSeenAt: true } }),
  ]);

  const today = todayRow[0] ?? { sessions: 0, visitors: 0, page_views: 0 };
  const returning = returningRow[0] ?? { sessions: 0, returning: 0 };
  const visitorTotal30 = visitors30dRow[0]?.count ?? 0;

  const deviceMap = new Map(deviceRows.map((r) => [r.key || "unknown", r.count]));
  const visitorSum = deviceRows.reduce((sum, r) => sum + r.count, 0);

  const osTotal = osRows.reduce((sum, r) => sum + r.count, 0);
  const browserTotal = browserRows.reduce((sum, r) => sum + r.count, 0);

  return {
    generatedAt: now.toISOString(),
    hasData: lifetimeVisitors > 0 || lifetimeSessions > 0 || recentCount > 0,
    degraded: false,
    trackingSince: firstVisitor?.firstSeenAt.toISOString() ?? null,
    stats: {
      activeNow,
      todayVisitors: today.visitors,
      todaySessions: today.sessions,
      todayPageViews: today.page_views,
      visitors30d: visitorTotal30,
      totalVisitors: lifetimeVisitors,
      totalSessions: lifetimeSessions,
      totalPageViews: lifetimePageViews,
      returning30d: returning.returning,
      new30d: Math.max(returning.sessions - returning.returning, 0),
      mobile30d: (deviceMap.get("mobile") || 0) + (deviceMap.get("tablet") || 0),
      desktop30d: deviceMap.get("desktop") || 0,
    },
    trend: trendRows.map((r) => ({ day: r.day, visitors: r.visitors, pageViews: r.page_views })),
    devices: deviceRows.map((r) => ({ label: r.key || "Unknown", count: r.count, percent: pct(r.count, visitorSum) })),
    operatingSystems: osRows.map((r) => ({ label: r.key || "Other", count: r.count, percent: pct(r.count, osTotal) })),
    browsers: browserRows.map((r) => ({ label: r.key || "Other", count: r.count, percent: pct(r.count, browserTotal) })),
    topPages: pageRows.map((r) => ({ path: r.page_path, label: describePath(r.page_path), views: r.views, visitors: r.visitors })),
    topSections: sectionRows
      .filter((r) => r.section_key)
      .map((r) => ({ key: r.section_key, label: sectionLabel(r.section_key), views: r.views, visitors: r.visitors })),
    liveVisitors: liveSessions.map((s) => ({
      id: shortVisitorRef(s.visitor.anonymousId),
      device: s.deviceName || "Unknown Device",
      deviceCategory: s.deviceCategory,
      os: s.osName || "Other",
      browser: s.browserName || "Other",
      currentPage: describePath(s.lastPath),
      currentSection: s.currentSection ? sectionLabel(s.currentSection) : null,
      lastSeen: s.lastSeenAt.toISOString(),
      startedAt: s.startedAt.toISOString(),
      pageViews: s.pageViewCount,
      isReturning: s.visitor.firstSeenAt.getTime() < s.startedAt.getTime() - 1000,
    })),
    recentActivity: recentEvents.map((e) => ({
      id: e.id,
      device: e.session?.deviceName || "Unknown Device",
      deviceCategory: e.session?.deviceCategory || "unknown",
      label:
        e.eventType === "page_view"
          ? `Opened ${describePath(e.pagePath)}`
          : e.eventType === "section_view"
          ? `Viewed ${sectionLabel(e.sectionKey || "")}`
          : clickLabel(e.targetKey || ""),
      detail: e.eventType === "page_view" ? null : describePath(e.pagePath),
      at: e.createdAt.toISOString(),
    })),
  };
}
