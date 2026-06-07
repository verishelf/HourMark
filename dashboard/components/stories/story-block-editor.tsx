"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StoryBlock } from "@/types/database";

type Props = {
  blocks: StoryBlock[];
  onChange: (blocks: StoryBlock[]) => void;
};

export function StoryBlockEditor({ blocks, onChange }: Props) {
  const update = (index: number, block: StoryBlock) => {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  };

  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index));

  const add = (type: StoryBlock["type"]) => {
    const block: StoryBlock =
      type === "heading"
        ? { type: "heading", text: "", level: 2 }
        : type === "pull_quote"
          ? { type: "pull_quote", text: "" }
          : type === "image"
            ? { type: "image", url: "" }
            : { type: "paragraph", text: "" };
    onChange([...blocks, block]);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Article body</p>
      {blocks.map((block, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{block.type}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>Remove</Button>
          </div>
          {block.type === "paragraph" ? (
            <Textarea value={block.text} onChange={(e) => update(i, { ...block, text: e.target.value })} rows={4} />
          ) : null}
          {block.type === "heading" ? (
            <Input value={block.text} onChange={(e) => update(i, { ...block, text: e.target.value })} placeholder="Heading" />
          ) : null}
          {block.type === "pull_quote" ? (
            <>
              <Textarea value={block.text} onChange={(e) => update(i, { ...block, text: e.target.value })} rows={2} />
              <Input
                value={block.attribution ?? ""}
                onChange={(e) => update(i, { ...block, attribution: e.target.value })}
                placeholder="Attribution"
              />
            </>
          ) : null}
          {block.type === "image" ? (
            <>
              <Input value={block.url} onChange={(e) => update(i, { ...block, url: e.target.value })} placeholder="Image URL" />
              <Input
                value={block.caption ?? ""}
                onChange={(e) => update(i, { ...block, caption: e.target.value })}
                placeholder="Caption"
              />
            </>
          ) : null}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => add("paragraph")}>+ Paragraph</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add("heading")}>+ Heading</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add("pull_quote")}>+ Pull quote</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add("image")}>+ Image</Button>
      </div>
    </div>
  );
}
