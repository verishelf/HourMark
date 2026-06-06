"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EmailSignupForm } from "@/components/EmailSignupForm";

const STORAGE_KEY = "crownly_email_popup_seen";
const SHOW_DELAY_MS = 3000;

export function EmailSignupPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss]);

  function handleSuccess() {
    window.localStorage.setItem(STORAGE_KEY, "subscribed");
    window.setTimeout(() => setOpen(false), 1800);
  }

  if (pathname !== "/") return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close signup popup"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={dismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-popup-title"
            className="relative w-full max-w-lg border border-[#1a1a1a] bg-[#0a0a0a] p-8 shadow-2xl sm:p-10"
          >
            <div className="mb-6 border-b border-[#1a1a1a] pb-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#C9A962]">
                Crownly
              </p>
              <h2
                id="email-popup-title"
                className="mt-3 font-[family-name:var(--font-geist-sans)] text-2xl font-light tracking-tight text-white sm:text-3xl"
              >
                Join the waitlist
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                Be first to know when Crownly launches on the App Store — authenticated
                luxury watches, escrow checkout, and collector tools built in.
              </p>
            </div>

            <EmailSignupForm
              source="website_popup"
              buttonLabel="Notify Me"
              formId="popup-email-form"
              inputId="popup-email"
              stacked
              className="w-full"
              onSuccess={handleSuccess}
            />

            <button
              type="button"
              onClick={dismiss}
              className="mt-6 w-full text-center text-[10px] uppercase tracking-[0.18em] text-[#71717a] transition-colors hover:text-[#a1a1aa]"
            >
              Not now
            </button>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-[#71717a] transition-colors hover:text-white"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
