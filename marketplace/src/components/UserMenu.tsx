"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { HeaderUser } from "@/lib/user";
import { getUserDisplayName, getUserInitial } from "@/lib/user";
import { signOutAction } from "@/app/profile/actions";

export function UserMenu({ user }: { user: HeaderUser }) {
  const router = useRouter();
  const name = getUserDisplayName(user);
  const initial = getUserInitial(user);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOutAction();
      router.refresh();
      router.push("/");
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <div className="flex items-center gap-1">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-sm py-1 pl-1 transition hover:opacity-90"
          title={name}
        >
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={name}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full border border-border-light object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-light bg-card text-xs font-semibold text-gold">
              {initial}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate normal-case tracking-normal text-foreground sm:inline">
            {name}
          </span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label="Account menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-sm px-1 py-2 text-muted hover:text-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-sm border border-border bg-card py-1 shadow-lg">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm normal-case tracking-normal text-foreground hover:bg-card-hover"
          >
            My profile
          </Link>
          <Link
            href="/sell"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm normal-case tracking-normal text-foreground hover:bg-card-hover"
          >
            List a watch
          </Link>
          <Link
            href="/profile/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm normal-case tracking-normal text-foreground hover:bg-card-hover"
          >
            Settings
          </Link>
          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="block w-full px-4 py-2.5 text-left text-sm normal-case tracking-normal text-red-400 hover:bg-card-hover disabled:opacity-60"
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
