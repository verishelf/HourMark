"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadStoryImage } from "@/actions/story-media";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
};

export function StoryImageField({ label, value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadStoryImage(formData);
      if (result.error || !result.url) throw new Error(result.error ?? "Upload failed");
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "https://… or upload an image"}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {value ? (
        <div className="relative mt-2 aspect-[16/10] w-full max-w-md overflow-hidden rounded-lg border border-border">
          <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
        </div>
      ) : null}
    </div>
  );
}
