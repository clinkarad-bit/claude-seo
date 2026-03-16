"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Search,
  FileText,
  PenLine,
  BarChart3,
  Sparkles,
  Link2,
  FolderKanban,
  ArrowUpRight,
  GitCompare,
  AtSign,
  Link as LinkIcon,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Start", icon: LayoutDashboard },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/themenrecherche", label: "Themenrecherche", icon: Search },
  { href: "/outlines", label: "Outlines", icon: FileText },
  { href: "/content", label: "Content Pieces", icon: PenLine },
  { href: "/performance", label: "Performance", icon: BarChart3 },
];

const lbNavItems = [
  { href: "/linkbuilding", label: "LB Dashboard", icon: Link2 },
  { href: "/linkbuilding/projekte", label: "Projekte", icon: FolderKanban },
  { href: "/linkbuilding/backlinks", label: "Backlinks", icon: ArrowUpRight },
  { href: "/linkbuilding/gap-analyse", label: "Gap-Analyse", icon: GitCompare },
  { href: "/linkbuilding/mentions", label: "Brand Mentions", icon: AtSign },
  { href: "/linkbuilding/broken-links", label: "Broken Links", icon: LinkIcon },
  { href: "/linkbuilding/kontakte", label: "Kontakte", icon: Contact },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Claude SEO</p>
          <p className="text-xs text-muted-foreground">Content Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Linkbuilding Separator */}
        <div className="flex items-center gap-2 px-3 pb-1 pt-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">Linkbuilding</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {lbNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/linkbuilding"
              ? pathname === "/linkbuilding"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          SEO & Content Automation
        </p>
        <p className="text-xs text-muted-foreground/60">v0.1.0</p>
      </div>
    </aside>
  );
}
