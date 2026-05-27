import type { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export type AuthenticatedRequest = Request & {
  userId?: string;
  accessToken?: string;
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing authorization token" });
    return;
  }

  const token = header.slice(7);
  if (!env.supabaseUrl) {
    res.status(503).json({ message: "Auth service unavailable" });
    return;
  }

  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    res.status(503).json({ message: "SUPABASE_ANON_KEY required for auth" });
    return;
  }

  const supabase = createClient(env.supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.userId = data.user.id;
  req.accessToken = token;
  next();
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (env.supabaseUrl && anonKey) {
      const supabase = createClient(env.supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await supabase.auth.getUser(token);
      if (data.user) {
        req.userId = data.user.id;
        req.accessToken = token;
      }
    }
  }
  next();
}
