import type { MetadataRoute } from "next";
import { SITE, SITE_ROUTES } from "@/lib/site";
import { getPublishedStorySlugs } from "@/lib/supabase-stories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticRoutes = SITE_ROUTES.map((route) => ({
    url: `${SITE.url}${route.path === "/" ? "" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const storySlugs = await getPublishedStorySlugs();
  const storyRoutes = storySlugs.map((s) => ({
    url: `${SITE.url}/stories/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    {
      url: `${SITE.url}/stories`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...storyRoutes,
  ];
}
