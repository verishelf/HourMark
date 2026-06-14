"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signUpAction } from "./actions";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profile";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("username", username);
      formData.set("email", email);
      formData.set("password", password);
      const result = await signUpAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        setInfo("Check your email to verify your account, then sign in.");
        return;
      }
      router.refresh();
      router.push(redirect);
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        Join Crownly to buy, sell, and manage listings on the web.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          required
          autoComplete="username"
          minLength={3}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          required
          autoComplete="email"
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
          required
          autoComplete="new-password"
          minLength={6}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-gold">{info}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-black disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/auth/login${redirect !== "/profile" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-gold">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
