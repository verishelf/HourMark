import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { DealerAnalyticsDashboard } from "@/components/dealers/dealer-analytics-dashboard";
import { getDealerAnalytics } from "@/lib/queries";

export default async function DealersAnalyticsPage() {
  const analytics = await getDealerAnalytics();

  return (
    <div>
      <PageHeader
        title="Dealer Analytics"
        description="Executive reporting for dealer acquisition and revenue forecasting"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dealers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dealers
            </Link>
          </Button>
        }
      />
      <DealerAnalyticsDashboard analytics={analytics} />
    </div>
  );
}
