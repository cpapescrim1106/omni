import { notFound } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { getPatientById } from "@/lib/patient-data";
import { PatientJournal } from "@/components/patient-journal";
import { PatientMessaging } from "@/components/patient-messaging";
import { PatientDocuments } from "@/components/patient-documents";
import { PatientSales } from "@/components/patient-sales";
import { PatientAudiology } from "@/components/patient-audiology";
import { PatientDevices } from "@/components/patient-devices";
import { PatientPayers } from "@/components/patient-payers";
import { PatientDetails } from "@/components/patient-details";
import { PatientMarketing } from "@/components/patient-marketing";
import { PatientTabRegistrar } from "@/components/patient-tabs";

const tabs = [
  "Summary",
  "Details",
  "Hearing aids",
  "Audiology",
  "Journal",
  "3rd party payers",
  "Messaging",
  "Marketing",
  "Sales history",
  "Documents",
];

const PLACEHOLDER_ADDRESS = "2387 Grandfather Mtn, Spring Hill, FL 34606";

const APPOINTMENTS = [
  { date: "05/19/2026 10:30 AM - 11:00 AM", type: "Clean and Check", provider: "SHD C + C" },
  { date: "01/07/2026 01:15 PM - 02:00 PM", type: "Consult", provider: "Chris Pape" },
];

const LAST_AUDIOGRAM = [
  { ear: "Right", severity: "Mild", type: "Sensorineural", shape: "Sloping" },
  { ear: "Left", severity: "Moderately severe", type: "Sensorineural", shape: "Sloping" },
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
  const patientLabel = `${patient.lastName}, ${patient.firstName}${patient.preferredName ? ` (${patient.preferredName})` : ""}`;

  const age = patient.dateOfBirth ? dayjs().diff(dayjs(patient.dateOfBirth), "year") : null;
  const phoneButtons = patient.phones.length
    ? patient.phones.slice(0, 3).map((phone) => ({
        label: phone.type || "Phone",
        number: phone.number || phone.normalized,
      }))
    : [
        { label: "Home", number: "(352)688-6322" },
        { label: "Mobile", number: "(720)880-8948" },
      ];

  const payerTags = patient.payerPolicies.map((policy) => policy.payerName);

  const aidRows = patient.devices.length
    ? patient.devices.map((device) => ({
        model: `${device.manufacturer} ${device.model}`.trim(),
        battery: "Other",
        notes: device.serial ? `Serial ${device.serial}` : "—",
        purchase: device.createdAt ? dayjs(device.createdAt).format("MM/DD/YYYY") : "—",
        status: device.status || "Active",
      }))
    : [
        {
          model: "Oticon More 3 miniRITE R",
          battery: "Other",
          notes: "extended warranty exp 1/15/27",
          purchase: "01/17/2023",
          status: "Active",
        },
      ];

  return (
    <div className="flex flex-col gap-6">
      <PatientTabRegistrar id={patient.id} label={patientLabel} status={patient.status} />
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-blue/15 text-xl font-semibold text-brand-ink">
              {patient.firstName.charAt(0)}
            </div>
            <div>
              <div className="text-xl font-semibold text-ink-strong">
                {patient.lastName}, {patient.firstName}
              </div>
              <div className="text-sm text-ink-muted">
                {patient.dateOfBirth
                  ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY")
                  : "—"}{" "}
                {age ? `· ${age}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {phoneButtons.map((phone) => (
                  <span
                    key={`${phone.label}-${phone.number}`}
                    className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white"
                  >
                    {phone.number}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right text-xs text-ink-muted">
            <div className="flex items-center justify-between gap-4">
              <span>Patient balance</span>
              <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Pending 3rd party reimbursement</span>
              <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Punctuality</span>
              <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
                1min early (7)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>No show rate</span>
              <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
                0% (0/18)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {patient.providerName ? (
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-ink">
              {patient.providerName}
            </span>
          ) : null}
          {patient.location ? (
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-ink">
              {patient.location}
            </span>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl bg-surface-1/70 px-4 py-3 text-sm text-ink-muted">
          {PLACEHOLDER_ADDRESS}
        </div>

        <div className="mt-3 rounded-2xl bg-brand-blue/10 px-4 py-3 text-sm text-brand-ink">
          Preferred Name: {patient.preferredName || "—"} · extended warranty exp 1/15/27
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {payerTags.length ? (
            payerTags.map((payer) => (
              <span key={payer} className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">
                {payer}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">Medicare</span>
          )}
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">United Healthcare</span>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">Current</span>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">Jan MC Benefit</span>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">Outreach - Seminar</span>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">Patient Service - Repair / Service</span>
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
      ) : activeTab === "Devices" || activeTab === "Hearing aids" ? (
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
      ) : activeTab === "Details" ? (
        <PatientDetails patient={patient} />
      ) : activeTab === "Marketing" ? (
        <PatientMarketing />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="card p-6">
            <div className="section-title text-xs text-brand-ink">Appointments</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
              <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Appointment date</span>
                <span>Appointment type</span>
                <span>Provider</span>
              </div>
              {APPOINTMENTS.map((appointment) => (
                <div
                  key={appointment.date}
                  className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 border-t border-surface-2 px-4 py-3 text-sm"
                >
                  <span className="text-ink-muted">{appointment.date}</span>
                  <span className="text-ink-strong">{appointment.type}</span>
                  <span className="text-ink-muted">{appointment.provider}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-surface-2 bg-white/80">
              <div className="px-4 py-3 text-xs font-semibold text-ink-muted">
                Last audiogram 01/07/2026
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span></span>
                <span>Severity</span>
                <span>Type</span>
                <span>Shape</span>
              </div>
              {LAST_AUDIOGRAM.map((row) => (
                <div
                  key={row.ear}
                  className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 border-t border-surface-2 px-4 py-3 text-sm"
                >
                  <span className="text-ink-muted">{row.ear}</span>
                  <span className="text-ink-strong">{row.severity}</span>
                  <span className="text-ink-muted">{row.type}</span>
                  <span className="text-ink-muted">{row.shape}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="section-title text-xs text-brand-ink">Current aids</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Model</span>
                <span>Battery/Notes</span>
                <span>Purchase date</span>
                <span>Status</span>
              </div>
              {aidRows.map((row) => (
                <div
                  key={row.model}
                  className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3 border-t border-surface-2 px-4 py-3 text-sm"
                >
                  <span className="text-ink-strong">{row.model}</span>
                  <span className="text-ink-muted">{row.notes}</span>
                  <span className="text-ink-muted">{row.purchase}</span>
                  <span className="text-ink-muted">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
