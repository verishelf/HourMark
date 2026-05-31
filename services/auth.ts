import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  if (error) throw error;

  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      username,
      verified: false,
    });
  }
  return data;
}

export async function signInWithApple(identityToken: string, nonce: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(idToken: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function functionInvokeErrorMessage(error: unknown): Promise<string> {
  const err = error as { context?: Response; message?: string };
  if (err?.context && typeof err.context.json === "function") {
    try {
      const body = (await err.context.json()) as { message?: string };
      if (body?.message) return body.message;
    } catch {
      // Response body not JSON
    }
  }
  return err?.message ?? "Failed to delete account";
}

export async function deleteAccount() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });

  if (error) throw new Error(await functionInvokeErrorMessage(error));
  if (data?.message) throw new Error(data.message as string);

  await signOut();
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "username" | "full_name" | "avatar_url" | "bio">>
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}
