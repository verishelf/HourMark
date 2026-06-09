import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { DealerDetailHeader } from "@/components/dealers/dealer-detail-header";
import { DealerActivityTimeline } from "@/components/dealers/dealer-activity-timeline";
import { DealerTasksPanel } from "@/components/dealers/dealer-tasks-panel";
import { DealerChangelogPanel } from "@/components/dealers/dealer-changelog-panel";
import {
  getDealerById,
  getDealerActivities,
  getDealerTasks,
  getDealerChangelog,
  getAdminUsers,
  getAdminProfile,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [dealer, activities, tasks, changelog, admins, profile] = await Promise.all([
    getDealerById(id),
    getDealerActivities(id),
    getDealerTasks(id),
    getDealerChangelog(id),
    getAdminUsers(),
    user ? getAdminProfile(user.id) : null,
  ]);

  if (!dealer) notFound();

  return (
    <div>
      <PageHeader
        title="Dealer Profile"
        description={dealer.company_name}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dealers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dealers
            </Link>
          </Button>
        }
      />

      <DealerDetailHeader
        dealer={dealer}
        adminId={user?.id ?? ""}
        adminRole={(profile?.admin_role as AdminRole) ?? null}
      />

      {dealer.notes && (
        <div className="mt-6 rounded-md border border-border p-4">
          <p className="text-sm font-medium mb-1">Notes</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dealer.notes}</p>
        </div>
      )}

      <div className="grid gap-6 mt-8 lg:grid-cols-2">
        <DealerActivityTimeline
          dealerId={id}
          adminId={user?.id ?? ""}
          activities={activities}
        />
        <DealerTasksPanel
          dealerId={id}
          adminId={user?.id ?? ""}
          tasks={tasks}
          admins={admins}
        />
      </div>

      <div className="mt-6">
        <DealerChangelogPanel changelog={changelog} />
      </div>
    </div>
  );
}
