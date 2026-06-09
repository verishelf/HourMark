"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { DealerChangelog } from "@/types/database";

export function DealerChangelogPanel({ changelog }: { changelog: DealerChangelog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change History</CardTitle>
      </CardHeader>
      <CardContent>
        {changelog.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No changes recorded.</p>
        ) : (
          <div className="space-y-3">
            {changelog.map((c) => (
              <div key={c.id} className="text-sm border-b border-border pb-3 last:border-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{c.field_name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  <span className="line-through">{c.old_value ?? "—"}</span>
                  {" → "}
                  <span>{c.new_value ?? "—"}</span>
                </p>
                {c.admin?.full_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">by {c.admin.full_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
