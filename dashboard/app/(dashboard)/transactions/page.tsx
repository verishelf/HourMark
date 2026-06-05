import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { TransactionsTable } from "@/components/tables/transactions-table";
import { getTransactions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const transactions = await getTransactions();

  const exportData = transactions.map((t) => ({
    id: t.id,
    buyer: t.order?.buyer?.full_name,
    seller: t.order?.seller?.full_name,
    watch: t.order?.listing ? `${t.order.listing.brand} ${t.order.listing.model}` : null,
    sale_price: t.amount / 100,
    crownly_fee: t.commission_fee / 100,
    net_payout: t.seller_payout / 100,
    status: t.status,
    created_at: t.created_at,
  }));

  return (
    <div>
      <PageHeader
        title="Transaction Management"
        description="View transactions, release funds, and process refunds"
        actions={<ExportButtons data={exportData} filename="transactions" />}
      />
      <TransactionsTable transactions={transactions} adminId={user?.id ?? ""} />
    </div>
  );
}
