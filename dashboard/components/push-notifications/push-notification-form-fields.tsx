"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PushNotificationAudience } from "@/types/database";

export type PushNotificationFormState = {
  title: string;
  body: string;
  audience: PushNotificationAudience;
  deep_link: string;
};

export const PUSH_AUDIENCE_LABELS: Record<PushNotificationAudience, string> = {
  all: "All app users (with push enabled)",
  sellers: "Verified sellers",
  dealers: "Dealers (Stripe complete)",
  buyers: "Buyers (completed orders)",
  new_leads: "Seller leads (new)",
  web_signups: "Website signups (no push tokens yet)",
};

export const DEEP_LINK_PRESETS = [
  { label: "None", value: "" },
  { label: "Home", value: "/" },
  { label: "Stories feed", value: "/stories" },
  { label: "Search", value: "/search" },
  { label: "Sell", value: "/sell" },
  { label: "Messages", value: "/messages" },
  { label: "Notifications", value: "/notifications" },
];

type Props = {
  form: PushNotificationFormState;
  onChange: (form: PushNotificationFormState) => void;
};

export function PushNotificationFormFields({ form, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="push-title">Title</Label>
        <Input
          id="push-title"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="New on Crownly"
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="push-body">Message</Label>
        <Textarea
          id="push-body"
          value={form.body}
          onChange={(e) => onChange({ ...form, body: e.target.value })}
          placeholder="Tap to explore the latest stories from collectors worldwide."
          rows={4}
          maxLength={240}
        />
        <p className="text-xs text-muted-foreground">{form.body.length}/240 characters</p>
      </div>
      <div className="space-y-2">
        <Label>Audience</Label>
        <Select
          value={form.audience}
          onValueChange={(value) => onChange({ ...form, audience: value as PushNotificationAudience })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PUSH_AUDIENCE_LABELS) as PushNotificationAudience[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PUSH_AUDIENCE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="push-deeplink">Deep link (optional)</Label>
        <Select
          value={
            form.deep_link === ""
              ? "none"
              : DEEP_LINK_PRESETS.some((p) => p.value === form.deep_link)
                ? form.deep_link
                : "custom"
          }
          onValueChange={(value) => {
            if (value === "custom") return;
            onChange({ ...form, deep_link: value === "none" ? "" : value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose destination" />
          </SelectTrigger>
          <SelectContent>
            {DEEP_LINK_PRESETS.map((preset) => (
              <SelectItem key={preset.label} value={preset.value === "" ? "none" : preset.value}>
                {preset.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom path…</SelectItem>
          </SelectContent>
        </Select>
        <Input
          id="push-deeplink"
          value={form.deep_link}
          onChange={(e) => onChange({ ...form, deep_link: e.target.value })}
          placeholder="/stories/watch-that-started-10-million-partnership"
        />
        <p className="text-xs text-muted-foreground">
          App route when the user taps the notification, e.g. /stories or /listing/[id]
        </p>
      </div>
    </div>
  );
}
