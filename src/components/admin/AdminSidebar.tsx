"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Menu,
  X,
  Activity,
  Users,
  UserPlus,
  ShoppingCart,
  Package,
  Film,
  CreditCard,
  HardDrive,
  Layers,
  FileText,
  Megaphone,
  MessageSquare,
  Palette,
  LifeBuoy,
  Settings,
  ScrollText,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Navigation is grouped by what the operator is actually doing —
 * observe, manage people, manage the store, manage access, manage the
 * public site, then the system itself. Ordering follows frequency of use.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ name: "Overview", href: "/mkpanelzoneadmin", icon: Activity, exact: true }],
  },
  {
    label: "Management",
    items: [
      { name: "Customers", href: "/mkpanelzoneadmin/customers", icon: UserPlus },
      { name: "Agents", href: "/mkpanelzoneadmin/agents", icon: Users },
      { name: "Orders", href: "/mkpanelzoneadmin/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Store",
    items: [
      { name: "Products", href: "/mkpanelzoneadmin/products", icon: Package },
      { name: "Product Media", href: "/mkpanelzoneadmin/media", icon: Film },
      { name: "Payment Methods", href: "/mkpanelzoneadmin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Access",
    items: [
      { name: "Platform Resources", href: "/mkpanelzoneadmin/resources", icon: HardDrive },
      { name: "Packages", href: "/mkpanelzoneadmin/packages", icon: Layers },
    ],
  },
  {
    label: "Website",
    items: [
      { name: "Content Manager", href: "/mkpanelzoneadmin/content", icon: FileText },
      { name: "Announcements", href: "/mkpanelzoneadmin/announcements", icon: Megaphone },
      { name: "Popups", href: "/mkpanelzoneadmin/popups", icon: MessageSquare },
      { name: "Website Design", href: "/mkpanelzoneadmin/design", icon: Palette },
      { name: "Footer", href: "/mkpanelzoneadmin/footer", icon: Layers },
      { name: "Support", href: "/mkpanelzoneadmin/support", icon: LifeBuoy },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/mkpanelzoneadmin/settings", icon: Settings },
      { name: "Audit Log", href: "/mkpanelzoneadmin/audit", icon: ScrollText },
    ],
  },
];

const COLLAPSE_KEY = "mk_admin_sidebar_collapsed";

/* ── Collapsed-preference store ──────────────────────────────────────────────
   A tiny external store over localStorage.

   The preference used to be read inside an effect (`setCollapsed(...)` on mount)
   purely to avoid touching localStorage during server rendering, which cost a
   cascading render on every page load. `useSyncExternalStore` is the primitive
   for reading a value that only exists on the client: it uses the server
   snapshot during SSR and hydration, then the real value — no effect, no second
   render. Writing notifies subscribers so the toggle updates immediately.
   ------------------------------------------------------------------------- */

const collapseListeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    /* Storage can throw in private modes — default to expanded. */
    return false;
  }
}

function writeCollapsed(next: boolean): void {
  try {
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    /* Non-fatal: the toggle still works for this session. */
  }
  collapseListeners.forEach((notify) => notify());
}

function subscribeCollapsed(notify: () => void): () => void {
  collapseListeners.add(notify);
  return () => {
    collapseListeners.delete(notify);
  };
}

const getServerCollapsed = () => false;

/**
 * AdminSidebar — persistent, collapsible, grouped control-room navigation
 * (spec §21).
 *
 * Desktop: sticky rail that can collapse to an icon-only strip (persisted).
 * Mobile:  a proper drawer with a dimmed backdrop.
 * The active item is marked by an accent rail + tinted surface + lit icon —
 * three signals, so it reads at a glance without relying on colour alone.
 */
export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const [drawerFor, setDrawerFor] = useState<string | null>(null);

  /*
    The drawer is open only while the pathname still matches the one it was opened
    on. This replaces an effect that called `setIsMobileOpen(false)` whenever
    `pathname` changed — a cascading render, and redundant because every link in
    the drawer already closes it. Deriving the state covers the case those
    handlers miss: browser back/forward.
  */
  const isMobileOpen = drawerFor === pathname;
  const setIsMobileOpen = (next: boolean) => setDrawerFor(next ? pathname : null);

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    getServerCollapsed
  );

  const toggleCollapsed = () => writeCollapsed(!collapsed);

  // Lock scroll + Escape to close while the drawer is open
  useEffect(() => {
    if (!isMobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    /* `setDrawerFor` is the stable state setter; using it directly avoids
       depending on the per-render `setIsMobileOpen` closure. */
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerFor(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isMobileOpen]);

  const railWidth = collapsed ? "lg:w-[76px]" : "lg:w-[264px]";

  return (
    <>
      {/* ── MOBILE TOP BAR ── */}
      <div className="sticky top-0 z-[100] flex items-center justify-between border-b border-border-subtle bg-[color:var(--background)]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-border-strong"
            style={{ background: "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))" }}
            aria-hidden
          >
            <Shield size={16} className="text-brand-ink-2" />
          </span>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.13em] text-foreground">
              MK Panel
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink-2">
              Control Room
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isMobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border-subtle text-brand-ink-2 transition-colors hover:text-foreground"
        >
          <Menu size={19} />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[105] md:hidden"
              style={{ background: "rgba(4,6,10,0.7)", backdropFilter: "blur(6px)" }}
              aria-hidden
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[110] flex w-[286px] max-w-[86vw] flex-col border-r border-border-subtle bg-[color:var(--surface)] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
            >
              <div className="flex items-center justify-between border-b border-border-subtle p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-border-strong"
                    style={{ background: "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))" }}
                    aria-hidden
                  >
                    <Shield size={16} className="text-brand-ink-2" />
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                      MK Panel Zone
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink-2">
                      Owner control
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] text-brand-ink-3 transition-colors hover:text-foreground"
                >
                  <X size={17} />
                </button>
              </div>

              <NavList pathname={pathname} onNavigate={() => setIsMobileOpen(false)} />

              <SidebarFooter username={username} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP RAIL ── */}
      <aside
        className={`hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-border-subtle md:bg-[color:var(--surface)] md:transition-[width] md:duration-300 md:ease-[cubic-bezier(.22,1,.36,1)] ${railWidth}`}
      >
        {/* Brand */}
        <div
          className={`flex items-center gap-3 border-b border-border-subtle py-5 ${
            collapsed ? "justify-center px-3" : "px-5"
          }`}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border-strong"
            style={{ background: "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))" }}
            aria-hidden
          >
            <Shield size={18} className="text-brand-ink-2" />
          </span>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold uppercase tracking-[0.11em] text-foreground">
                MK Panel Zone
              </p>
              <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-ink-2">
                Owner control
              </p>
            </div>
          )}
        </div>

        <NavList pathname={pathname} collapsed={collapsed} />

        <SidebarFooter username={username} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>
    </>
  );
}

/* ── Grouped navigation list ───────────────────────────────────── */
function NavList({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="styled-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          {collapsed ? (
            <div className="mx-auto mb-2.5 h-px w-6 bg-border-subtle" aria-hidden />
          ) : (
            <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-ink-4">
              {group.label}
            </p>
          )}

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.name : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex items-center rounded-[10px] transition-colors duration-150 ${
                      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-[var(--ambient-strong)] text-foreground"
                        : "text-brand-ink-3 hover:bg-foreground/[0.03] hover:text-foreground"
                    }`}
                  >
                    {/* Animated active rail */}
                    {isActive && (
                      <motion.span
                        layoutId="admin-active-rail"
                        className="absolute left-0 top-1/2 h-[56%] w-[3px] -translate-y-1/2 rounded-r-full bg-brand-blue-400"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        aria-hidden
                      />
                    )}

                    <Icon
                      size={17}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? "text-brand-ink-2"
                          : "text-brand-ink-4 group-hover:text-foreground"
                      }`}
                      aria-hidden
                    />

                    {!collapsed && (
                      <span className="truncate text-[13px] font-semibold tracking-[-0.005em]">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ── Identity + collapse control ───────────────────────────────── */
function SidebarFooter({
  username,
  collapsed = false,
  onToggleCollapse,
}: {
  username: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface-raised/50 p-3">
      {!collapsed && (
        <div className="mb-3 px-2">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-brand-ink-4">
            Authenticated as
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--status-success-text)] animate-dot-pulse"
              aria-hidden
            />
            <p className="truncate text-[13px] font-bold text-foreground">{username}</p>
          </div>
        </div>
      )}

      <div className={`flex items-center gap-1.5 ${collapsed ? "flex-col" : ""}`}>
        <Link
          href="/"
          target="_blank"
          title="View live site"
          className={`flex items-center justify-center rounded-[10px] border border-border-subtle text-brand-ink-3 transition-colors hover:border-border-strong hover:text-foreground ${
            collapsed ? "h-10 w-10" : "h-10 flex-1 gap-2"
          }`}
        >
          <ExternalLink size={14} aria-hidden />
          {!collapsed && <span className="text-[11.5px] font-bold uppercase tracking-[0.07em]">Live site</span>}
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center justify-center rounded-[10px] border border-border-subtle text-brand-ink-3 transition-colors hover:border-border-strong hover:text-foreground ${
              collapsed ? "h-10 w-10" : "h-10 w-10"
            }`}
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
