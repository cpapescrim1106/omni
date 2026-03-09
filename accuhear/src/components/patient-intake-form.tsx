"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormState = {
  legacyId: string;
  title: string;
  gender: string;
  firstName: string;
  initial: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  ssn: string;
  providerName: string;
  aptUnit: string;
  streetNumber: string;
  street: string;
  city: string;
  country: string;
  state: string;
  zip: string;
  location: string;
  email: string;
  homePhone: string;
  homeExtension: string;
  workPhone: string;
  workExtension: string;
  mobilePhone: string;
  mobileExtension: string;
  status: string;
  doNotMail: boolean;
  doNotEmail: boolean;
  doNotText: boolean;
};

const INITIAL_STATE: FormState = {
  legacyId: "",
  title: "",
  gender: "U",
  firstName: "",
  initial: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  ssn: "",
  providerName: "",
  aptUnit: "",
  streetNumber: "",
  street: "",
  city: "",
  country: "USA",
  state: "FL",
  zip: "",
  location: "SHD",
  email: "",
  homePhone: "",
  homeExtension: "",
  workPhone: "",
  workExtension: "",
  mobilePhone: "",
  mobileExtension: "",
  status: "Active",
  doNotMail: false,
  doNotEmail: false,
  doNotText: false,
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

function formatAge(dateOfBirth: string) {
  if (!dateOfBirth) return "—";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "—";
}

export function PatientIntakeForm({ initialQuery }: { initialQuery?: string | null }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(() => buildInitialState(initialQuery));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = useMemo(() => formatAge(formState.dateOfBirth), [formState.dateOfBirth]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legacyId: formState.legacyId,
          firstName: formState.firstName,
          lastName: formState.lastName,
          preferredName: formState.preferredName,
          dateOfBirth: formState.dateOfBirth,
          email: formState.email,
          phone: formState.mobilePhone || formState.homePhone || formState.workPhone,
          phoneType: formState.mobilePhone ? "MOBILE" : formState.homePhone ? "HOME" : "WORK",
          providerName: formState.providerName,
          location: formState.location,
          status: formState.status,
        }),
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
          <div className="max-w-2xl">
            <div className="section-title text-xs text-brand-ink">New Patient</div>
            <div className="mt-2 text-sm text-ink-muted">
              Draft the intake experience in Omni’s UI style first. The underlying patient create flow can be refined after the layout settles.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge">Current UI</span>
              <span className="badge bg-brand-orange/10 text-brand-ink">Form Draft</span>
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
              {submitting ? "Creating..." : "Create patient"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="section-title text-xs text-brand-ink">Identity</div>
            <div className="text-sm text-ink-muted">Primary demographics and chart metadata.</div>
          </div>
          <div className="rounded-2xl bg-surface-1 px-4 py-3 text-right text-xs">
            <div className="text-ink-soft">Computed age</div>
            <div className="text-sm font-semibold text-ink-strong">{age}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field label="Reference #">
            <input value={formState.legacyId} onChange={(e) => updateField("legacyId", e.target.value)} className="input" />
          </Field>
          <Field label="Title">
            <select value={formState.title} onChange={(e) => updateField("title", e.target.value)} className="input">
              <option value="">Select title</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </Field>
          <Field label="Gender">
            <select value={formState.gender} onChange={(e) => updateField("gender", e.target.value)} className="input">
              <option value="U">U</option>
              <option value="F">F</option>
              <option value="M">M</option>
            </select>
          </Field>
          <Field label="First name" required>
            <input
              value={formState.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="input"
              autoComplete="given-name"
              required
            />
          </Field>
          <Field label="Initial">
            <input
              value={formState.initial}
              onChange={(e) => updateField("initial", e.target.value.slice(0, 1))}
              className="input"
              maxLength={1}
            />
          </Field>
          <Field label="Last name" required>
            <input
              value={formState.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="input"
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Preferred name">
            <input value={formState.preferredName} onChange={(e) => updateField("preferredName", e.target.value)} className="input" />
          </Field>
          <Field label="Date of birth">
            <input value={formState.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="input" type="date" />
          </Field>
          <Field label="SS#">
            <input value={formState.ssn} onChange={(e) => updateField("ssn", e.target.value)} className="input" />
          </Field>
          <Field label="Provider">
            <input value={formState.providerName} onChange={(e) => updateField("providerName", e.target.value)} className="input" />
          </Field>
          <Field label="Status">
            <select value={formState.status} onChange={(e) => updateField("status", e.target.value)} className="input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Deceased">Deceased</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 rounded-3xl bg-surface-1/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink-strong">Healthcare providers</div>
              <div className="text-xs text-ink-muted">Provider associations will be fleshed out once the intake workflow is finalized.</div>
            </div>
            <button type="button" className="tab-pill bg-white text-xs">
              Edit providers
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div>
          <div className="section-title text-xs text-brand-ink">Contact Details</div>
          <div className="text-sm text-ink-muted">Mailing fields, office routing, and communication preferences.</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Apt / Unit">
            <input value={formState.aptUnit} onChange={(e) => updateField("aptUnit", e.target.value)} className="input" />
          </Field>
          <Field label="Street #">
            <input value={formState.streetNumber} onChange={(e) => updateField("streetNumber", e.target.value)} className="input" />
          </Field>
          <Field label="Street" className="xl:col-span-2">
            <input value={formState.street} onChange={(e) => updateField("street", e.target.value)} className="input" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field label="City">
            <input value={formState.city} onChange={(e) => updateField("city", e.target.value)} className="input" />
          </Field>
          <Field label="Country">
            <select value={formState.country} onChange={(e) => updateField("country", e.target.value)} className="input">
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
            </select>
          </Field>
          <Field label="State">
            <input value={formState.state} onChange={(e) => updateField("state", e.target.value)} className="input" />
          </Field>
          <Field label="Zip">
            <input value={formState.zip} onChange={(e) => updateField("zip", e.target.value)} className="input" />
          </Field>
          <Field label="Location">
            <input value={formState.location} onChange={(e) => updateField("location", e.target.value)} className="input" />
          </Field>
          <Field label="Email address">
            <input value={formState.email} onChange={(e) => updateField("email", e.target.value)} className="input" type="email" autoComplete="email" />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Toggle
            label="Do not mail"
            checked={formState.doNotMail}
            onChange={(checked) => updateField("doNotMail", checked)}
          />
          <Toggle
            label="Do not email"
            checked={formState.doNotEmail}
            onChange={(checked) => updateField("doNotEmail", checked)}
          />
          <Toggle
            label="Do not text"
            checked={formState.doNotText}
            onChange={(checked) => updateField("doNotText", checked)}
          />
        </div>
      </section>

      <section className="card p-6">
        <div>
          <div className="section-title text-xs text-brand-ink">Phone Numbers</div>
          <div className="text-sm text-ink-muted">Primary communication channels and extensions.</div>
        </div>

        <div className="mt-6 grid gap-4">
          <PhoneRow
            type="Home"
            phone={formState.homePhone}
            extension={formState.homeExtension}
            onPhoneChange={(value) => updateField("homePhone", value)}
            onExtensionChange={(value) => updateField("homeExtension", value)}
          />
          <PhoneRow
            type="Work"
            phone={formState.workPhone}
            extension={formState.workExtension}
            onPhoneChange={(value) => updateField("workPhone", value)}
            onExtensionChange={(value) => updateField("workExtension", value)}
          />
          <PhoneRow
            type="Mobile"
            phone={formState.mobilePhone}
            extension={formState.mobileExtension}
            onPhoneChange={(value) => updateField("mobilePhone", value)}
            onExtensionChange={(value) => updateField("mobileExtension", value)}
            highlight
          />
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-surface-1 px-4 py-2 text-sm text-ink-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function PhoneRow({
  type,
  phone,
  extension,
  onPhoneChange,
  onExtensionChange,
  highlight,
}: {
  type: string;
  phone: string;
  extension: string;
  onPhoneChange: (value: string) => void;
  onExtensionChange: (value: string) => void;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-3xl border border-surface-2 p-4 ${highlight ? "bg-brand-blue/8" : "bg-white/70"}`}>
      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_180px]">
        <div className="flex items-center">
          <span className={`badge ${highlight ? "bg-brand-orange/10 text-brand-ink" : ""}`}>{type}</span>
        </div>
        <Field label="Telephone">
          <input value={phone} onChange={(event) => onPhoneChange(event.target.value)} className="input" type="tel" />
        </Field>
        <Field label="Extension">
          <input value={extension} onChange={(event) => onExtensionChange(event.target.value)} className="input" />
        </Field>
      </div>
    </div>
  );
}
