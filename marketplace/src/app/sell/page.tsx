export default function SellPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Sell on Crownly</h1>
      <p className="mt-3 text-muted">
        List from the Crownly iOS app for the full sell flow with AI verification, or sign in on
        web — seller tools coming soon.
      </p>
      <a
        href="/auth/login?redirect=/sell"
        className="mt-6 inline-block rounded-sm bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black"
      >
        Sign in
      </a>
    </div>
  );
}
