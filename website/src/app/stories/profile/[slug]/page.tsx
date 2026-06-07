import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { buildPageMetadata } from "@/lib/seo";
import { getPublishedProfile } from "@/lib/supabase-stories";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedProfile(slug);
  if (!result) return { title: "Profile not found" };
  const name = result.type === "celebrity" ? result.profile.name : result.profile.user?.full_name ?? "Collector";
  return buildPageMetadata({
    title: `${name} — Crownly Stories`,
    description: result.profile.bio ?? `Profile on Crownly Stories`,
    path: `/stories/profile/${slug}`,
  });
}

export default async function StoryProfilePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedProfile(slug);
  if (!result) notFound();

  const name =
    result.type === "celebrity"
      ? result.profile.name
      : result.profile.user?.full_name ?? result.profile.user?.username ?? "Collector";
  const avatar =
    result.type === "celebrity" ? result.profile.avatar_url : result.profile.user?.avatar_url;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28">
        <div className="text-center">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="mx-auto mb-6 h-24 w-24 rounded-full border-2 border-[var(--gold)] object-cover" />
          ) : null}
          <h1 className="text-4xl font-light text-white">{name}</h1>
          {result.profile.bio ? (
            <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">{result.profile.bio}</p>
          ) : null}
        </div>

        {"favorite_quote" in result.profile && result.profile.favorite_quote ? (
          <blockquote className="my-12 border-l-2 border-[var(--gold)] py-2 pl-6 text-xl italic text-white">
            "{result.profile.favorite_quote}"
          </blockquote>
        ) : null}

        {Array.isArray(result.profile.watch_collection) && result.profile.watch_collection.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-medium text-white">Watch Collection</h2>
            <ul className="space-y-3">
              {result.profile.watch_collection.map((w: { brand: string; model: string; notes?: string }, i: number) => (
                <li key={i} className="border-b border-[var(--border)] pb-3 text-[var(--muted)]">
                  <strong className="text-white">{w.brand} {w.model}</strong>
                  {w.notes ? <span className="block text-sm">{w.notes}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {"source_urls" in result.profile && result.profile.source_urls?.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm uppercase tracking-wider text-[var(--muted-dim)]">Sources</h2>
            <ul className="space-y-1 text-sm text-[var(--muted)]">
              {result.profile.source_urls.map((url: string) => (
                <li key={url}>{url}</li>
              ))}
            </ul>
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
