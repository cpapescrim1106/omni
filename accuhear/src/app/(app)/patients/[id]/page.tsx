import { Fragment } from "react";
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
    <div className="flex flex-col gap-2">
      <PatientTabRegistrar id={patient.id} label={patientLabel} status={patient.status} />
      <section className="patient-header">
        {/* Row 1: avatar + name/meta + badges + stats */}
        <div className="patient-header-row">
          <div
            className="patient-header-avatar"
            style={{ background: "linear-gradient(135deg, var(--brand-blue), var(--brand-ink))" }}
          >
            {patient.firstName.charAt(0)}
          </div>

          <div className="patient-header-identity">
            <span className="patient-header-name">
              {patient.lastName}, {patient.firstName}
            </span>
            <span className="patient-header-meta">
              {patient.dateOfBirth ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY") : "—"}
              {age ? <><span className="patient-header-sep">|</span>{age}</> : ""}
            </span>
          </div>

          <div className="patient-header-badges">
            {phoneButtons.slice(0, 2).map((phone) => (
              <span key={`${phone.label}-${phone.number}`} className="patient-header-badge badge-success">
                {phone.number}
              </span>
            ))}
            {patient.providerName ? (
              <span className="patient-header-badge badge-blue">{patient.providerName}</span>
            ) : null}
            {patient.location ? (
              <span className="patient-header-badge badge-blue">{patient.location}</span>
            ) : null}
            <PurchaseButton patientId={patient.id} />
          </div>

          <div className="patient-header-stats">
            {[
              { label: "Bal", value: "$0.00" },
              { label: "Reimb", value: "$0.00" },
              { label: "Punct", value: "1m early" },
              { label: "No-show", value: "0%" },
            ].map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && <span className="patient-header-stat-sep" />}
                <span className="patient-header-stat">
                  <span className="patient-header-stat-label">{stat.label}</span>
                  <span className="patient-header-stat-value">{stat.value}</span>
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        {/* Row 2: seg-tabs flush below */}
        <div className="seg-tabs" style={{ padding: "4px 12px 0" }}>
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
        <div className="content-area">
          {/* Record Panel (60%) */}
          <section className="record-panel">
            <div className="tab-content">
              {/* Personal Information */}
              <div className="section-title">Personal Information</div>
              <div className="form-grid">
                <div className="form-field">
                  <span className="form-label">First Name</span>
                  <span className="form-value">{patient.firstName}</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Last Name</span>
                  <span className="form-value">{patient.lastName}</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Preferred Name</span>
                  <span className="form-value">{patient.preferredName || "—"}</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Date of Birth</span>
                  <span className="form-value">
                    {patient.dateOfBirth ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY") : "—"}
                  </span>
                </div>
                <div className="form-field">
                  <span className="form-label">Gender</span>
                  <span className="form-value">—</span>
                </div>
                <div className="form-field">
                  <span className="form-label">SS#</span>
                  <span className="form-value">—</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Patient ID</span>
                  <span className="form-value">{patient.legacyId || patient.id.slice(0, 8)}</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Reference #</span>
                  <span className="form-value">—</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Status</span>
                  <span className="form-value">{patient.status || "Active"}</span>
                </div>
                <div className="form-field">
                  <span className="form-label">Provider</span>
                  <span className="form-value">{patient.providerName || "—"}</span>
                </div>
              </div>

              {/* Contact */}
              <div className="section-title">Contact</div>
              <div className="form-grid">
                {patient.phones.length > 0 ? (
                  patient.phones.map((phone, i) => (
                    <div className="form-field" key={phone.id || i}>
                      <span className="form-label">{phone.type || "Phone"}</span>
                      <span className="form-value">{phone.number || phone.normalized}</span>
                    </div>
                  ))
                ) : (
                  <div className="form-field">
                    <span className="form-label">Phone</span>
                    <span className="form-value">—</span>
                  </div>
                )}
                <div className="form-field">
                  <span className="form-label">Email</span>
                  <span className="form-value">{patient.email || "—"}</span>
                </div>
                <div className="form-field span-2">
                  <span className="form-label">Address</span>
                  <span className="form-value">{PLACEHOLDER_ADDRESS}</span>
                </div>
              </div>

              {/* Insurance / Payers */}
              <div className="section-title">Insurance / Payers</div>
              {patient.payerPolicies.length > 0 ? (
                <div className="form-grid">
                  {patient.payerPolicies.map((policy, i) => (
                    <Fragment key={policy.id || i}>
                      <div className="form-field">
                        <span className="form-label">Payer</span>
                        <span className="form-value">{policy.payerName}</span>
                      </div>
                      <div className="form-field">
                        <span className="form-label">Member ID</span>
                        <span className="form-value">{policy.memberId || "—"}</span>
                      </div>
                      <div className="form-field">
                        <span className="form-label">Group ID</span>
                        <span className="form-value">{policy.groupId || "—"}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-field">
                    <span className="form-label">Payer</span>
                    <span className="form-value">—</span>
                  </div>
                </div>
              )}

              {/* Clinical */}
              <div className="section-title">Clinical</div>
              <div className="form-grid">
                {aidRows.map((aid, i) => (
                  <div className="form-field" key={i}>
                    <span className="form-label">Current Aid {aidRows.length > 1 ? i + 1 : ""}</span>
                    <span className="form-value">{aid.model}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Context Panel (40%) */}
          <aside className="context-panel">
            {/* Upcoming Appointments */}
            <div className="ctx-card">
              <div className="ctx-card-title">
                <span>Upcoming Appointments</span>
                <span className="ctx-card-count">
                  {patient.appointments.length} upcoming
                </span>
              </div>
              {patient.appointments.length > 0 ? (
                patient.appointments.map((appt) => (
                  <div className="appt-item" key={appt.id}>
                    <div className="appt-time">
                      {dayjs(appt.startTime).format("MM/DD")}
                    </div>
                    <div className="appt-detail">
                      <div className="appt-type">{appt.typeId || "Appointment"}</div>
                      <div className="appt-meta">
                        {dayjs(appt.startTime).format("h:mm A")}
                        {appt.endTime ? ` – ${dayjs(appt.endTime).format("h:mm A")}` : ""}
                        {appt.providerName ? ` · ${appt.providerName}` : ""}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-text">No upcoming appointments</div>
              )}
            </div>

            {/* Current Aids */}
            <div className="ctx-card">
              <div className="ctx-card-title">
                <span>Current Aids</span>
                <span className="ctx-card-count">
                  {aidRows.length} device{aidRows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {aidRows.map((row, i) => (
                    <tr key={i}>
                      <td className="mini-table-strong">{row.model}</td>
                      <td>{row.status}</td>
                      <td>{row.purchase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent Notes */}
            <div className="ctx-card">
              <div className="ctx-card-title">
                <span>Recent Notes</span>
                <button className="btn-sm-ghost">+ Note</button>
              </div>
              {patient.journalEntries.length > 0 ? (
                patient.journalEntries.map((entry) => (
                  <div className="note-item" key={entry.id}>
                    <div className="note-item-header">
                      <span>{entry.type || "Note"}</span>
                      <span className="note-item-date">
                        {dayjs(entry.createdAt).format("MM/DD/YYYY")}
                      </span>
                    </div>
                    <div className="note-item-body">{entry.content || "—"}</div>
                  </div>
                ))
              ) : (
                <div className="empty-text">No recent notes</div>
              )}
            </div>

            {/* Recalls & Reminders */}
            <div className="ctx-card">
              <div className="ctx-card-title">
                <span>Recalls &amp; Reminders</span>
              </div>
              <div className="appt-item">
                <div className="appt-time">Due</div>
                <div className="appt-detail">
                  <div className="appt-type">Annual Audiogram</div>
                  <div className="appt-meta">Next evaluation due for annual checkup</div>
                </div>
              </div>
              <div className="appt-item">
                <div className="appt-time">Check</div>
                <div className="appt-detail">
                  <div className="appt-type">Warranty Expiration</div>
                  <div className="appt-meta">Review device warranty status</div>
                </div>
              </div>
              <div className="appt-item">
                <div className="appt-time">Verify</div>
                <div className="appt-detail">
                  <div className="appt-type">Insurance Verification</div>
                  <div className="appt-meta">Confirm coverage for upcoming services</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
