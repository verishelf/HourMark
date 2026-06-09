"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDealer, updateDealer } from "@/actions/dealers";
import type { Dealer } from "@/types/database";

type FormState = {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  city: string;
  country: string;
  inventory_value: string;
  estimated_monthly_sales: string;
  watch_count: string;
  instagram_followers: string;
  notes: string;
};

const emptyForm: FormState = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  city: "",
  country: "",
  inventory_value: "",
  estimated_monthly_sales: "",
  watch_count: "",
  instagram_followers: "",
  notes: "",
};

function dealerToForm(dealer: Dealer): FormState {
  return {
    company_name: dealer.company_name,
    contact_name: dealer.contact_name,
    email: dealer.email,
    phone: dealer.phone ?? "",
    website: dealer.website ?? "",
    instagram: dealer.instagram ?? "",
    city: dealer.city ?? "",
    country: dealer.country ?? "",
    inventory_value: dealer.inventory_value ? String(dealer.inventory_value / 100) : "",
    estimated_monthly_sales: dealer.estimated_monthly_sales ? String(dealer.estimated_monthly_sales / 100) : "",
    watch_count: String(dealer.watch_count ?? 0),
    instagram_followers: String(dealer.instagram_followers ?? 0),
    notes: dealer.notes ?? "",
  };
}

function formToPayload(form: FormState) {
  return {
    company_name: form.company_name,
    contact_name: form.contact_name,
    email: form.email,
    phone: form.phone || undefined,
    website: form.website || undefined,
    instagram: form.instagram || undefined,
    city: form.city || undefined,
    country: form.country || undefined,
    inventory_value: form.inventory_value ? Math.round(parseFloat(form.inventory_value) * 100) : 0,
    estimated_monthly_sales: form.estimated_monthly_sales ? Math.round(parseFloat(form.estimated_monthly_sales) * 100) : 0,
    watch_count: parseInt(form.watch_count) || 0,
    instagram_followers: parseInt(form.instagram_followers) || 0,
    notes: form.notes || undefined,
  };
}

export function DealerFormDialog({
  open,
  onOpenChange,
  adminId,
  dealer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
  dealer?: Dealer;
}) {
  const [form, setForm] = useState<FormState>(dealer ? dealerToForm(dealer) : emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    const payload = formToPayload(form);
    const result = dealer
      ? await updateDealer(adminId, dealer.id, payload)
      : await createDealer(adminId, payload);
    setSaving(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(dealer ? "Dealer updated" : "Dealer created");
    onOpenChange(false);
    if (!dealer) setForm(emptyForm);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dealer ? "Edit Dealer" : "Add Dealer"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company Name</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inventory Value ($)</Label>
              <Input type="number" value={form.inventory_value} onChange={(e) => setForm({ ...form, inventory_value: e.target.value })} />
            </div>
            <div>
              <Label>Est. Monthly Sales ($)</Label>
              <Input type="number" value={form.estimated_monthly_sales} onChange={(e) => setForm({ ...form, estimated_monthly_sales: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Watch Count</Label>
              <Input type="number" value={form.watch_count} onChange={(e) => setForm({ ...form, watch_count: e.target.value })} />
            </div>
            <div>
              <Label>Instagram Followers</Label>
              <Input type="number" value={form.instagram_followers} onChange={(e) => setForm({ ...form, instagram_followers: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : dealer ? "Update Dealer" : "Create Dealer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
