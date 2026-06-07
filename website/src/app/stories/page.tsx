import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WebStoryCard } from "@/components/stories/StoryWebComponents";
import { buildPageMetadata } from "@/lib/seo";
import { getPublishedStories } from "@/lib/supabase-stories";

export const metadata: Metadata = buildPageMetadata({
  title: "Crownly Stories — Luxury Networking & Lifestyle",
  description: "Success stories, collector spotlights, and deal room insights from the world of luxury watches.",
  path: "/stories",
});

export const revalidate = 300;

export default async function StoriesFeedPage() {
  const stories = await getPublishedStories(24);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Crownly Stories</p>
          <h1 className="mt-3 text-4xl font-light tracking-tight text-white sm:text-5xl">
            Luxury networking & lifestyle
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            The stories, relationships, and success journeys connected to the world&apos;s finest timepieces.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <WebStoryCard
              key={story.slug}
              story={{
                ...story,
                category: Array.isArray(story.category) ? story.category[0] : story.category,
                author: Array.isArray(story.author) ? story.author[0] : story.author,
              }}
            />
          ))}
        </div>
        {stories.length === 0 ? (
          <p className="text-center text-[var(--muted)]">Stories coming soon.</p>
        ) : null}
        <p className="mt-12 text-center">
          <Link href="/" className="text-sm text-[var(--gold)] hover:underline">
            ← Back to Crownly
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
