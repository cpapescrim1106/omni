"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
              <Badge variant="neutral">Current UI</Badge>
              <Badge variant="orange">Form Draft</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/patients" className="tab-pill bg-surface-2 text-xs">
              Cancel
            </Link>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create patient"}
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
            <Input value={formState.legacyId} onChange={(e) => updateField("legacyId", e.target.value)} className="input" />
          </Field>
          <Field label="Title">
            <Select value={formState.title} onValueChange={(value) => updateField("title", value ?? "")}>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Gender">
            <Select value={formState.gender} onValueChange={(value) => updateField("gender", value ?? "U")}>
              <SelectTrigger className="input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="U">U</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="M">M</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="First name" required>
            <Input
              value={formState.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="input"
              autoComplete="given-name"
              required
            />
          </Field>
          <Field label="Initial">
            <Input
              value={formState.initial}
              onChange={(e) => updateField("initial", e.target.value.slice(0, 1))}
              className="input"
              maxLength={1}
            />
          </Field>
          <Field label="Last name" required>
            <Input
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
            <Input value={formState.preferredName} onChange={(e) => updateField("preferredName", e.target.value)} className="input" />
          </Field>
          <Field label="Date of birth">
            <input value={formState.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="input" type="date" />
          </Field>
          <Field label="SS#">
            <Input value={formState.ssn} onChange={(e) => updateField("ssn", e.target.value)} className="input" />
          </Field>
          <Field label="Provider">
            <Input value={formState.providerName} onChange={(e) => updateField("providerName", e.target.value)} className="input" />
          </Field>
          <Field label="Status">
            <Select value={formState.status} onValueChange={(value) => updateField("status", value ?? "Active")}>
              <SelectTrigger className="input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-6 rounded-3xl bg-surface-1/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink-strong">Healthcare providers</div>
              <div className="text-xs text-ink-muted">Provider associations will be fleshed out once the intake workflow is finalized.</div>
            </div>
            <Button type="button" variant="secondary" size="sm" className="bg-white">
              Edit providers
            </Button>
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
            <Input value={formState.aptUnit} onChange={(e) => updateField("aptUnit", e.target.value)} className="input" />
          </Field>
          <Field label="Street #">
            <Input value={formState.streetNumber} onChange={(e) => updateField("streetNumber", e.target.value)} className="input" />
          </Field>
          <Field label="Street" className="xl:col-span-2">
            <Input value={formState.street} onChange={(e) => updateField("street", e.target.value)} className="input" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field label="City">
            <Input value={formState.city} onChange={(e) => updateField("city", e.target.value)} className="input" />
          </Field>
          <Field label="Country">
            <Select value={formState.country} onValueChange={(value) => updateField("country", value ?? "USA")}>
              <SelectTrigger className="input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="State">
            <Input value={formState.state} onChange={(e) => updateField("state", e.target.value)} className="input" />
          </Field>
          <Field label="Zip">
            <Input value={formState.zip} onChange={(e) => updateField("zip", e.target.value)} className="input" />
          </Field>
          <Field label="Location">
            <Input value={formState.location} onChange={(e) => updateField("location", e.target.value)} className="input" />
          </Field>
          <Field label="Email address">
            <Input value={formState.email} onChange={(e) => updateField("email", e.target.value)} className="input" type="email" autoComplete="email" />
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
    <Label className={`grid gap-2 font-body ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </Label>
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
          <Badge variant={highlight ? "orange" : "neutral"}>{type}</Badge>
        </div>
        <Field label="Telephone">
          <Input value={phone} onChange={(event) => onPhoneChange(event.target.value)} className="input" type="tel" />
        </Field>
        <Field label="Extension">
          <Input value={extension} onChange={(event) => onExtensionChange(event.target.value)} className="input" />
        </Field>
      </div>
    </div>
  );
}
