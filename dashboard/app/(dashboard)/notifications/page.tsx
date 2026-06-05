import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminNotifications } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  new_listing: "New Listing",
  new_sale: "New Sale",
  auth_update: "Authentication",
  support_ticket: "Support",
  new_lead: "Seller Lead",
};

export default async function NotificationsPage() {
  const notifications = await getAdminNotifications();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Real-time admin notifications for marketplace events"
      />
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notifications yet. Events will appear here in real time.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={!n.read_at ? "border-foreground/30" : ""}>
              <CardContent className="flex items-start justify-between py-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{typeLabels[n.type] ?? n.type}</Badge>
                    {!n.read_at && <Badge variant="warning">New</Badge>}
                  </div>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(n.created_at)}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
