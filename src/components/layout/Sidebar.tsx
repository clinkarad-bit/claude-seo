"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  PenLine,
  TrendingUp,
  GitCompare,
  Eye,
  FileBarChart,
  Settings,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomer } from "@/components/providers/CustomerProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState, useRef, useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/keywords", label: "Keywords", icon: Search },
  { href: "/content-writer", label: "Content-Writer", icon: PenLine },
  { href: "/rank-tracker", label: "Rank-Tracker", icon: TrendingUp },
  { href: "/content-gap", label: "Content-Gap-Analyse", icon: GitCompare },
  { href: "/wettbewerber", label: "Wettbewerber", icon: Eye },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

const settingsItem: NavItem = {
  href: "/einstellungen",
  label: "Einstellungen",
  icon: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { customers, activeCustomer, setActiveCustomer } = useCustomer();
  const { theme, setTheme } = useTheme();
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get initials for avatar
  function getInitials(name: string) {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/50 bg-card">
      {/* Logo + Customer Selector */}
      <div className="border-b border-border/50 px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-foreground tracking-tight">
            SEOPilot
          </span>
        </Link>

        {/* Customer Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            {activeCustomer ? (
              <>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {getInitials(activeCustomer.companyName)}
                </span>
                <span className="flex-1 truncate text-left font-medium">
                  {activeCustomer.companyName}
                </span>
              </>
            ) : (
              <span className="flex-1 text-left text-muted-foreground">
                Kunde auswählen...
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {customerDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-1 shadow-lg">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCustomer(c);
                    setCustomerDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted",
                    activeCustomer?.id === c.id && "bg-muted"
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {getInitials(c.companyName)}
                  </span>
                  <span className="truncate">{c.companyName}</span>
                </button>
              ))}
              {customers.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Keine Kunden vorhanden
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        <div className="space-y-0.5">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Einstellungen
          </p>
          <Link
            href={settingsItem.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(settingsItem.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <settingsItem.icon className="h-4 w-4 shrink-0" />
            {settingsItem.label}
          </Link>
        </div>
      </nav>

      {/* Footer: Theme + New Customer */}
      <div className="border-t border-border/50 p-3 space-y-2">
        {/* Theme Toggle */}
        <div className="flex items-center justify-center gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-md text-xs transition-colors",
              theme === "light"
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-md text-xs transition-colors",
              theme === "dark"
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-md text-xs transition-colors",
              theme === "system"
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* New Customer Button */}
        <button
          onClick={() => router.push("/?new=true")}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Neuen Kunden anlegen
        </button>
      </div>
    </aside>
  );
}
