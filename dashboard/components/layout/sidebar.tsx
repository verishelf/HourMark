"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Watch,
  UserPlus,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/database";
import { canAccessRoute } from "@/lib/permissions";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Listings", icon: Watch },
  { href: "/users", label: "Users", icon: Users },
  { href: "/leads", label: "Seller Leads", icon: UserPlus },
  { href: "/campaigns", label: "Email Campaigns", icon: Mail },
  { href: "/authentication", label: "Authentication", icon: ShieldCheck },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: { role: AdminRole | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Crown className="h-6 w-6" />
        <div>
          <p className="text-sm font-semibold tracking-widest uppercase">Crownly</p>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          if (!canAccessRoute(role, item.href)) return null;
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
