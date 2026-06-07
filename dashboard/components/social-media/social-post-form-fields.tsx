"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getMinCharLimit, SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { uploadSocialMediaImage } from "@/actions/social-media";
import type { SocialPlatform } from "@/types/social-media";
import { toast } from "sonner";

export type SocialPostFormState = {
  content: string;
  platforms: SocialPlatform[];
  media_urls: string[];
  scheduled_at: string;
  schedule_enabled: boolean;
};

type Props = {
  form: SocialPostFormState;
  onChange: (form: SocialPostFormState) => void;
  enabledPlatforms: SocialPlatform[];
};

export function SocialPostFormFields({ form, onChange, enabledPlatforms }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const charLimit = getMinCharLimit(form.platforms.length ? form.platforms : enabledPlatforms);

  function togglePlatform(platform: SocialPlatform) {
    const next = form.platforms.includes(platform)
      ? form.platforms.filter((p) => p !== platform)
      : [...form.platforms, platform];
    onChange({ ...form, platforms: next });
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadSocialMediaImage(fd);
      if (result.error || !result.url) throw new Error(result.error ?? "Upload failed");
      onChange({ ...form, media_urls: [...form.media_urls, result.url] });
      toast.success("Image added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Platforms</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const connected = enabledPlatforms.includes(platform.id);
            return (
              <label
                key={platform.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 ${
                  connected ? "" : "opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={form.platforms.includes(platform.id)}
                  disabled={!connected}
                  onChange={() => togglePlatform(platform.id)}
                />
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="text-sm">{platform.name}</span>
                {!connected ? (
                  <span className="ml-auto text-xs text-muted-foreground">Not connected</span>
                ) : null}
              </label>
            );
          })}
        </div>
        {enabledPlatforms.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Connect platforms in Settings → Social Media API Keys first.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="social-content">Post content</Label>
        <Textarea
          id="social-content"
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          rows={6}
          placeholder="Write once — publish everywhere…"
        />
        <p className="text-xs text-muted-foreground">
          {form.content.length}
          {form.platforms.length > 0 ? ` / ${charLimit}` : ""} characters
        </p>
      </div>

      <div className="space-y-2">
        <Label>Media (optional)</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Image URL"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  onChange({ ...form, media_urls: [...form.media_urls, url] });
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </div>
        {form.media_urls.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {form.media_urls.map((url, i) => (
              <div key={url} className="relative h-20 w-28 overflow-hidden rounded-md border border-border">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs"
                  onClick={() =>
                    onChange({ ...form, media_urls: form.media_urls.filter((_, idx) => idx !== i) })
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={form.schedule_enabled}
            onChange={(e) =>
              onChange({
                ...form,
                schedule_enabled: e.target.checked,
                scheduled_at: e.target.checked ? form.scheduled_at : "",
              })
            }
          />
          Schedule for later
        </label>
        {form.schedule_enabled ? (
          <Input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => onChange({ ...form, scheduled_at: e.target.value })}
          />
        ) : null}
      </div>
    </div>
  );
}
