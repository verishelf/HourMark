"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoryBlockEditor } from "@/components/stories/story-block-editor";
import { StoryImageField } from "@/components/stories/story-image-field";
import { createStory, updateStory, publishStory } from "@/actions/stories";
import type { StoryBlock } from "@/types/database";

type Category = { id: string; name: string };
type Author = { id: string; name: string };

type Props = {
  adminId: string;
  categories: Category[];
  authors: Author[];
  story?: {
    id: string;
    title: string;
    subtitle: string | null;
    hero_image_url: string;
    body: StoryBlock[];
    category_id: string;
    author_id: string | null;
    read_time_minutes: number;
    source_attribution: string | null;
    is_featured: boolean;
    scheduled_at: string | null;
  };
};

export function StoryForm({ adminId, categories, authors, story }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(story?.title ?? "");
  const [subtitle, setSubtitle] = useState(story?.subtitle ?? "");
  const [heroUrl, setHeroUrl] = useState(story?.hero_image_url ?? "");
  const [categoryId, setCategoryId] = useState(story?.category_id ?? categories[0]?.id ?? "");
  const [authorId, setAuthorId] = useState(story?.author_id ?? "");
  const [readTime, setReadTime] = useState(String(story?.read_time_minutes ?? 5));
  const [source, setSource] = useState(story?.source_attribution ?? "");
  const [featured, setFeatured] = useState(story?.is_featured ?? false);
  const [scheduledAt, setScheduledAt] = useState(story?.scheduled_at?.slice(0, 16) ?? "");
  const [blocks, setBlocks] = useState<StoryBlock[]>(story?.body ?? [{ type: "paragraph", text: "" }]);
  const [saving, setSaving] = useState(false);

  const save = async (andPublish = false) => {
    if (!title.trim() || !heroUrl.trim() || !categoryId) {
      toast.error("Title, hero image, and category are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        hero_image_url: heroUrl.trim(),
        body: blocks,
        category_id: categoryId,
        author_id: authorId || undefined,
        read_time_minutes: parseInt(readTime, 10) || 5,
        source_attribution: source.trim() || undefined,
        is_featured: featured,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      };

      if (story) {
        await updateStory(adminId, story.id, {
          ...payload,
          author_id: authorId || null,
          subtitle: subtitle.trim() || null,
          source_attribution: source.trim() || null,
        });
        if (andPublish) await publishStory(adminId, story.id);
      } else {
        const result = await createStory(adminId, payload);
        if (result.error) throw new Error(result.error);
        if (andPublish && result.id) await publishStory(adminId, result.id);
      }
      toast.success(andPublish ? "Story published" : "Story saved");
      router.push("/stories");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <StoryImageField
          label="Hero Image"
          value={heroUrl}
          onChange={setHeroUrl}
          placeholder="Hero image URL or upload"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Author</Label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
          >
            <option value="">None</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="readTime">Read time (minutes)</Label>
          <Input id="readTime" type="number" value={readTime} onChange={(e) => setReadTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled">Schedule publish</Label>
          <Input id="scheduled" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Source attribution</Label>
        <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Public source URL or citation" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature on home feed
      </label>
      <StoryBlockEditor blocks={blocks} onChange={setBlocks} />
      <div className="flex gap-3">
        <Button disabled={saving} onClick={() => save(false)}>{saving ? "Saving…" : "Save draft"}</Button>
        <Button disabled={saving} variant="default" onClick={() => save(true)}>Publish</Button>
      </div>
    </div>
  );
}
