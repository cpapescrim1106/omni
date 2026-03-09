"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";

type PatientDetailsProps = {
  patient: {
    id: string;
    legacyId: string | null;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
    dateOfBirth?: Date | null;
    email?: string | null;
    status?: string | null;
    providerName?: string | null;
    location?: string | null;
    phones: { id: string; type: string; number: string; normalized: string }[];
  };
};

const PLACEHOLDER_ADDRESS = {
  aptUnit: "",
  streetNumber: "2387",
  street: "Example St",
  city: "Washington",
  state: "DC",
  zip: "20001",
  country: "USA",
};

const PLACEHOLDER_PHONES = [
  { type: "Home", number: "(202) 555-0100", extension: "" },
  { type: "Work", number: "", extension: "" },
  { type: "Mobile", number: "(202) 555-0101", extension: "" },
];

export function PatientDetails({ patient }: PatientDetailsProps) {
  const [activeTab, setActiveTab] = useState<"contact" | "alternate">("contact");

  const age = useMemo(() => {
    if (!patient.dateOfBirth) return "—";
    const dob = dayjs(patient.dateOfBirth);
    if (!dob.isValid()) return "—";
    return String(dayjs().diff(dob, "year"));
  }, [patient.dateOfBirth]);

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Details</div>
          <div className="text-sm text-ink-muted">Contact information and patient preferences.</div>
        </div>
      </div>

      <div className="mt-4 flex">
        <div className="seg-tabs-inner">
          <button
            type="button"
            className={`seg-tab${activeTab === "contact" ? " active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            Contact details
          </button>
          <button
            type="button"
            className={`seg-tab${activeTab === "alternate" ? " active" : ""}`}
            onClick={() => setActiveTab("alternate")}
          >
            Alternate contact
          </button>
        </div>
      </div>

      {activeTab === "alternate" ? (
        <div className="mt-6 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 text-sm text-ink-muted">
          Alternate contact details will appear here once available.
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Patient ID" value={patient.id} />
                <Field label="Reference #" value={patient.legacyId || "—"} />
                <Field label="Title" value={"Mrs."} />
                <Field label="Gender" value={"U"} />
                <Field label="First name" value={patient.firstName} />
                <Field label="Initial" value={""} />
                <Field label="Last name" value={patient.lastName} />
                <Field label="DOB" value={patient.dateOfBirth ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY") : "—"} />
                <Field label="Age" value={age} />
                <Field label="SS#" value={"•••-••-••••"} />
                <Field label="Provider" value={patient.providerName || "—"} />
                <Field label="Status" value={patient.status || "Active"} />
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-dashed border-surface-3 bg-white/70 p-4 text-xs text-ink-muted">
                  Healthcare providers list will be shown here.
                </div>
                <button type="button" className="tab-pill w-fit bg-surface-2 text-xs">
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Apt/Unit" value={PLACEHOLDER_ADDRESS.aptUnit || "—"} />
              <Field label="Street #" value={PLACEHOLDER_ADDRESS.streetNumber} />
              <Field label="Street" value={PLACEHOLDER_ADDRESS.street} />
              <Field label="City" value={PLACEHOLDER_ADDRESS.city} />
              <Field label="State" value={PLACEHOLDER_ADDRESS.state} />
              <Field label="Zip" value={PLACEHOLDER_ADDRESS.zip} />
              <Field label="Country" value={PLACEHOLDER_ADDRESS.country} />
              <Field label="Location" value={patient.location || "—"} />
              <Field label="Email address" value={patient.email || "—"} />
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not mail
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not email
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not text
              </label>
            </div>
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="grid gap-3">
              {PLACEHOLDER_PHONES.map((phone) => (
                <div key={phone.type} className="grid gap-3 sm:grid-cols-[140px_1fr_120px]">
                  <Field label="Type" value={phone.type} />
                  <Field label="Telephone" value={phone.number || "—"} />
                  <Field label="Extension" value={phone.extension || ""} />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-muted">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> Cash sales only
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> Do not send commercial messages
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span>Preferred language:</span>
                <select className="rounded-[8px] border border-[var(--surface-3)] bg-white px-3 py-1 text-[12px]">
                  <option>English</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft" style={{fontFamily:"var(--font-display)"}}>
        {label}
      </div>
      <div className="border-b border-transparent py-1 text-[13px] text-ink hover:border-[var(--surface-3)] cursor-text">
        {value}
      </div>
    </div>
  );
}
