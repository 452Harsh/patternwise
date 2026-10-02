"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/kit";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const next = params.get("next");
        // Only allow same-site relative redirects.
        router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't sign in");
    } catch {
      setError("Network error — is the server running?");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="pw">Password</Label>
        <Input
          id="pw"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "pw-error" : undefined}
        />
        {error && (
          <p id="pw-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy || !password}>
        {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary font-mono text-base font-bold text-primary-foreground">
            {"{}"}
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Patternwise</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal DSA workspace</p>
        </div>
        <Panel className="p-6">
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <LockKeyhole className="size-4" aria-hidden /> Sign in to continue
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </Panel>
      </div>
    </main>
  );
}
