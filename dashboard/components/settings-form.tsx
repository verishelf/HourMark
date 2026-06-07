"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePlatformSettings } from "@/actions/settings";
import { SocialCredentialsForm } from "@/components/settings/social-credentials-form";
import type { PlatformSettings } from "@/types/database";
import type { SocialChannelCredentials } from "@/types/social-media";

const SETTINGS_TABS = ["fees", "email", "auth", "social", "platform"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function parseSettingsTab(tab: string | undefined): SettingsTab {
  if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) {
    return tab as SettingsTab;
  }
  return "fees";
}

export function SettingsForm({
  settings,
  adminId,
  socialCredentials = [],
  initialTab = "fees",
}: {
  settings: PlatformSettings | null;
  adminId: string;
  socialCredentials?: SocialChannelCredentials[];
  initialTab?: string;
}) {
  const [commission, setCommission] = useState(settings?.commission_percentage ?? 5);
  const [sellerFee, setSellerFee] = useState(settings?.seller_fee_percentage ?? 7);
  const [buyerFee, setBuyerFee] = useState(settings?.buyer_fee_percentage ?? 0);
  const [welcomeTemplate, setWelcomeTemplate] = useState(
    settings?.email_templates?.welcome ?? "Welcome to Crownly, the premier luxury watch marketplace."
  );
  const [authRules, setAuthRules] = useState(
    JSON.stringify(settings?.authentication_rules ?? { min_trust_score: 70, require_serial: true }, null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => parseSettingsTab(initialTab));
  const tabScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(parseSettingsTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    if (!settings) return;
    setCommission(settings.commission_percentage ?? 5);
    setSellerFee(settings.seller_fee_percentage ?? 7);
    setBuyerFee(settings.buyer_fee_percentage ?? 0);
    setWelcomeTemplate(
      settings.email_templates?.welcome ??
        "Welcome to Crownly, the premier luxury watch marketplace."
    );
    setAuthRules(
      JSON.stringify(settings.authentication_rules ?? { min_trust_score: 70, require_serial: true }, null, 2)
    );
  }, [settings]);

  useEffect(() => {
    const activeTrigger = tabScrollRef.current?.querySelector<HTMLElement>(
      `[data-state="active"]`
    );
    activeTrigger?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeTab]);

  async function handleSave(section: string, data: Record<string, unknown>) {
    setSaving(true);
    await updatePlatformSettings(adminId, data);
    toast.success(`${section} saved`);
    setSaving(false);
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="-mx-4 sm:-mx-6 md:mx-0">
        <div className="w-full rounded-lg bg-muted p-1">
          <div
            ref={tabScrollRef}
            className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:overflow-visible"
          >
            <TabsList className="inline-flex h-auto w-max flex-nowrap justify-start gap-1 bg-transparent p-0 shadow-none md:h-9 md:w-full md:justify-center">
              <TabsTrigger value="fees" className="shrink-0">
                Fees & Commission
              </TabsTrigger>
              <TabsTrigger value="email" className="shrink-0">
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="auth" className="shrink-0">
                Authentication Rules
              </TabsTrigger>
              <TabsTrigger value="social" className="shrink-0">
                Social Media API Keys
              </TabsTrigger>
              <TabsTrigger value="platform" className="shrink-0">
                Platform Settings
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
      </div>

      <div className="mt-4 w-full min-w-0">
      <TabsContent value="fees" forceMount className="mt-0 data-[state=inactive]:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Fees & Commission</CardTitle>
            <CardDescription>Configure marketplace fee structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Commission Percentage (%)</Label>
              <Input type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
            </div>
            <div>
              <Label>Seller listing fee (%)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Deducted from seller payout on Stripe sales (default 7%).
              </p>
              <Input type="number" value={sellerFee} onChange={(e) => setSellerFee(Number(e.target.value))} />
            </div>
            <div>
              <Label>Buyer Fee (%)</Label>
              <Input type="number" value={buyerFee} onChange={(e) => setBuyerFee(Number(e.target.value))} />
            </div>
            <Button
              disabled={saving}
              onClick={() =>
                handleSave("Fees", {
                  commission_percentage: commission,
                  seller_fee_percentage: sellerFee,
                  buyer_fee_percentage: buyerFee,
                })
              }
            >
              Save Fees
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email" forceMount className="mt-0 data-[state=inactive]:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Manage default email templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Welcome Email</Label>
              <Textarea value={welcomeTemplate} onChange={(e) => setWelcomeTemplate(e.target.value)} rows={4} />
            </div>
            <Button
              disabled={saving}
              onClick={() =>
                handleSave("Email templates", { email_templates: { welcome: welcomeTemplate } })
              }
            >
              Save Templates
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="auth" forceMount className="mt-0 data-[state=inactive]:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Rules</CardTitle>
            <CardDescription>Configure watch authentication requirements (JSON)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={authRules} onChange={(e) => setAuthRules(e.target.value)} rows={8} className="font-mono text-sm" />
            <Button
              disabled={saving}
              onClick={() => {
                try {
                  handleSave("Authentication rules", {
                    authentication_rules: JSON.parse(authRules),
                  });
                } catch {
                  toast.error("Invalid JSON");
                }
              }}
            >
              Save Rules
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="social" forceMount className="mt-0 data-[state=inactive]:hidden">
        <SocialCredentialsForm credentials={socialCredentials} adminId={adminId} />
      </TabsContent>

      <TabsContent value="platform" forceMount className="mt-0 data-[state=inactive]:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Platform settings are stored in the database and shared across the Crownly mobile app,
              marketing website, and admin dashboard.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      </div>
    </Tabs>
  );
}
