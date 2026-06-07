import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StructuredData } from "@/components/StructuredData";
import { WebStoryArticle } from "@/components/stories/StoryWebComponents";
import { SITE } from "@/lib/site";
import { getPublishedStory, getPublishedStories } from "@/lib/supabase-stories";
import type { StoryBlock } from "@/types/stories";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { getPublishedStorySlugs } = await import("@/lib/supabase-stories");
  const slugs = await getPublishedStorySlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) return { title: "Story not found" };

  const url = `${SITE.url}/stories/${slug}`;
  return {
    title: story.title,
    description: story.subtitle ?? story.title,
    alternates: { canonical: `/stories/${slug}` },
    openGraph: {
      type: "article",
      url,
      title: story.title,
      description: story.subtitle ?? undefined,
      images: [{ url: story.hero_image_url, width: 1200, height: 630, alt: story.title }],
      publishedTime: story.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.subtitle ?? undefined,
      images: [story.hero_image_url],
    },
  };
}

export const revalidate = 300;

export default async function StoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) notFound();

  const related = (await getPublishedStories(4)).filter((s) => s.slug !== slug).slice(0, 3);
  const blocks = (story.body ?? []) as StoryBlock[];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.subtitle,
    image: story.hero_image_url,
    datePublished: story.published_at,
    author: story.author?.name
      ? { "@type": "Person", name: story.author.name }
      : { "@type": "Organization", name: SITE.company },
    publisher: {
      "@type": "Organization",
      name: SITE.company,
      url: SITE.url,
    },
    mainEntityOfPage: `${SITE.url}/stories/${slug}`,
  };

  return (
    <>
      <StructuredData data={articleJsonLd} />
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28">
        <div className="relative mb-8 aspect-[4/5] max-h-[520px] overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.hero_image_url} alt={story.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            {story.category ? (
              <span className="mb-3 inline-block rounded-full bg-[rgba(201,169,98,0.2)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--gold)]">
                {story.category.name}
              </span>
            ) : null}
            <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl">{story.title}</h1>
            {story.subtitle ? (
              <p className="mt-3 text-lg text-white/80">{story.subtitle}</p>
            ) : null}
            <p className="mt-4 text-sm text-white/60">
              {story.author?.name ?? "Crownly"} · {story.read_time_minutes} min read
            </p>
          </div>
        </div>

        <WebStoryArticle blocks={blocks} />

        {story.source_attribution ? (
          <p className="px-4 text-xs text-[var(--muted-dim)] sm:px-0">
            Source: {story.source_attribution}
          </p>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-16 border-t border-[var(--border)] pt-12">
            <h2 className="mb-6 text-xl font-light text-white">Related Stories</h2>
            <div className="space-y-4">
              {related.map((s) => (
                <Link
                  key={s.slug}
                  href={`/stories/${s.slug}`}
                  className="block text-[var(--muted)] hover:text-[var(--gold)]"
                >
                  {s.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-12 text-center">
          <Link href="/stories" className="text-sm text-[var(--gold)] hover:underline">
            ← All Stories
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
