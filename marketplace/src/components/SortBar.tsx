"use client";

import type { SortOption } from "@/lib/types";

type Props = {
  count: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  title?: string;
};

/** Chrono24-style results toolbar */
export function SortBar({ count, sort, onSortChange, title = "Luxury watches" }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {count.toLocaleString()} listing{count !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-xs text-muted">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-sm border border-border-light bg-card px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
    </div>
  );
}
