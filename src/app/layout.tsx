import { Manrope, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { prisma } from "@/lib/prisma";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { GlobalPopupProvider } from "@/components/providers/GlobalPopupProvider";
import { FreePanelProvider } from "@/components/freepanel/FreePanelProvider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import Script from "next/script";
import { unstable_cache } from "next/cache";
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: "800",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
import type { Metadata, Viewport } from "next";
export const viewport: Viewport = {
  themeColor: "#03040A",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "MK Panel Zone",
  description: "Premium Digital Products & Resources",
};

/**
 * Global chrome (announcement bar + popups) in ONE cached read.
 *
 * Two things used to make every page slow here:
 *   1. the layout is rendered on EVERY route, so these queries were paid on
 *      every navigation (now cached + deduped),
 *   2. the audience was resolved from `cookies()`, which opted the whole site
 *      out of static rendering. The audience is now resolved in the browser
 *      from a non-sensitive hint cookie, so public pages can be prerendered
 *      and cached again.
 */
const getGlobalChrome = unstable_cache(
  async () => {
    const now = new Date();
    const windowFilter = {
      active: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    const [announcements, popups] = await Promise.all([
      prisma.announcement.findMany({
        where: windowFilter,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.popup.findMany({
        where: windowFilter,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    return { announcements, popups };
  },
  ["global-chrome"],
  { revalidate: 30, tags: ["global-chrome"] }
);

/** Best audience match: an exact scope row wins, otherwise the ALL row. */
function pickForScope<T extends { scope: string }>(rows: T[], scope: "GUESTS" | "MEMBERS"): T | null {
  return rows.find((r) => r.scope === scope) ?? rows.find((r) => r.scope === "ALL") ?? null;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeAnnouncement: Awaited<ReturnType<typeof getGlobalChrome>>["announcements"][number] | null = null;
  let memberAnnouncement: Awaited<ReturnType<typeof getGlobalChrome>>["announcements"][number] | null = null;
  let activePopups: Awaited<ReturnType<typeof getGlobalChrome>>["popups"] = [];
  let memberPopups: Awaited<ReturnType<typeof getGlobalChrome>>["popups"] = [];

  /* Footer WhatsApp link — resolved from the Admin-managed setting (with the
     legacy env fallback). Cached per request, so it costs nothing extra here. */
  let footerWhatsappHref: string | null = null;
  let footerSocialLinks: { platform: string; url: string }[] = [];
  try {
    const { getWhatsAppNumber, getSettings, whatsappLink } = await import("@/lib/settings");
    const [num, s] = await Promise.all([
      getWhatsAppNumber(),
      getSettings(["support_whatsapp_message", "social_links"]),
    ]);
    footerWhatsappHref = whatsappLink(num, s.support_whatsapp_message?.trim() || undefined);
    // Owner-managed social links (admin → Footer). Parsed defensively; a bad
    // value must never break the whole site render.
    try {
      const parsed = JSON.parse((s.social_links as string) || "[]") as { platform: string; url: string; enabled: boolean }[];
      footerSocialLinks = parsed
        .filter((l) => l && l.enabled && typeof l.url === "string" && /^https?:\/\//i.test(l.url))
        .map((l) => ({ platform: l.platform, url: l.url }));
    } catch {
      footerSocialLinks = [];
    }
  } catch (error) {
    console.error("Failed to resolve WhatsApp support link:", error);
  }

  try {
    const chrome = await getGlobalChrome();
    activeAnnouncement = pickForScope(chrome.announcements, "GUESTS");
    memberAnnouncement = pickForScope(chrome.announcements, "MEMBERS");
    activePopups = chrome.popups.filter((p) => p.scope === "ALL" || p.scope === "GUESTS");
    memberPopups = chrome.popups.filter((p) => p.scope === "MEMBERS");
  } catch (error) {
    console.error("Failed to fetch global announcements and popups:", error);
  }

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Theme anti-flash: reads localStorage before hydration so no light→dark flicker */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("theme");
                  var theme = saved ? saved : "dark";
                  document.documentElement.setAttribute("data-theme", theme);
                } catch(e) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `
          }}
        />
        <Script
          id="perf-probe"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              /* ---------------------------------------------------------*
               * INTRO HARD FAIL-SAFE
               *
               * Plain DOM JavaScript, registered before any framework code.
               * It cannot depend on React hydrating, on an animation library,
               * on requestAnimationFrame, or on transitionend/animationend —
               * those are exactly the things that used to leave the overlay
               * covering the site on older iPhones. Whatever happens, the
               * overlay is removed and the page becomes usable.
               * --------------------------------------------------------- */
              window.__mkReveal = function () {
                try {
                  var el = document.documentElement;
                  el.setAttribute("data-intro", "off");
                  el.removeAttribute("data-intro-run");
                  var node = document.getElementById("mk-intro");
                  if (node && node.parentNode) node.parentNode.removeChild(node);
                  if (document.body) {
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.height = "";
                  }
                  try { sessionStorage.setItem("mk_intro_seen", "true"); } catch (e) {}
                } catch (e) {}
              };
              /* Last resort: the sequence's own tail is ~4.3s. */
              window.__mkIntroCap = setTimeout(window.__mkReveal, 7000);

              (function() {
                try {
                  var hasSeen = sessionStorage.getItem("mk_intro_seen");
                  var params = new URLSearchParams(window.location.search);
                  var force = params.get("intro");
                  var isHome = window.location.pathname === "/";
                  var prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

                  var isSlow = false;
                  if (navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4 || 
                      (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType.includes("2g") || navigator.connection.effectiveType.includes("3g")))) {
                    isSlow = true;
                  }

                  if (force === "skip" || (!force && (hasSeen || !isHome))) {
                    document.documentElement.setAttribute("data-intro", "off");
                    if (isSlow) document.documentElement.setAttribute("data-perf", "low");
                    return;
                  }

                  var tier = isSlow ? "lite" : "full";
                  if (force === "lite") tier = "lite";
                  if (force === "full") tier = "full";
                  if (force === "reduced") tier = "reduced";
                  // prefers-reduced-motion still gets a real (short) sequence:
                  // signal -> masked wordmark reveal -> split shutter. Never a fade.
                  if (prm && !force) tier = "reduced";

                  if (tier === "reduced") {
                    document.documentElement.setAttribute("data-intro", "reduced");
                    if (isSlow) document.documentElement.setAttribute("data-perf", "low");
                    return;
                  }

                  if (tier === "lite") {
                    document.documentElement.setAttribute("data-intro", "lite");
                    document.documentElement.setAttribute("data-perf", "low");
                    return;
                  }

                  // Start as full, but probe the opening frames.
                  document.documentElement.setAttribute("data-intro", "full");

                  // An explicit ?intro= override always wins — no probing.
                  if (force) return;

                  var frames = 0;
                  var totalTime = 0;
                  var lastTime = 0;

                  function probe(time) {
                    // Once React has armed the sequence, leave it alone: a late
                    // downgrade would cut the animation off mid-flight.
                    if (document.documentElement.getAttribute("data-intro-run") === "1") return;
                    if (lastTime === 0) {
                      lastTime = time;
                      requestAnimationFrame(probe);
                      return;
                    }
                    var delta = time - lastTime;
                    lastTime = time;
                    totalTime += delta;
                    frames++;

                    if (frames < 12) {
                      requestAnimationFrame(probe);
                      return;
                    }

                    // Sustained slowness only — a single long frame (GC, a lazy
                    // chunk, dev tooling) must never cancel the brand sequence.
                    var avg = totalTime / frames;
                    if (avg > 26) {
                      document.documentElement.setAttribute("data-intro", "lite");
                      document.documentElement.setAttribute("data-perf", "low");
                    }
                  }
                  requestAnimationFrame(probe);
                } catch(e) {
                  document.documentElement.setAttribute("data-intro", "off");
                }
              })();
            `
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${manrope.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col font-sans relative overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AnnouncementBar
            announcement={activeAnnouncement}
            memberAnnouncement={memberAnnouncement}
          />
          <FreePanelProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer whatsappHref={footerWhatsappHref} socialLinks={footerSocialLinks} />
          </FreePanelProvider>
          <GlobalPopupProvider popups={activePopups} memberPopups={memberPopups} />
          {/* First-party, anonymous website analytics (owner-only dashboard). */}
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
