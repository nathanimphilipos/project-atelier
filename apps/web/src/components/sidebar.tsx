"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileText,
  Archive,
  PenTool,
  LayoutDashboard,
  RefreshCw,
  Upload,
  Home,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/controls", label: "Controls", icon: Shield },
  { href: "/evidence", label: "Evidence Vault", icon: Archive },
  { href: "/narrative-studio", label: "Narrative Studio", icon: PenTool },
  { href: "/govramp", label: "GovRAMP Journey", icon: Rocket },
  { href: "/boards", label: "Boards", icon: LayoutDashboard },
  { href: "/soc2", label: "SOC 2 Reuse", icon: RefreshCw },
  { href: "/imports", label: "Imports", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-navy text-white">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <FileText className="h-6 w-6 text-green-400" />
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Project Atelier
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50">
            Narrative Studio
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[10px] text-white/40">v1.0 · Localhost</p>
      </div>
    </aside>
  );
}
