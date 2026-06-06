"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export function EmailSignupForm({
  source = "website_waitlist",
  buttonLabel = "Join the Waitlist",
}: {
  source?: string;
  buttonLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          source,
          company: formData.get("company"),
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
      setMessage(data.message ?? "Thanks — you are on the list.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-12 w-full max-w-md">
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={state === "loading" || state === "success"}
          className="w-full border border-[#1a1a1a] bg-black px-4 py-4 text-sm text-white placeholder:text-[#71717a] outline-none transition-colors focus:border-[#333]"
        />
        <button
          type="submit"
          disabled={state === "loading" || state === "success"}
          className="shrink-0 bg-white px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "loading" ? "Submitting..." : buttonLabel}
        </button>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {message ? (
        <p
          className={`mt-4 text-sm ${
            state === "error" ? "text-red-400" : "text-[#a1a1aa]"
          }`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
