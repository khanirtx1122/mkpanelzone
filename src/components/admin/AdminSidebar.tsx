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
  Gift,
  Settings, 
  ScrollText 
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

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

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { name: "Overview", href: "/mkpanelzoneadmin", icon: Activity, exact: true },
    ]
  },
  {
    label: "Management",
    items: [
      { name: "Customers", href: "/mkpanelzoneadmin/customers", icon: UserPlus },
      { name: "Agents", href: "/mkpanelzoneadmin/agents", icon: Users },
      { name: "Orders", href: "/mkpanelzoneadmin/orders", icon: ShoppingCart },
    ]
  },
  {
    label: "Store",
    items: [
      { name: "Products", href: "/mkpanelzoneadmin/products", icon: Package },
      { name: "Product Media", href: "/mkpanelzoneadmin/media", icon: Film },
      { name: "Payment Methods", href: "/mkpanelzoneadmin/payments", icon: CreditCard },
    ]
  },
  {
    label: "Access",
    items: [
      { name: "Platform Resources", href: "/mkpanelzoneadmin/resources", icon: HardDrive },
      { name: "Packages", href: "/mkpanelzoneadmin/packages", icon: Layers },
    ]
  },
  {
    label: "Website",
    items: [
      { name: "Content Manager", href: "/mkpanelzoneadmin/content", icon: FileText },
      { name: "Announcements", href: "/mkpanelzoneadmin/announcements", icon: Megaphone },
      { name: "Popups", href: "/mkpanelzoneadmin/popups", icon: MessageSquare },
      { name: "Free Panel Offer", href: "/mkpanelzoneadmin/free-panel", icon: Gift },
      { name: "Website Design", href: "/mkpanelzoneadmin/design", icon: Palette },
      { name: "Footer", href: "/mkpanelzoneadmin/footer", icon: Layers },
      { name: "Support", href: "/mkpanelzoneadmin/support", icon: LifeBuoy },
    ]
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/mkpanelzoneadmin/settings", icon: Settings },
      { name: "Audit Log", href: "/mkpanelzoneadmin/audit", icon: ScrollText },
    ]
  }
];

export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Escape closes the drawer; lock scroll while open.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Top Header (replaces the desktop sidebar header on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black z-[100] sticky top-0">
        <div className="flex items-center gap-3 text-brand-blue-500">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue-500/20 to-brand-blue-600/10 border border-brand-blue-500/20 flex items-center justify-center">
            <Shield size={16} className="text-brand-blue-400" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-widest text-xs uppercase leading-tight text-white">MK PANEL</h1>
          </div>
        </div>
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsMobileOpen(true);
          }}
          className="admin-press p-2.5 -mr-1 text-brand-ink-2 hover:text-white transition-colors cursor-pointer rounded-lg active:bg-white/10"
          aria-label="Open menu"
          aria-expanded={isMobileOpen}
        >
          <Menu size={26} className="pointer-events-none" />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 drawer-backdrop z-[90] md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-[86%] max-w-xs md:w-64 lg:w-72 bg-[#05070C] border-r border-white/5 flex flex-col shrink-0 z-[100] transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
        aria-label="Admin navigation"
      >
        {/* Mobile drawer header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 text-brand-blue-500">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue-500/20 to-brand-blue-600/10 border border-brand-blue-500/20 flex items-center justify-center">
              <Shield size={18} className="text-brand-blue-400" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-widest text-xs uppercase leading-tight text-white">MK PANEL ZONE</h1>
              <p className="text-[10px] tracking-[0.2em] font-bold text-brand-blue-500">OWNER CONTROL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="admin-press p-2 text-brand-ink-2 hover:text-white rounded-lg active:bg-white/10"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 text-brand-blue-500">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue-500/20 to-brand-blue-600/10 border border-brand-blue-500/20 flex items-center justify-center">
              <Shield size={20} className="text-brand-blue-400" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-widest text-sm uppercase leading-tight text-white">MK PANEL ZONE</h1>
              <p className="text-[10px] tracking-[0.2em] font-bold text-brand-blue-500">OWNER CONTROL</p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 styled-scrollbar">
          {NAV_GROUPS.map((group, i) => (
            <div key={i} className="mb-6 last:mb-0">
              <p className="px-4 text-[11px] font-bold tracking-widest text-brand-ink-3 uppercase mb-2">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      onClick={() => setIsMobileOpen(false)}
                      className={`admin-press flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-lg transition-all group relative active:bg-white/10 ${
                        isActive 
                          ? "bg-[#0E1420] text-white font-bold" 
                          : "text-brand-ink-2 hover:text-white hover:bg-white/5 font-medium"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-blue-500 rounded-r-md" />
                      )}
                      <Icon size={18} className={`transition-colors shrink-0 ${isActive ? 'text-brand-blue-400' : 'group-hover:text-brand-blue-400'}`} />
                      <span className="tracking-wide text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-white/5 shrink-0 bg-[#080B13]">
          <div className="mb-2">
            <p className="text-[10px] text-brand-ink-3 uppercase tracking-widest font-bold mb-1">Authenticated Identity</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <p className="text-sm font-bold text-white tracking-wide">{username}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
