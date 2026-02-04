import { notFound } from "next/navigation";
import Link from "next/link";
import { getPatientById } from "@/lib/patient-data";
import { PatientJournal } from "@/components/patient-journal";
import { PatientMessaging } from "@/components/patient-messaging";
import { PatientDocuments } from "@/components/patient-documents";
import { PatientSales } from "@/components/patient-sales";
import { PatientAudiology } from "@/components/patient-audiology";
import { PatientDevices } from "@/components/patient-devices";
import { PatientPayers } from "@/components/patient-payers";
import { PatientTabRegistrar } from "@/components/patient-tabs";

const tabs = [
  "Summary",
  "Details",
  "Devices",
  "Audiology",
  "Journal",
  "Insurance/Payers",
  "Messaging",
  "Marketing",
  "Sales history",
  "Documents",
];

export default async function PatientProfilePage({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { tab?: string } | Promise<{ tab?: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams =
    searchParams && searchParams instanceof Promise ? await searchParams : searchParams;
  const patient = await getPatientById(resolvedParams.id);
  if (!patient) notFound();
  const activeTab = resolvedSearchParams?.tab ?? "Summary";
  const patientLabel = `${patient.lastName}, ${patient.firstName}${
    patient.preferredName ? ` (${patient.preferredName})` : ""
  }`;

  return (
    <div className="flex flex-col gap-6">
      <PatientTabRegistrar id={patient.id} label={patientLabel} status={patient.status} />
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-blue/15 text-xl font-semibold text-brand-ink">
              {patient.firstName.charAt(0)}
            </div>
            <div>
              <div className="text-xl font-semibold text-ink-strong">
                {patient.lastName}, {patient.firstName}
                {patient.preferredName ? ` (${patient.preferredName})` : ""}
              </div>
              <div className="text-sm text-ink-muted">
                DOB {patient.dateOfBirth?.toLocaleDateString() || "—"} · ID {patient.legacyId || "—"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge">{patient.status || "Active"}</span>
                {patient.providerName ? (
                  <span className="badge bg-brand-orange/10 text-brand-ink">{patient.providerName}</span>
                ) : null}
                {patient.location ? <span className="badge">{patient.location}</span> : null}
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-right text-xs text-ink-muted">
            <div>
              <div className="text-ink-soft">Patient balance</div>
              <div className="text-lg font-semibold text-ink-strong">$0.00</div>
            </div>
            <div>
              <div className="text-ink-soft">Punctuality</div>
              <div className="text-sm font-semibold text-success">1 min early</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={`/patients/${patient.id}?tab=${encodeURIComponent(tab)}`}
              className="tab-pill"
              data-active={activeTab === tab}
            >
              {tab}
            </Link>
          ))}
        </div>
      </section>

      {activeTab === "Audiology" ? (
        <PatientAudiology patientId={patient.id} />
      ) : activeTab === "Devices" ? (
        <PatientDevices patientId={patient.id} />
      ) : activeTab === "Journal" ? (
        <PatientJournal patientId={patient.id} />
      ) : activeTab === "Insurance/Payers" || activeTab === "3rd party payers" ? (
        <PatientPayers patientId={patient.id} />
      ) : activeTab === "Messaging" ? (
        <PatientMessaging patientId={patient.id} />
      ) : activeTab === "Sales history" ? (
        <PatientSales patientId={patient.id} />
      ) : activeTab === "Documents" ? (
        <PatientDocuments patientId={patient.id} />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="card p-6">
            <div className="section-title text-xs text-brand-ink">Summary</div>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Primary phone" value={patient.phones[0]?.normalized || "—"} />
                <InfoBlock label="Email" value={patient.email || "—"} />
                <InfoBlock label="Referral source" value={"—"} />
                <InfoBlock label="Referrer type" value={"—"} />
              </div>
              <div className="rounded-2xl bg-surface-1 p-4 text-sm text-ink-muted">
                Next appointment: Wed, Feb 3 · 2:15 PM · Consult
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="section-title text-xs text-brand-ink">Active devices</div>
            <div className="mt-4 space-y-3 text-sm">
              {patient.devices.length ? (
                patient.devices.slice(0, 2).map((device) => (
                  <DeviceRow
                    key={device.id}
                    name={`${device.manufacturer} ${device.model}`.trim()}
                    detail={`Serial ${device.serial || "—"}`}
                    status={device.status || "Active"}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs text-ink-muted">
                  No devices recorded yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-[0_8px_16px_rgba(24,20,50,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">{label}</div>
      <div className="mt-2 text-sm font-semibold text-ink-strong">{value}</div>
    </div>
  );
}

function DeviceRow({ name, detail, status }: { name: string; detail: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-[0_8px_16px_rgba(24,20,50,0.08)]">
      <div>
        <div className="text-sm font-semibold text-ink-strong">{name}</div>
        <div className="text-xs text-ink-muted">{detail}</div>
      </div>
      <span className="badge bg-brand-blue/10">{status}</span>
    </div>
  );
}
