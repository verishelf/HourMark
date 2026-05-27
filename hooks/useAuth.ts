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
    const p = await getProfile(userId);
    setProfile(p);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

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
