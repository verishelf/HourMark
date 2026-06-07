"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCelebrityProfile } from "@/actions/stories";

export function CelebrityProfileForm({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [quote, setQuote] = useState("");
  const [sources, setSources] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !sources.trim()) {
      toast.error("Name and at least one source URL are required");
      return;
    }
    setSaving(true);
    try {
      const result = await createCelebrityProfile(adminId, {
        name: name.trim(),
        bio: bio.trim() || undefined,
        favorite_quote: quote.trim() || undefined,
        source_urls: sources.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      if (result.error) throw new Error(result.error);
      toast.success("Profile created");
      router.push("/stories/profiles");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Biography</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label>Favorite Quote</Label>
        <Input value={quote} onChange={(e) => setQuote(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Source URLs (one per line)</Label>
        <Textarea value={sources} onChange={(e) => setSources(e.target.value)} rows={3} placeholder="https://..." />
      </div>
      <Button disabled={saving} onClick={save}>{saving ? "Saving…" : "Create Profile"}</Button>
    </div>
  );
}
