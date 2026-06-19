"use client";

import { FormEvent, useState } from "react";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Panel from "../ui/Panel";

export default function AuthView({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
  onSignUp: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both an email and password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    const result =
      mode === "signin"
        ? await onSignIn(email.trim(), password)
        : await onSignUp(email.trim(), password);

    setMessage(result.message);
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
            French • Spanish • Hebrew • Cloud Sync
          </div>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            FluentDeck
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Sign in to save your language decks, flashcards, and spaced-repetition
            progress across devices.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <FeatureCard title="Flashcards" text="Build custom decks for each language." />
            <FeatureCard title="Review" text="Study due cards with spaced repetition." />
            <FeatureCard title="Hebrew" text="Right-to-left text and transliteration support." />
          </div>
        </section>

        <Panel
          title={mode === "signin" ? "Welcome back" : "Create your account"}
          subtitle={
            mode === "signin"
              ? "Sign in to continue studying."
              : "Create an account to save your decks in Supabase."
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="input"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />
            </Field>

            {message && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                {message}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-base"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
              }}
              className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </form>
        </Panel>
      </div>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}