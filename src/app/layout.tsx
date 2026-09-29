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

import { cookies } from "next/headers";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("mk_session");
  const scope = hasSession ? "MEMBERS" : "GUESTS";

  let activeAnnouncement = null;
  let activePopups: any[] = [];

  try {
    const now = new Date();
    activeAnnouncement = await prisma.announcement.findFirst({
      where: {
        active: true,
        OR: [{ scope: "ALL" }, { scope }],
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    activePopups = await prisma.popup.findMany({
      where: {
        active: true,
        OR: [{ scope: "ALL" }, { scope }],
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
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
          <AnnouncementBar announcement={activeAnnouncement} />
          <FreePanelProvider>
            <Navbar isLoggedIn={hasSession} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </FreePanelProvider>
          <GlobalPopupProvider popups={activePopups} />
          {/* First-party, anonymous website analytics (owner-only dashboard). */}
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
