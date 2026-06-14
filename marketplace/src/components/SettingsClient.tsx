"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/app/profile/actions";
import type { HeaderUser } from "@/lib/user";
import { getUserDisplayName } from "@/lib/user";

type Props = { user: HeaderUser };

export function SettingsClient({ user }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOutAction();
      router.refresh();
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/profile" className="text-sm text-gold hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Settings</h1>

      <section className="mt-8 space-y-4 rounded-sm border border-border bg-card p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Account</p>
          <p className="mt-1 font-medium">{getUserDisplayName(user)}</p>
          {user.email && <p className="text-sm text-muted">{user.email}</p>}
        </div>
        <Link
          href="/profile/edit"
          className="inline-block text-sm text-gold hover:underline"
        >
          Edit profile
        </Link>
      </section>

      <section className="mt-6 space-y-3 rounded-sm border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted">Selling</p>
        <Link href="/sell" className="block text-sm hover:text-gold">
          List a watch
        </Link>
        <p className="text-xs text-muted-dim">
          Full AI verification and photo upload are also available in the Crownly iOS app.
        </p>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-8 w-full rounded-sm border border-red-400/50 py-3 text-sm text-red-400 hover:bg-red-400/10 disabled:opacity-60"
      >
        {loggingOut ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}
