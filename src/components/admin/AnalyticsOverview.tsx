"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, BarChart3, Eye, Globe, RefreshCw, Smartphone, Users } from "lucide-react";
import type { AnalyticsSnapshot, BreakdownRow } from "@/lib/analyticsAdmin";

/**
 * OWNER ADMIN → WEBSITE ANALYTICS
 *
 * Renders only what the server aggregated. Polls a small JSON endpoint every
 * 20 seconds while the tab is visible (and refreshes immediately when the owner
 * returns to the tab). No fabricated numbers — with zero recorded traffic the
 * component shows 0s and an explicit empty state.
 */

const POLL_MS = 20000;
const REFRESH_STALE_MS = 12000;

function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = Math.max(now - new Date(iso).getTime(), 0);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function durationLabel(startIso: string, endIso: string): string {
  const ms = Math.max(new Date(endIso).getTime() - new Date(startIso).getTime(), 0);
  const min = Math.floor(ms / 60000);
  if (min < 1) return "under 1m";
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// ── Small building blocks ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  live,
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  live?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink-3 leading-tight">
          {label}
        </p>
        <span className="text-brand-blue-500/70 shrink-0">{icon}</span>
      </div>
      <p className="text-[30px] sm:text-[38px] font-black text-white tabular-nums leading-none break-words">{value}</p>
      {live ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
          Live
        </span>
      ) : (
        <span className="text-[10px] sm:text-[11px] text-brand-ink-3 truncate">{hint || "\u00a0"}</span>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-white/[0.06]">
        <div className="min-w-0">
          <h3 className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-white">{title}</h3>
          {subtitle ? <p className="text-[10px] text-brand-ink-3 mt-0.5">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-[13px] text-brand-ink-3 py-4 text-center">{text}</p>;
}

function BarList({ rows, emptyText }: { rows: BreakdownRow[]; emptyText: string }) {
  if (!rows.length) return <EmptyRow text={emptyText} />;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-semibold text-white/90 truncate capitalize">{row.label}</span>
            <span className="text-[11px] text-brand-ink-3 tabular-nums shrink-0">
              {row.count} · {row.percent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(row.percent, row.percent > 0 ? 2 : 0)}%`, background: "linear-gradient(90deg,#2F5FD0,#4DA3FF)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── 30-day trend chart (pure SVG, no chart dependency) ──────────────────────

function TrendChart({ points, metric }: { points: AnalyticsSnapshot["trend"]; metric: "visitors" | "pageViews" }) {
  const W = 640;
  const H = 200;
  const padL = 6;
  const padR = 6;
  const padT = 12;
  const padB = 12;

  const values = points.map((p) => p[metric]);
  const max = Math.max(...values, 1);
  const step = points.length > 1 ? (W - padL - padR) / (points.length - 1) : 0;

  const coords = points.map((point, index) => {
    const x = padL + index * step;
    const y = H - padB - (point[metric] / max) * (H - padT - padB);
    return { x, y, value: point[metric] };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = coords.length
    ? `${line} L${coords[coords.length - 1].x.toFixed(1)},${H - padB} L${coords[0].x.toFixed(1)},${H - padB} Z`
    : "";

  // Four evenly spaced x labels (first, 1/3, 2/3, last) — crisp at any width.
  const labelIndexes = points.length
    ? Array.from(new Set([0, Math.floor((points.length - 1) / 3), Math.floor(((points.length - 1) * 2) / 3), points.length - 1]))
    : [];

  return (
    <div className="min-w-0">
      <div className="relative h-[150px] sm:h-[190px] w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          role="img"
          aria-label={`30-day ${metric === "visitors" ? "unique visitors" : "page views"} trend`}
        >
          <defs>
            <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#4DA3FF" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padL}
              x2={W - padR}
              y1={padT + ratio * (H - padT - padB)}
              y2={padT + ratio * (H - padT - padB)}
              stroke="rgba(148,163,184,0.14)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {area ? <path d={area} fill="url(#analyticsArea)" /> : null}
          {line ? <path d={line} fill="none" stroke="#4DA3FF" strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-1 pr-1 pointer-events-none">
          <span className="text-[9px] sm:text-[10px] text-brand-ink-3 tabular-nums">{max}</span>
          <span className="text-[9px] sm:text-[10px] text-brand-ink-3 tabular-nums">{Math.round(max / 2)}</span>
          <span className="text-[9px] sm:text-[10px] text-brand-ink-3 tabular-nums">0</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        {labelIndexes.map((index) => (
          <span key={index} className="text-[9px] sm:text-[10px] text-brand-ink-3 tabular-nums">
            {formatDay(points[index].day)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function AnalyticsOverview({ initial }: { initial: AnalyticsSnapshot }) {
  const [data, setData] = useState<AnalyticsSnapshot>(initial);
  const [metric, setMetric] = useState<"visitors" | "pageViews">("visitors");
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastFetchRef = useRef<number>(0);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/mkpanelzoneadmin/analytics", { cache: "no-store" });
      if (res.ok) {
        setData((await res.json()) as AnalyticsSnapshot);
        lastFetchRef.current = Date.now();
      }
    } catch {
      /* keep the previous snapshot on failure — never blank the page */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    lastFetchRef.current = Date.now();
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void load();
    };
    const interval = window.setInterval(tick, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current > REFRESH_STALE_MS) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    // Keeps "just now" / session durations honest between polls.
    const clock = window.setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.clearInterval(interval);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const { stats, trend, liveVisitors } = data;

  const trendTotal = useMemo(() => trend.reduce((sum, p) => sum + p[metric], 0), [trend, metric]);

  return (
    <div className="space-y-6 min-w-0">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            Website Analytics
            {stats.activeNow > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
                Live
              </span>
            ) : null}
          </h2>
          <p className="text-[11px] sm:text-[12px] text-brand-ink-3 mt-1">
            {data.hasData
              ? `Anonymous first-party tracking active since ${formatDate(data.trackingSince || data.generatedAt)}.`
              : "No visitor activity recorded yet."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-[11px] text-brand-ink-3 tabular-nums">
            Updated {formatClock(data.generatedAt)}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="admin-press inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-ink-2 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Active Now" value={stats.activeNow} live icon={<Activity size={15} />} />
        <StatCard label="Today's Visitors" value={stats.todayVisitors} hint={`${stats.todaySessions} visits · ${stats.todayPageViews} page views`} icon={<Users size={15} />} />
        <StatCard label="30-Day Visitors" value={stats.visitors30d} hint={`${stats.returning30d} returning`} icon={<Globe size={15} />} />
        <StatCard label="Total Page Views" value={stats.totalPageViews} hint={`${stats.totalSessions} total visits`} icon={<Eye size={15} />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Visitors" value={stats.totalVisitors} hint="All-time unique" icon={<Users size={15} />} />
        <StatCard label="30-Day Mobile" value={stats.mobile30d} hint="Phone + tablet" icon={<Smartphone size={15} />} />
        <StatCard label="30-Day Desktop" value={stats.desktop30d} hint="PC / laptop" icon={<BarChart3 size={15} />} />
        <StatCard label="New Visitors" value={stats.new30d} hint="Last 30 days" icon={<Users size={15} />} />
      </div>

      {/* ── Trend + devices ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 min-w-0">
          <Panel
            title="Visitors — Last 30 Days"
            subtitle={data.hasData ? `${trendTotal} ${metric === "visitors" ? "unique visitors" : "page views"} in range` : "No data yet"}
            action={
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                {(["visitors", "pageViews"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMetric(key)}
                    className={`admin-press px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      metric === key ? "bg-brand-blue-500 text-white" : "text-brand-ink-3 hover:text-white"
                    }`}
                  >
                    {key === "visitors" ? "Visitors" : "Page Views"}
                  </button>
                ))}
              </div>
            }
          >
            {data.hasData ? <TrendChart points={trend} metric={metric} /> : <EmptyRow text="No visitor activity recorded yet." />}
          </Panel>
        </div>

        <div className="min-w-0">
          <Panel title="Devices — Last 30 Days" subtitle="Unique visitors by device family">
            <BarList rows={data.devices} emptyText="No device data yet." />
            <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-ink-3 mb-3">Operating Systems</p>
                <BarList rows={data.operatingSystems} emptyText="No OS data yet." />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-ink-3 mb-3">Browsers</p>
                <BarList rows={data.browsers} emptyText="No browser data yet." />
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Top pages + sections ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Most Visited Pages" subtitle="Last 30 days">
          {data.topPages.length ? (
            <ul className="space-y-3">
              {data.topPages.map((row) => (
                <li key={row.path} className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white/90 truncate">{row.label}</p>
                    <p className="text-[10px] text-brand-ink-3 truncate">{row.path}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-white tabular-nums">{row.views}</p>
                    <p className="text-[10px] text-brand-ink-3 tabular-nums">{row.visitors} visitors</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow text="No page views recorded yet." />
          )}
        </Panel>

        <Panel title="Most Viewed Sections" subtitle="Last 30 days">
          {data.topSections.length ? (
            <ul className="space-y-3">
              {data.topSections.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 min-w-0">
                  <p className="text-[13px] font-semibold text-white/90 truncate">{row.label}</p>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-white tabular-nums">{row.views}</p>
                    <p className="text-[10px] text-brand-ink-3 tabular-nums">{row.visitors} visitors</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow text="No section views recorded yet." />
          )}
        </Panel>
      </div>

      {/* ── Live visitors ── */}
      <Panel
        title="Live Visitors"
        subtitle={liveVisitors.length ? `${liveVisitors.length} active in the last 90 seconds` : "Sessions active in the last 90 seconds"}
      >
        {liveVisitors.length ? (
          <ul className="space-y-2.5">
            {liveVisitors.map((visitor) => (
              <li
                key={visitor.id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-3.5 py-3 flex flex-wrap items-start justify-between gap-3 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-dot-pulse shrink-0" />
                    <span className="text-[13px] font-bold text-white truncate">{visitor.device}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3">
                      {visitor.os} · {visitor.browser}
                    </span>
                    {visitor.isReturning ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-blue-500 border border-brand-blue-500/30 rounded px-1.5 py-px">
                        Returning
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[12px] text-brand-ink-2 mt-1.5 truncate">
                    {visitor.currentPage}
                    {visitor.currentSection ? <span className="text-brand-ink-3"> · {visitor.currentSection}</span> : null}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold text-white tabular-nums">{relativeTime(visitor.lastSeen, now)}</p>
                  <p className="text-[10px] text-brand-ink-3 tabular-nums">
                    session {durationLabel(visitor.startedAt, new Date(now).toISOString())} · {visitor.pageViews} views
                  </p>
                  <p className="text-[10px] text-brand-ink-3 font-mono">{visitor.id}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow text="No visitors online right now." />
        )}
      </Panel>

      {/* ── Recent activity ── */}
      <Panel title="Recent Activity" subtitle="Latest recorded events">
        {data.recentActivity.length ? (
          <ul className="space-y-2">
            {data.recentActivity.map((event) => (
              <li key={event.id} className="flex items-start gap-3 min-w-0">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-blue-500/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-white/90 truncate">{event.label}</p>
                  <p className="text-[10px] text-brand-ink-3 truncate">
                    {event.device}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-brand-ink-3 tabular-nums shrink-0 mt-0.5">{relativeTime(event.at, now)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow text="No visitor activity recorded yet." />
        )}
      </Panel>
    </div>
  );
}
