"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { HeaderUser } from "@/lib/user";
import { UserMenu } from "@/components/UserMenu";
import { MARKETING_URL } from "@/lib/site";

type Props = { compact?: boolean; user: HeaderUser | null };

function HeaderContent({ compact, user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [q, setQ] = useState(urlQuery);

  useEffect(() => {
    if (pathname === "/search") setQ(urlQuery);
  }, [pathname, urlQuery]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="hidden border-b border-border bg-card text-[11px] text-muted md:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-6 px-4 py-1">
          <a href={`${MARKETING_URL}/stories`} className="hover:text-foreground">
            Crownly Stories
          </a>
          <Link href="/sell" className="hover:text-foreground">
            Sell a watch
          </Link>
          {!user && (
            <Link href="/auth/login" className="hover:text-foreground">
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2 md:gap-8 md:py-2.5">
        <Link href="/" className="shrink-0">
          <Image src="/crownly-logo.png" alt="Crownly" width={46} height={28} priority />
        </Link>

        {!compact && (
          <form onSubmit={onSearch} className="hidden flex-1 md:block">
            <div className="flex overflow-hidden rounded-sm border border-border-light bg-card">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brand, model, or reference…"
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-dim"
              />
              <button
                type="submit"
                className="bg-gold px-5 text-xs font-semibold uppercase tracking-wider text-black transition hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>
        )}

        <nav className="ml-auto flex items-center gap-3 text-xs font-medium uppercase tracking-wide md:gap-6">
          <Link href="/search" className="hidden text-muted hover:text-foreground sm:inline">
            Buy
          </Link>
          <Link href="/search?sale=auction" className="hidden text-muted hover:text-foreground sm:inline">
            Auctions
          </Link>
          <Link
            href="/sell"
            className="rounded-sm border border-border-light px-3 py-1.5 text-muted hover:border-gold hover:text-gold md:px-4 md:py-2"
          >
            Sell
          </Link>
          {user && <UserMenu user={user} />}
        </nav>
      </div>

      {!compact && (
        <form onSubmit={onSearch} className="border-t border-border px-4 pb-2 md:hidden">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search watches…"
            className="w-full rounded-sm border border-border-light bg-card px-3 py-2 text-sm outline-none"
          />
        </form>
      )}
    </header>
  );
}

export function MarketplaceHeader(props: Props) {
  return (
    <Suspense fallback={<div className="h-[96px] border-b border-border bg-background" />}>
      <HeaderContent {...props} />
    </Suspense>
  );
}
