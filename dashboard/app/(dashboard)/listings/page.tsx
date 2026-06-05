import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { ListingsTable } from "@/components/tables/listings-table";
import { getListings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const listings = await getListings();

  const exportData = listings.map((l) => ({
    id: l.id,
    seller: l.seller?.full_name ?? l.seller?.username,
    brand: l.brand,
    model: l.model,
    price: l.price / 100,
    status: l.status,
    created_at: l.created_at,
  }));

  return (
    <div>
      <PageHeader
        title="Listings Management"
        description="Review, approve, and manage marketplace listings"
        actions={<ExportButtons data={exportData} filename="listings" />}
      />
      <ListingsTable listings={listings} adminId={user?.id ?? ""} />
    </div>
  );
}
