import { useCallback, useEffect, useState } from "react";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
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
      const p = await fetchWithRetry(async () => {
        const profile = await getProfile(userId);
        if (!profile) throw new Error("Profile unavailable");
        return profile;
      });
      setProfile(p);
    } catch {
      // Keep existing profile state on transient failures.
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await fetchWithRetry(() => supabase.auth.getSession());
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        }
      } catch {
        // Session fetch failed (e.g. Supabase 522); user can retry after reconnect.
      } finally {
        setLoading(false);
      }
    })();

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

  const refreshProfile = useCallback(() => {
    if (session?.user) return loadProfile(session.user.id);
  }, [session?.user?.id, loadProfile]);

  return {
    session,
    profile,
    user: session?.user ?? null,
    loading,
    isAuthenticated: Boolean(session),
    refreshProfile,
  };
}
