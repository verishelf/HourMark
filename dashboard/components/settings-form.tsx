"use client";

import { useState } from "react";
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

export function SettingsForm({
  settings,
  adminId,
  socialCredentials = [],
}: {
  settings: PlatformSettings | null;
  adminId: string;
  socialCredentials?: SocialChannelCredentials[];
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

  async function handleSave(section: string, data: Record<string, unknown>) {
    setSaving(true);
    await updatePlatformSettings(adminId, data);
    toast.success(`${section} saved`);
    setSaving(false);
  }

  return (
    <Tabs defaultValue="fees">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="inline-flex h-auto w-max flex-nowrap justify-start gap-1 md:h-9 md:w-full md:justify-center">
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

      <TabsContent value="fees">
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

      <TabsContent value="email">
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

      <TabsContent value="auth">
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

      <TabsContent value="social">
        <SocialCredentialsForm credentials={socialCredentials} adminId={adminId} />
      </TabsContent>

      <TabsContent value="platform">
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
    </Tabs>
  );
}
