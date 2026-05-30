import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/services/auth";
import type { UserProfile } from "@/types";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch {
      // Ignore transient Supabase/network errors; keep existing profile state.
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          void loadProfile(data.session.user.id);
        }
      })
      .catch(() => {
        // Session fetch failed (e.g. Supabase 522); user can retry after reconnect.
      })
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  return {
    session,
    profile,
    user: session?.user ?? null,
    loading,
    isAuthenticated: Boolean(session),
    refreshProfile: () => {
      if (session?.user) return loadProfile(session.user.id);
    },
  };
}
