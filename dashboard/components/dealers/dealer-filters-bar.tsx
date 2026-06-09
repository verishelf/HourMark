"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEALER_PIPELINE_STATUSES, PIPELINE_LABELS } from "@/lib/dealer-scoring";
import type { DealerFilters, DealerGrade } from "@/types/database";

const GRADES: DealerGrade[] = ["A+", "A", "B", "C"];

export function DealerFiltersBar({
  filters,
  onChange,
  countries,
  cities,
}: {
  filters: DealerFilters;
  onChange: (filters: DealerFilters) => void;
  countries: string[];
  cities: string[];
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Input
        placeholder="Search dealers..."
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="max-w-xs"
      />
      <Select
        value={filters.country ?? "all"}
        onValueChange={(v) => onChange({ ...filters, country: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.city ?? "all"}
        onValueChange={(v) => onChange({ ...filters, city: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.pipeline_status ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...filters,
            pipeline_status: v === "all" ? undefined : (v as DealerFilters["pipeline_status"]),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {DEALER_PIPELINE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{PIPELINE_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.lead_grade ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...filters,
            lead_grade: v === "all" ? undefined : (v as DealerGrade),
          })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grades</SelectItem>
          {GRADES.map((g) => (
            <SelectItem key={g} value={g}>{g}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={
          filters.is_launch_partner === undefined
            ? "all"
            : filters.is_launch_partner
              ? "yes"
              : "no"
        }
        onValueChange={(v) =>
          onChange({
            ...filters,
            is_launch_partner: v === "all" ? undefined : v === "yes",
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Launch Partner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Partners</SelectItem>
          <SelectItem value="yes">Launch Partners</SelectItem>
          <SelectItem value="no">Non-Partners</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
