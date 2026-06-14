"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/types";
import { updateProfileAction } from "@/app/profile/actions";

type Props = { profile: UserProfile };

export function EditProfileForm({ profile }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await updateProfileAction({ full_name: fullName, username, bio });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      router.push("/profile");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/profile" className="text-sm text-gold hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Edit profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs text-muted">Display name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Username</span>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-black disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
