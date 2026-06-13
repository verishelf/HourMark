import Link from "next/link";
import { MARKETING_URL } from "@/lib/site";

export function MarketplaceFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="text-sm font-semibold">Crownly Marketplace</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            AI-verified luxury watches with escrow checkout — the same trust as the Crownly app.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buy</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/search" className="hover:text-foreground">All watches</Link></li>
            <li><Link href="/search?sale=auction" className="hover:text-foreground">Auctions</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sell</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/sell" className="hover:text-foreground">List a watch</Link></li>
            <li><Link href="/auth/login" className="hover:text-foreground">Seller login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Crownly</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><a href={MARKETING_URL} className="hover:text-foreground">About</a></li>
            <li><a href={`${MARKETING_URL}/stories`} className="hover:text-foreground">Stories</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-[11px] text-muted-dim">
        © {new Date().getFullYear()} Crownly · Authenticated luxury watches
      </div>
    </footer>
  );
}
