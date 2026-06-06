"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EmailHtmlPreview({
  html,
  open,
  onOpenChange,
  title = "Email Preview",
}: {
  html: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          {html.trim() ? (
            <iframe
              title={title}
              srcDoc={html}
              className="h-[70vh] w-full rounded-md border border-border bg-white"
              sandbox=""
            />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Add HTML to preview the email.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
