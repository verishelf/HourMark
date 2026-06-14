import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Local dev: load HourMark root .env and map EXPO_PUBLIC_* to NEXT_PUBLIC_*.
loadEnvConfig(path.join(__dirname, ".."));

function normalize(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = normalize(process.env.EXPO_PUBLIC_SUPABASE_URL);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = normalize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
