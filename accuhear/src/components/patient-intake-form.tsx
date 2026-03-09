"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormState = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  phoneType: string;
  legacyId: string;
  providerName: string;
  location: string;
  status: string;
};

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  phoneType: "MOBILE",
  legacyId: "",
  providerName: "",
  location: "",
  status: "Active",
};

function buildInitialState(query?: string | null): FormState {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return INITIAL_STATE;

  if (trimmed.includes(",")) {
    const [lastName, firstName] = trimmed.split(",").map((part) => part.trim());
    return {
      ...INITIAL_STATE,
      firstName,
      lastName,
    };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { ...INITIAL_STATE, lastName: parts[0] };
  }

  return {
    ...INITIAL_STATE,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function PatientIntakeForm({ initialQuery }: { initialQuery?: string | null }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(() => buildInitialState(initialQuery));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create patient");
        return;
      }

      router.push(`/patients/${data.patient.id}`);
      router.refresh();
    } catch {
      setError("Unable to create patient");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="section-title text-xs text-brand-ink">New Patient</div>
            <div className="mt-2 text-sm text-ink-muted">
              Create a patient record and send staff directly into the patient chart.
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/patients" className="tab-pill bg-surface-2 text-xs">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full border border-transparent bg-brand-orange/10 px-4 py-2 text-xs font-semibold text-brand-ink disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create patient"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <input
                value={formState.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                className="input"
                name="firstName"
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Last name" required>
              <input
                value={formState.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                className="input"
                name="lastName"
                autoComplete="family-name"
                required
              />
            </Field>
            <Field label="Preferred name">
              <input
                value={formState.preferredName}
                onChange={(event) => updateField("preferredName", event.target.value)}
                className="input"
                name="preferredName"
              />
            </Field>
            <Field label="DOB">
              <input
                value={formState.dateOfBirth}
                onChange={(event) => updateField("dateOfBirth", event.target.value)}
                className="input"
                name="dateOfBirth"
                type="date"
              />
            </Field>
            <Field label="Email">
              <input
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="input"
                name="email"
                type="email"
                autoComplete="email"
              />
            </Field>
            <Field label="Reference #">
              <input
                value={formState.legacyId}
                onChange={(event) => updateField("legacyId", event.target.value)}
                className="input"
                name="legacyId"
                placeholder="Auto-generated if blank"
              />
            </Field>
          </div>

          <div className="rounded-3xl bg-surface-1/70 p-5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">Quick intake</div>
            <div className="mt-3 grid gap-4">
              <Field label="Primary phone">
                <input
                  value={formState.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="input"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Phone type">
                <select
                  value={formState.phoneType}
                  onChange={(event) => updateField("phoneType", event.target.value)}
                  className="input"
                  name="phoneType"
                >
                  <option value="MOBILE">Mobile</option>
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                </select>
              </Field>
              <Field label="Provider">
                <input
                  value={formState.providerName}
                  onChange={(event) => updateField("providerName", event.target.value)}
                  className="input"
                  name="providerName"
                />
              </Field>
              <Field label="Location">
                <input
                  value={formState.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className="input"
                  name="location"
                />
              </Field>
              <Field label="Status">
                <select
                  value={formState.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="input"
                  name="status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
