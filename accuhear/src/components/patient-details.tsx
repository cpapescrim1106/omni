"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    <section className="card px-4 pt-0 pb-4">
      <div className="flex items-center gap-4">
        <div className="seg-tabs-inner">
          <Button
            type="button"
            variant="ghost"
            size="micro"
            className={cn("seg-tab", activeTab === "contact" && "active")}
            onClick={() => setActiveTab("contact")}
          >
            Contact details
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="micro"
            className={cn("seg-tab", activeTab === "alternate" && "active")}
            onClick={() => setActiveTab("alternate")}
          >
            Alternate contact
          </Button>
        </div>
      </div>

      {activeTab === "alternate" ? (
        <div className="mt-4 text-[13px] text-ink-muted">
          Alternate contact details will appear here once available.
        </div>
      ) : (
        <div>
          <div className="section-title">Personal Information</div>
          <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <Field label="First name" value={patient.firstName} />
            <Field label="Last name" value={patient.lastName} />
            <Field label="Preferred name" value={patient.preferredName || "—"} />
            <Field label="Title" value="Mrs." />
            <Field label="Gender" value="U" />
            <Field label="Initial" value="" />
            <Field label="DOB" value={patient.dateOfBirth ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY") : "—"} />
            <Field label="Age" value={age} />
            <Field label="SS#" value="•••-••-••••" />
            <Field label="Patient ID" value={patient.id} />
            <Field label="Reference #" value={patient.legacyId || "—"} />
            <Field label="Status" value={patient.status || "Active"} />
            <Field label="Provider" value={patient.providerName || "—"} />
          </div>

          <div className="section-title">Address</div>
          <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <Field label="Street #" value={PLACEHOLDER_ADDRESS.streetNumber} />
            <Field label="Street" value={PLACEHOLDER_ADDRESS.street} />
            <Field label="Apt/Unit" value={PLACEHOLDER_ADDRESS.aptUnit || "—"} />
            <Field label="City" value={PLACEHOLDER_ADDRESS.city} />
            <Field label="State" value={PLACEHOLDER_ADDRESS.state} />
            <Field label="Zip" value={PLACEHOLDER_ADDRESS.zip} />
            <Field label="Country" value={PLACEHOLDER_ADDRESS.country} />
            <Field label="Location" value={patient.location || "—"} />
            <Field label="Email" value={patient.email || "—"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-ink-muted">
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

          <div className="section-title">Phone Numbers</div>
          <div className="grid gap-y-2">
            {PLACEHOLDER_PHONES.map((phone) => (
              <div key={phone.type} className="grid gap-x-3" style={{ gridTemplateColumns: "140px 1fr 120px" }}>
                <Field label="Type" value={phone.type} />
                <Field label="Telephone" value={phone.number || "—"} />
                <Field label="Extension" value={phone.extension || ""} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-muted">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Cash sales only
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not send commercial messages
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="font-body text-[12px] font-normal normal-case tracking-normal text-ink-muted">
                Preferred language:
              </Label>
              <Select defaultValue="English">
                <SelectTrigger className="w-[120px] bg-white text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="section-title">Healthcare Providers</div>
          <div className="text-[13px] text-ink-muted">
            Healthcare providers list will be shown here.
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </div>
      <div className="cursor-text border-b border-transparent py-1 text-[13px] text-ink hover:border-[var(--surface-3)]">
        {value}
      </div>
    </div>
  );
}
