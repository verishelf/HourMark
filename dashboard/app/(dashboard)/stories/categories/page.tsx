import { PageHeader } from "@/components/dashboard/page-header";
import { getStoryCategories } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

export default async function StoryCategoriesPage() {
  const categories = await getStoryCategories();

  return (
    <div>
      <PageHeader title="Story Categories" description="Seeded editorial categories" />
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </div>
            <Badge variant="secondary">{c.slug}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
