import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { DealerCsvImport } from "@/components/dealers/dealer-csv-import";
import { createClient } from "@/lib/supabase/server";

export default async function DealersImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <PageHeader
        title="Import Dealers"
        description="Bulk import dealer records from CSV"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dealers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dealers
            </Link>
          </Button>
        }
      />
      <div className="max-w-xl">
        <DealerCsvImport adminId={user?.id ?? ""} />
      </div>
    </div>
  );
}
