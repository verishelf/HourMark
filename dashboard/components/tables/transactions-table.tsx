"use client";

import { MoreHorizontal } from "lucide-react";
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
import { releaseFunds, refundTransaction } from "@/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/database";

export function TransactionsTable({ transactions, adminId }: { transactions: Transaction[]; adminId: string }) {
  async function handleRelease(txn: Transaction) {
    await releaseFunds(adminId, txn.id, txn.order_id);
    toast.success("Funds released");
  }

  async function handleRefund(txn: Transaction) {
    await refundTransaction(adminId, txn.id, txn.order_id);
    toast.success("Transaction refunded");
  }

  const columns = [
    { key: "id", header: "Transaction ID", cell: (row: Transaction) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
    { key: "buyer", header: "Buyer", cell: (row: Transaction) => row.order?.buyer?.full_name ?? "—" },
    { key: "seller", header: "Seller", cell: (row: Transaction) => row.order?.seller?.full_name ?? "—" },
    {
      key: "watch",
      header: "Watch",
      cell: (row: Transaction) =>
        row.order?.listing ? `${row.order.listing.brand} ${row.order.listing.model}` : "—",
    },
    { key: "amount", header: "Sale Price", cell: (row: Transaction) => formatCurrency(row.amount) },
    { key: "fee", header: "Crownly Fee", cell: (row: Transaction) => formatCurrency(row.commission_fee) },
    { key: "payout", header: "Net Payout", cell: (row: Transaction) => formatCurrency(row.seller_payout) },
    {
      key: "status",
      header: "Status",
      cell: (row: Transaction) => (
        <Badge variant={row.status === "completed" ? "success" : row.status === "refunded" ? "destructive" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    { key: "date", header: "Date", cell: (row: Transaction) => formatDate(row.created_at) },
    {
      key: "actions",
      header: "",
      cell: (row: Transaction) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleRelease(row)}>Release Funds</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRefund(row)}>Refund</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={transactions} />;
}
