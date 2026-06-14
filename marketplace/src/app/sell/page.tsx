import { redirect } from "next/navigation";
import Link from "next/link";
import { SellForm } from "@/components/SellForm";
import { getCurrentUser } from "@/lib/auth";

export default async function SellPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Sell on Crownly</h1>
        <p className="mt-3 text-muted">Create a free account to list watches on the marketplace.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/signup?redirect=/sell"
            className="inline-block rounded-sm bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black"
          >
            Sign up
          </Link>
          <Link
            href="/auth/login?redirect=/sell"
            className="inline-block rounded-sm border border-border-light px-6 py-3 text-sm font-semibold uppercase tracking-wider text-muted hover:border-gold hover:text-gold"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <SellForm />;
}
