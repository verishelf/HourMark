"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { formatDate } from "@/lib/utils";
import type { WebsiteSignup } from "@/types/database";

export function WebsiteSignupsPanel({ signups }: { signups: WebsiteSignup[] }) {
  const activeCount = signups.filter((signup) => signup.subscribed).length;

  const columns = [
    {
      key: "email",
      header: "Email",
      cell: (row: WebsiteSignup) => row.email,
    },
    {
      key: "source",
      header: "Source",
      cell: (row: WebsiteSignup) => <Badge variant="secondary">{row.source}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: WebsiteSignup) => (
        <Badge variant={row.subscribed ? "default" : "secondary"}>
          {row.subscribed ? "Subscribed" : "Unsubscribed"}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Signed up",
      cell: (row: WebsiteSignup) => formatDate(row.created_at),
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Website Signups</CardTitle>
        <CardDescription>
          Emails collected from the crownly.art waitlist form. Use audience{" "}
          <strong>Website Signups</strong> when sending campaigns ({activeCount} subscribed).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {signups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No signups yet. They will appear here after visitors submit the form on the marketing site.
          </p>
        ) : (
          <DataTable columns={columns} data={signups} emptyMessage="No website signups yet." />
        )}
      </CardContent>
    </Card>
  );
}
