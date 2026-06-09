import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { DealerPipelineBoard } from "@/components/dealers/dealer-pipeline-board";
import { getDealers } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DealersPipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { dealers } = await getDealers({ limit: 500 });

  return (
    <div>
      <PageHeader
        title="Dealer Pipeline"
        description="Drag and drop dealers between stages — changes save automatically"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dealers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
          </Button>
        }
      />
      <DealerPipelineBoard dealers={dealers} adminId={user?.id ?? ""} />
    </div>
  );
}
