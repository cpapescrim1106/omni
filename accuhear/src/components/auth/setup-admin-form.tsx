"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupAdminForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, confirmPassword }),
          });
          const payload = await response.json().catch(() => ({ error: "Unable to create administrator." }));
          if (!response.ok) {
            throw new Error(payload.error || "Unable to create administrator.");
          }

          router.replace("/patients");
          router.refresh();
        } catch (setupError) {
          setError(setupError instanceof Error ? setupError.message : "Unable to create administrator.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="setup-email">Administrator email</Label>
        <Input
          id="setup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="setup-password">Password</Label>
        <Input
          id="setup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="setup-confirm-password">Confirm password</Label>
        <Input
          id="setup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating administrator..." : "Create administrator"}
      </Button>
    </form>
  );
}
