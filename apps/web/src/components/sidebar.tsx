"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Archive,
  PenTool,
  LayoutDashboard,
  RefreshCw,
  Upload,
  Home,
  Rocket,
  Hexagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/controls", label: "Controls", icon: Shield },
      { href: "/evidence", label: "Evidence Vault", icon: Archive },
      { href: "/narrative-studio", label: "Narrative Studio", icon: PenTool },
    ],
  },
  {
    label: "Programs",
    items: [
      { href: "/govramp", label: "GovRAMP Journey", icon: Rocket },
      { href: "/soc2", label: "SOC 2 Reuse", icon: RefreshCw },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/boards", label: "Boards", icon: LayoutDashboard },
      { href: "/imports", label: "Imports", icon: Upload },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] flex-col bg-navy text-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <Hexagon className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight leading-tight">
            Project Atelier
          </h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
            Narrative Studio
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-white/12 text-white shadow-sm"
                        : "text-white/60 hover:bg-white/8 hover:text-white/90"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-emerald-400" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-emerald-400" : "text-white/40 group-hover:text-white/70"
                    )} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
        <p className="text-[10px] text-white/30 font-medium">v1.0</p>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] text-white/30 font-medium">Connected</p>
        </div>
      </div>
    </aside>
  );
}
