"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSocialChannelCredentials } from "@/actions/social-media";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import type { SocialChannelCredentials, SocialPlatform } from "@/types/social-media";

type Props = {
  credentials: SocialChannelCredentials[];
  adminId: string;
};

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function SocialCredentialsForm({ credentials, adminId }: Props) {
  const initial = useMemo(() => {
    const map: Record<SocialPlatform, { label: string; enabled: boolean; fields: Record<string, string> }> =
      {} as Record<SocialPlatform, { label: string; enabled: boolean; fields: Record<string, string> }>;

    for (const platform of SOCIAL_PLATFORMS) {
      const saved = credentials.find((c) => c.platform === platform.id);
      const fields: Record<string, string> = {};
      for (const field of platform.fields) {
        fields[field.key] = saved?.credentials?.[field.key] ?? "";
      }
      map[platform.id] = {
        label: saved?.label ?? "",
        enabled: saved?.enabled ?? false,
        fields,
      };
    }
    return map;
  }, [credentials]);

  const [state, setState] = useState(initial);
  const [savingPlatform, setSavingPlatform] = useState<SocialPlatform | null>(null);

  async function handleSave(platform: SocialPlatform) {
    setSavingPlatform(platform);
    try {
      const row = state[platform];
      const result = await saveSocialChannelCredentials(adminId, platform, {
        label: row.label.trim() || undefined,
        credentials: row.fields,
        enabled: row.enabled,
      });
      if (result.error) throw new Error(result.error);
      toast.success(`${SOCIAL_PLATFORMS.find((p) => p.id === platform)?.name} credentials saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPlatform(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Save API keys and access tokens for each channel. Credentials are stored securely in your database and
        used only when publishing from the Social Media Manager.
      </p>
      {SOCIAL_PLATFORMS.map((platform) => {
        const row = state[platform.id];
        const saved = credentials.find((c) => c.platform === platform.id);
        return (
          <Card key={platform.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={row.enabled}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [platform.id]: { ...s[platform.id], enabled: e.target.checked },
                      }))
                    }
                  />
                  Enabled
                </label>
              </div>
              <CardDescription>
                {saved?.updated_at
                  ? `Last updated ${new Date(saved.updated_at).toLocaleString()}`
                  : "Not configured yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Account label (optional)</Label>
                <Input
                  value={row.label}
                  placeholder="@crownly"
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      [platform.id]: { ...s[platform.id], label: e.target.value },
                    }))
                  }
                />
              </div>
              {platform.fields.map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Input
                    type={field.secret ? "password" : "text"}
                    value={row.fields[field.key]}
                    placeholder={field.placeholder ?? (field.secret && saved ? maskSecret(saved.credentials[field.key] ?? "") : "")}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [platform.id]: {
                          ...s[platform.id],
                          fields: { ...s[platform.id].fields, [field.key]: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
              ))}
              <Button
                disabled={savingPlatform === platform.id}
                onClick={() => void handleSave(platform.id)}
              >
                {savingPlatform === platform.id ? "Saving…" : `Save ${platform.name}`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
