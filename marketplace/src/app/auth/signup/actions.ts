"use server";

import { createClient } from "@/lib/supabase/server";

function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) return "Username must be at least 3 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export async function signUpAction(formData: FormData): Promise<{
  error: string | null;
  needsEmailConfirmation?: boolean;
}> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!email || !password || !username) {
    return { error: "Email, username, and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  const supabase = await createClient();
  if (!supabase) {
    return {
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    };
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing) {
    return { error: "This username is already taken." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) return { error: error.message };

  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      username,
      verified: false,
    });
  }

  return {
    error: null,
    needsEmailConfirmation: Boolean(data.user && !data.session),
  };
}
