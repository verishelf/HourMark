"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminRole } from "@/types/database";

export function useAdmin() {
  const [admin, setAdmin] = useState<{
    id: string;
    email: string;
    fullName: string;
    role: AdminRole | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("id, full_name, username, admin_role")
        .eq("id", user.id)
        .single();

      setAdmin({
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? profile?.username ?? "Admin",
        role: (profile?.admin_role as AdminRole) ?? null,
      });
      setLoading(false);
    }

    load();
  }, []);

  return { admin, loading };
}
