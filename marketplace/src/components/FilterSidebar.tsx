"use client";

import { LUXURY_BRANDS, CONDITIONS } from "@/lib/types";

export type FilterState = {
  brands: string[];
  minPrice: string;
  maxPrice: string;
  condition: string;
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
};

/** Chrono24-style left filter panel */
export function FilterSidebar({ filters, onChange, onApply, onReset }: Props) {
  const toggleBrand = (brand: string) => {
    const brands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands });
  };

  return (
    <aside className="filter-scroll w-full shrink-0 overflow-y-auto border-r border-border bg-card md:w-[260px] md:max-h-[calc(100vh-140px)] md:sticky md:top-[120px]">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Filters</h2>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gold hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      <section className="border-b border-border px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Brand
        </h3>
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {LUXURY_BRANDS.map((brand) => (
            <li key={brand}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="accent-gold"
                />
                <span className="text-muted hover:text-foreground">{brand}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b border-border px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Price (USD)
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="w-full rounded-sm border border-border-light bg-background px-2 py-1.5 text-sm outline-none focus:border-gold"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="w-full rounded-sm border border-border-light bg-background px-2 py-1.5 text-sm outline-none focus:border-gold"
          />
        </div>
      </section>

      <section className="px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Condition
        </h3>
        <select
          value={filters.condition}
          onChange={(e) => onChange({ ...filters, condition: e.target.value })}
          className="w-full rounded-sm border border-border-light bg-background px-2 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      <div className="sticky bottom-0 border-t border-border bg-card p-4">
        <button
          type="button"
          onClick={onApply}
          className="w-full rounded-sm bg-gold py-2.5 text-xs font-semibold uppercase tracking-wider text-black hover:opacity-90"
        >
          Show results
        </button>
      </div>
    </aside>
  );
}
