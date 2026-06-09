"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Watch,
  UserPlus,
  Building2,
  Mail,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Headphones,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  Crown,
  X,
  BookOpen,
  BellRing,
  Share2,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/types/database";
import { canAccessRoute } from "@/lib/permissions";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Listings", icon: Watch },
  { href: "/users", label: "Users", icon: Users },
  { href: "/leads", label: "Seller Leads", icon: UserPlus },
  { href: "/dealers", label: "Dealers", icon: Building2 },
  { href: "/campaigns", label: "Email Campaigns", icon: Mail },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/push-notifications", label: "Push Notifications", icon: BellRing },
  { href: "/social-media", label: "Social Media", icon: Share2 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/authentication", label: "Authentication", icon: ShieldCheck },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  role,
  mobileOpen = false,
  onMobileClose,
}: {
  role: AdminRole | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[min(100vw-3rem,16rem)] flex-col border-r border-border bg-background transition-transform duration-200 md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-widest uppercase">Crownly</p>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 md:p-4">
          {navItems.map((item) => {
            if (!canAccessRoute(role, item.href)) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
