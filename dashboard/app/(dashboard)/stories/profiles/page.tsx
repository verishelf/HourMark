import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCelebrityProfiles } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CelebrityProfilesPage() {
  const profiles = await getCelebrityProfiles();

  return (
    <div>
      <PageHeader
        title="Celebrity Profiles"
        description="Admin-curated profiles with public source attribution"
        actions={
          <Button asChild>
            <Link href="/stories/profiles/new">New Profile</Link>
          </Button>
        }
      />
      <div className="space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.slug}</p>
            </div>
            <Badge variant={p.published ? "success" : "secondary"}>{p.published ? "Published" : "Draft"}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
