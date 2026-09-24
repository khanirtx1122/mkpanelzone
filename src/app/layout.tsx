import { Manrope, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { prisma } from "@/lib/prisma";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { GlobalPopupProvider } from "@/components/providers/GlobalPopupProvider";
import type { Popup } from "@prisma/client";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070A0F" },
    { media: "(prefers-color-scheme: light)", color: "#F2F5FA" },
  ],
  colorScheme: "dark light",
};

/**
 * Site metadata is driven by the `site_*` settings edited in
 * Control Room → Settings. Previously those fields were write-only: the admin
 * UI persisted them but nothing read them, so editing the site name or meta
 * description had no effect. Wrapped in try/catch with literal fallbacks so a
 * database outage degrades to the defaults instead of breaking every page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: {
      default: "MK Panel Zone",
      template: "%s | MK Panel Zone",
    },
    description: "Premium Digital Products & Resources",
  };

  try {
    const { getSettings } = await import("@/lib/settings");
    const s = await getSettings([
      "site_name",
      "site_url",
      "site_description",
      "site_keywords",
    ]);

    const name = s.site_name?.trim() || "MK Panel Zone";
    const description =
      s.site_description?.trim() || "Premium Digital Products & Resources";
    const keywords = s.site_keywords
      ? s.site_keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined;

    return {
      metadataBase: s.site_url?.trim() ? new URL(s.site_url.trim()) : undefined,
      title: { default: name, template: `%s | ${name}` },
      description,
      ...(keywords ? { keywords } : {}),
      openGraph: {
        title: name,
        description,
        type: "website",
      },
    };
  } catch {
    return fallback;
  }
}

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
  let activePopups: Popup[] = [];

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

  /* Site chrome settings (logo + footer). Same rationale as generateMetadata:
     these keys were editable but unread. A failure falls back to the designed
     defaults rather than blanking the navbar or footer. */
  let chrome: {
    logoUrl?: string;
    copyright?: string;
    description?: string;
    discord?: string;
    youtube?: string;
    contactEmail?: string;
  } = {};

  try {
    const { getSettings } = await import("@/lib/settings");
    const s = await getSettings([
      "design_logo_url",
      "footer_copyright",
      "footer_description",
      "footer_social_discord",
      "footer_social_youtube",
      "content_contact_email",
    ]);
    chrome = {
      logoUrl: s.design_logo_url?.trim() || undefined,
      copyright: s.footer_copyright?.trim() || undefined,
      description: s.footer_description?.trim() || undefined,
      discord: s.footer_social_discord?.trim() || undefined,
      youtube: s.footer_social_youtube?.trim() || undefined,
      contactEmail: s.content_contact_email?.trim() || undefined,
    };
  } catch (error) {
    console.error("Failed to load site chrome settings:", error);
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
                /* Signals that scripting is available. Progressive-enhancement
                   CSS keys off this so JS-only affordances (tab panels) degrade
                   to "everything visible" instead of "everything hidden". */
                document.documentElement.setAttribute("data-js", "on");
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

                  if (force === "skip" || (!force && (hasSeen || !isHome || prm))) {
                    document.documentElement.setAttribute("data-intro", "off");
                    if (isSlow) document.documentElement.setAttribute("data-perf", "low");
                    return;
                  }

                  var tier = isSlow ? "lite" : "full";
                  if (force === "lite") tier = "lite";
                  if (force === "full") tier = "full";

                  if (tier === "lite") {
                    document.documentElement.setAttribute("data-intro", "lite");
                    document.documentElement.setAttribute("data-perf", "low");
                    return;
                  }

                  // Start as full, but probe
                  document.documentElement.setAttribute("data-intro", "full");
                  
                  var frames = 0;
                  var totalTime = 0;
                  var lastTime = 0;
                  
                  function probe(time) {
                    if (lastTime === 0) {
                      lastTime = time;
                      requestAnimationFrame(probe);
                      return;
                    }
                    var delta = time - lastTime;
                    lastTime = time;
                    totalTime += delta;
                    frames++;
                    
                    if (delta > 200) {
                      document.documentElement.setAttribute("data-intro", "off");
                      document.documentElement.setAttribute("data-perf", "low");
                      return;
                    }
                    
                    if (frames < 12) {
                      requestAnimationFrame(probe);
                    } else {
                      var avg = totalTime / frames;
                      if (avg > 22) {
                        document.documentElement.setAttribute("data-intro", "lite");
                        document.documentElement.setAttribute("data-perf", "low");
                      }
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
          <ToastProvider>
            <AnnouncementBar announcement={activeAnnouncement} />
            <Navbar isLoggedIn={hasSession} logoUrl={chrome.logoUrl} />
            <main className="flex-1">
              {children}
            </main>
            <Footer
              copyright={chrome.copyright}
              description={chrome.description}
              discord={chrome.discord}
              youtube={chrome.youtube}
              contactEmail={chrome.contactEmail}
            />
            <GlobalPopupProvider popups={activePopups} />
            <CustomCursor />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
