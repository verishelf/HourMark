"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/dashboard/data-table";
import { approveListing, rejectListing, featureListing } from "@/actions/listings";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Listing } from "@/types/database";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  draft: "secondary",
  sold: "default",
  archived: "destructive",
  pending: "warning",
  featured: "default",
};

export function ListingsTable({ listings, adminId }: { listings: Listing[]; adminId: string }) {
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = listings.filter((l) => {
    if (brandFilter && !l.brand.toLowerCase().includes(brandFilter.toLowerCase())) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  async function handleAction(action: string, listingId: string) {
    try {
      if (action === "approve") await approveListing(adminId, listingId);
      else if (action === "reject") await rejectListing(adminId, listingId);
      else if (action === "feature") await featureListing(adminId, listingId, true);
      else if (action === "unfeature") await featureListing(adminId, listingId, false);
      toast.success(`Listing ${action}d successfully`);
    } catch {
      toast.error("Action failed");
    }
  }

  const columns = [
    {
      key: "id",
      header: "Listing ID",
      cell: (row: Listing) => (
        <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "seller",
      header: "Seller",
      cell: (row: Listing) =>
        row.seller?.full_name ?? row.seller?.username ?? "—",
    },
    { key: "brand", header: "Brand", cell: (row: Listing) => row.brand },
    { key: "model", header: "Model", cell: (row: Listing) => row.model },
    {
      key: "price",
      header: "Price",
      cell: (row: Listing) => formatCurrency(row.price),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Listing) => (
        <Badge variant={statusVariant[row.status] ?? "secondary"}>
          {row.featured ? "Featured" : row.status}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Date Created",
      cell: (row: Listing) => formatDate(row.created_at),
    },
    {
      key: "actions",
      header: "",
      cell: (row: Listing) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction("approve", row.id)}>
              Approve Listing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("reject", row.id)}>
              Reject Listing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("feature", row.id)}>
              Feature Listing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("reject", row.id)}>
              Remove Listing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Filter by brand..."
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
