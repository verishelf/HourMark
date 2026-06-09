"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/dashboard/data-table";
import { DealerFormDialog } from "@/components/dealers/dealer-form-dialog";
import { DealerGradeBadge } from "@/components/dealers/dealer-grade-badge";
import { DealerLaunchPartnerBadge } from "@/components/dealers/dealer-launch-partner-badge";
import { DealerFiltersBar } from "@/components/dealers/dealer-filters-bar";
import { PIPELINE_LABELS } from "@/lib/dealer-scoring";
import { updatePipelineStatus, deleteDealer } from "@/actions/dealers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminRole, Dealer, DealerFilters } from "@/types/database";
import { DEALER_PIPELINE_STATUSES } from "@/lib/dealer-scoring";

export function DealersTable({
  dealers,
  adminId,
  adminRole,
  countries,
  cities,
}: {
  dealers: Dealer[];
  adminId: string;
  adminRole: AdminRole | null;
  countries: string[];
  cities: string[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<DealerFilters>({});

  const filtered = dealers.filter((d) => {
    if (filters.country && d.country !== filters.country) return false;
    if (filters.city && d.city !== filters.city) return false;
    if (filters.pipeline_status && d.pipeline_status !== filters.pipeline_status) return false;
    if (filters.lead_grade && d.lead_grade !== filters.lead_grade) return false;
    if (filters.is_launch_partner !== undefined && d.is_launch_partner !== filters.is_launch_partner) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${d.company_name} ${d.contact_name} ${d.email} ${d.city} ${d.country}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  async function handleStatusChange(dealerId: string, status: typeof DEALER_PIPELINE_STATUSES[number]) {
    const result = await updatePipelineStatus(adminId, dealerId, status);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Status updated");
  }

  async function handleDelete(dealerId: string) {
    const result = await deleteDealer(adminId, dealerId);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Dealer deleted");
  }

  const columns = [
    {
      key: "company",
      header: "Company",
      cell: (row: Dealer) => (
        <Link href={`/dealers/${row.id}`} className="font-medium hover:underline">
          {row.company_name}
        </Link>
      ),
    },
    { key: "contact", header: "Contact", cell: (row: Dealer) => row.contact_name },
    { key: "email", header: "Email", cell: (row: Dealer) => <span className="text-sm">{row.email}</span> },
    {
      key: "location",
      header: "Location",
      cell: (row: Dealer) => [row.city, row.country].filter(Boolean).join(", ") || "—",
    },
    {
      key: "inventory",
      header: "Inventory",
      cell: (row: Dealer) => formatCurrency(row.inventory_value),
    },
    {
      key: "grade",
      header: "Score",
      cell: (row: Dealer) => <DealerGradeBadge grade={row.lead_grade} score={row.lead_score} />,
    },
    {
      key: "status",
      header: "Pipeline",
      cell: (row: Dealer) => (
        <Badge variant="secondary">{PIPELINE_LABELS[row.pipeline_status]}</Badge>
      ),
    },
    {
      key: "lp",
      header: "LP",
      cell: (row: Dealer) => (
        <DealerLaunchPartnerBadge isLaunchPartner={row.is_launch_partner} expiresAt={row.launch_partner_expires} compact />
      ),
    },
    {
      key: "created",
      header: "Added",
      cell: (row: Dealer) => <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (row: Dealer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dealers/${row.id}`}>View Details</Link>
            </DropdownMenuItem>
            {DEALER_PIPELINE_STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatusChange(row.id, s)}>
                Move to {PIPELINE_LABELS[s]}
              </DropdownMenuItem>
            ))}
            {adminRole === "super_admin" && (
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.id)}>
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <DealerFiltersBar filters={filters} onChange={setFilters} countries={countries} cities={cities} />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Dealer
        </Button>
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No dealers found." />
      <DealerFormDialog open={createOpen} onOpenChange={setCreateOpen} adminId={adminId} />
    </div>
  );
}
