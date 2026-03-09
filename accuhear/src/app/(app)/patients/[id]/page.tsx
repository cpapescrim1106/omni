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
import { PurchaseButton } from "@/components/purchase-dialog";

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

const PLACEHOLDER_ADDRESS = "123 Example St, Washington, DC 20001";

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
  searchParams?: { tab?: string; purchase?: string } | Promise<{ tab?: string; purchase?: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams =
    searchParams && searchParams instanceof Promise ? await searchParams : searchParams;
  const patient = await getPatientById(resolvedParams.id);
  if (!patient) notFound();
  const activeTab = resolvedSearchParams?.tab ?? "Summary";
  const purchaseMode = resolvedSearchParams?.purchase ?? "";
  const patientLabel = `${patient.lastName}, ${patient.firstName}${patient.preferredName ? ` (${patient.preferredName})` : ""}`;

  const age = patient.dateOfBirth ? dayjs().diff(dayjs(patient.dateOfBirth), "year") : null;
  const phoneButtons = patient.phones.length
    ? patient.phones.slice(0, 3).map((phone) => ({
        label: phone.type || "Phone",
        number: phone.number || phone.normalized,
      }))
    : [
        { label: "Home", number: "(202) 555-0100" },
        { label: "Mobile", number: "(202) 555-0101" },
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
      <section className="card p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex items-start gap-4">
            {/* Avatar: 36px circle, brand gradient, Space Grotesk bold */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, var(--brand-blue), var(--brand-ink))",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {patient.firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* Patient name: Space Grotesk 700 16px ink-strong */}
                <div
                  className="truncate"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--ink-strong)",
                  }}
                >
                  {patient.lastName}, {patient.firstName}
                </div>
                <PurchaseButton patientId={patient.id} />
              </div>
              {/* Info row: 12px ink-muted */}
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                {patient.dateOfBirth
                  ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY")
                  : "—"}{" "}
                {age ? (
                  <>
                    <span style={{ color: "var(--ink-soft)", margin: "0 4px" }}>|</span>
                    {age}
                  </>
                ) : ""}
              </div>
              {/* Phone badges */}
              <div className="mt-2 flex flex-wrap gap-2">
                {phoneButtons.slice(0, 2).map((phone) => (
                  <span
                    key={`${phone.label}-${phone.number}`}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(30,155,108,0.1)",
                      color: "var(--success)",
                    }}
                  >
                    {phone.number}
                  </span>
                ))}
              </div>

              {/* Provider / location badges */}
              {patient.providerName || patient.location ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {patient.providerName ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(31,149,184,0.1)",
                        color: "var(--brand-blue)",
                      }}
                    >
                      {patient.providerName}
                    </span>
                  ) : null}
                  {patient.location ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(31,149,184,0.1)",
                        color: "var(--brand-blue)",
                      }}
                    >
                      {patient.location}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Stats row: compact horizontal flex, no per-stat card */}
          <div className="flex items-center gap-0 self-center">
            {[
              { label: "Balance", value: "$0.00" },
              { label: "Reimb.", value: "$0.00" },
              { label: "Punctuality", value: "1m early" },
              { label: "No-shows", value: "0%" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {i > 0 && (
                  <div
                    className="mx-3 h-6 w-px"
                    style={{ background: "var(--surface-3)" }}
                  />
                )}
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{stat.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)" }}>{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmented tab control */}
        <div className="seg-tabs mt-4">
          <div className="seg-tabs-inner">
            {tabs.map((tab) => (
              <Link
                key={tab}
                href={`/patients/${patient.id}?tab=${encodeURIComponent(tab)}`}
                className={`seg-tab${activeTab === tab ? " active" : ""}`}
              >
                {tab}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {activeTab === "Audiology" ? (
        <PatientAudiology patientId={patient.id} />
      ) : activeTab === "Devices" || activeTab === "Hearing aids" ? (
        <PatientDevices patientId={patient.id} autoOpenCreate={purchaseMode === "tracked"} />
      ) : activeTab === "Journal" ? (
        <PatientJournal patientId={patient.id} />
      ) : activeTab === "Insurance/Payers" || activeTab === "3rd party payers" ? (
        <PatientPayers patientId={patient.id} />
      ) : activeTab === "Messaging" ? (
        <PatientMessaging patientId={patient.id} />
      ) : activeTab === "Sales history" ? (
        <PatientSales patientId={patient.id} autoOpenCreate={purchaseMode === "direct"} />
      ) : activeTab === "Documents" ? (
        <PatientDocuments patientId={patient.id} />
      ) : activeTab === "Details" ? (
        <PatientDetails patient={patient} />
      ) : activeTab === "Marketing" ? (
        <PatientMarketing />
      ) : (
        <div className="grid gap-6">
          <section className="card p-4">
            <div className="section-title">Patient context</div>
            <div className="mt-3 grid gap-2 text-sm text-ink">
              <div>{PLACEHOLDER_ADDRESS}</div>
              <div>
                Preferred Name: {patient.preferredName || "—"} · extended warranty exp 1/15/27
              </div>
              <div className="flex flex-wrap gap-2">
                {(payerTags.length ? payerTags : ["Medicare"]).map((payer) => (
                  <span
                    key={payer}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(31,149,184,0.1)",
                      color: "var(--brand-blue)",
                    }}
                  >
                    {payer}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="card p-6">
            <div className="section-title">Appointments</div>
            {/* Appointments table */}
            <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Appointment date</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Appointment type</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Provider</span>
              </div>
              {APPOINTMENTS.map((appointment, i) => (
                <div
                  key={appointment.date}
                  className={`grid grid-cols-[1.5fr_1fr_1fr] border-t border-[var(--surface-1)] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}
                >
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{appointment.date}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-strong">{appointment.type}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{appointment.provider}</span>
                </div>
              ))}
            </div>

            {/* Last audiogram table */}
            <div className="mt-6 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
              <div className="px-3 py-[6px] text-[10px] font-semibold text-ink-muted bg-[var(--surface-1)]">
                Last audiogram 01/07/2026
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]"></span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Severity</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Type</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Shape</span>
              </div>
              {LAST_AUDIOGRAM.map((row, i) => (
                <div
                  key={row.ear}
                  className={`grid grid-cols-[120px_1fr_1fr_1fr] border-t border-[var(--surface-1)] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}
                >
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.ear}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-strong">{row.severity}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.type}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.shape}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="section-title">Current aids</div>
            {/* Current aids table */}
            <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Model</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Battery/Notes</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Purchase date</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft bg-[var(--surface-1)] px-3 py-[6px]">Status</span>
              </div>
              {aidRows.map((row, i) => (
                <div
                  key={row.model}
                  className={`grid grid-cols-[1.4fr_1fr_1fr_0.8fr] border-t border-[var(--surface-1)] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}
                >
                  <span className="text-[12px] px-3 py-[7px] text-ink-strong">{row.model}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.notes}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.purchase}</span>
                  <span className="text-[12px] px-3 py-[7px] text-ink-muted">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
          </section>
        </div>
      )}
    </div>
  );
}
