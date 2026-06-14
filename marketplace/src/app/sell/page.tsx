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
        <p className="mt-3 text-muted">Sign in to list watches on the marketplace.</p>
        <Link
          href="/auth/login?redirect=/sell"
          className="mt-6 inline-block rounded-sm bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <SellForm />;
}
