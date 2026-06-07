import Link from "next/link";
import type { StoryBlock } from "@/types/stories";

type StoryCard = {
  slug: string;
  title: string;
  subtitle?: string | null;
  hero_image_url: string;
  read_time_minutes: number;
  published_at?: string | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string } | null;
};

export function WebStoryCard({ story }: { story: StoryCard }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--gold)]"
    >
      <div className="aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.hero_image_url}
          alt={story.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        {story.category ? (
          <span className="mb-2 inline-block rounded-full bg-[rgba(201,169,98,0.15)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--gold)]">
            {story.category.name}
          </span>
        ) : null}
        <h2 className="text-lg font-medium leading-snug text-white">{story.title}</h2>
        {story.subtitle ? (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{story.subtitle}</p>
        ) : null}
        <p className="mt-3 text-xs text-[var(--muted-dim)]">
          {story.author?.name ?? "Crownly"} · {story.read_time_minutes} min read
        </p>
      </div>
    </Link>
  );
}

export function WebStoryArticle({ blocks }: { blocks: StoryBlock[] }) {
  return (
    <article className="prose prose-invert max-w-none px-4 py-8 sm:px-0">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag key={i} className="mt-8 mb-4 text-white font-light tracking-tight">
              {block.text}
            </Tag>
          );
        }
        if (block.type === "pull_quote") {
          return (
            <blockquote
              key={i}
              className="my-8 border-l-2 border-[var(--gold)] bg-[rgba(201,169,98,0.08)] py-4 pl-6 pr-4 text-xl italic text-white"
            >
              "{block.text}"
              {block.attribution ? (
                <footer className="mt-2 text-sm not-italic text-[var(--muted)]">— {block.attribution}</footer>
              ) : null}
            </blockquote>
          );
        }
        if (block.type === "image") {
          return (
            <figure key={i} className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.caption ?? ""} className="w-full rounded-lg" />
              {block.caption ? (
                <figcaption className="mt-2 text-center text-sm text-[var(--muted)]">{block.caption}</figcaption>
              ) : null}
            </figure>
          );
        }
        return (
          <p key={i} className="mb-6 indent-6 leading-relaxed text-[var(--muted)] last:mb-0">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
