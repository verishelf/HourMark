"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createListingAction } from "@/app/profile/actions";
import { CONDITIONS, LUXURY_BRANDS } from "@/lib/types";

export function SellForm() {
  const router = useRouter();
  const [brand, setBrand] = useState<string>(LUXURY_BRANDS[0]);
  const [model, setModel] = useState("");
  const [reference, setReference] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState<string>(CONDITIONS[2]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [includesBox, setIncludesBox] = useState(false);
  const [includesPapers, setIncludesPapers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const dollars = parseFloat(price.replace(/,/g, ""));
      if (Number.isNaN(dollars) || dollars <= 0) {
        setError("Enter a valid price in USD");
        return;
      }
      const images = imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      const result = await createListingAction({
        brand,
        model,
        reference_number: reference || undefined,
        year: year ? Number(year) : undefined,
        condition,
        price: Math.round(dollars * 100),
        description: description || undefined,
        images,
        includes_box: includesBox,
        includes_papers: includesPapers,
      });
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
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/profile" className="text-sm text-gold hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">List a watch</h1>
      <p className="mt-2 text-sm text-muted">
        Creates a draft listing. Complete AI verification in the Crownly app to publish live on the
        marketplace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs text-muted">Brand</span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            {LUXURY_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Model</span>
          <input
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted">Reference (optional)</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Year (optional)</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-muted">Condition</span>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Price (USD)</span>
          <input
            required
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="25000"
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Image URLs (one per line)</span>
          <textarea
            required
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            rows={3}
            placeholder="https://..."
            className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includesBox}
              onChange={(e) => setIncludesBox(e.target.checked)}
            />
            Includes box
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includesPapers}
              onChange={(e) => setIncludesPapers(e.target.checked)}
            />
            Includes papers
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-gold py-3.5 text-sm font-semibold uppercase tracking-wider text-black disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create listing"}
        </button>
      </form>
    </div>
  );
}
