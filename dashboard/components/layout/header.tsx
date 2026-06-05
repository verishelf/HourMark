"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AdminRole } from "@/types/database";

export function Header({
  userName,
  role,
}: {
  userName: string;
  role: AdminRole | null;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{userName}</p>
          {role && (
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
