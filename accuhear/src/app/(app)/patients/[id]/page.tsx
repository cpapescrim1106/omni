import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { computePatientBalance } from "@/lib/commerce";
import { getPatientById } from "@/lib/patient-data";
import { Button } from "@/components/ui/button";
import { PatientJournal } from "@/components/patient-journal";
import { PatientMessaging } from "@/components/patient-messaging";
import { PatientDocuments } from "@/components/patient-documents";
import { PatientSales } from "@/components/patient-sales";
import { PatientAudiology } from "@/components/patient-audiology";
import { PatientDeviceRegistry } from "@/components/patient-device-registry";
import { PatientPayers } from "@/components/patient-payers";
import { PatientMarketing } from "@/components/patient-marketing";
import { PatientSummaryForm } from "@/components/patient-summary-form";
import { PatientTabRegistrar } from "@/components/patient-tabs";
import { PurchaseButton } from "@/components/purchase-dialog";
import { PatientPhotoAvatar } from "@/components/patient-photo-avatar";

const tabs = [
  "Summary",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

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
  const normalizedActiveTab = activeTab === "Ordered/delivered items" ? "Sales history" : activeTab;
  const purchaseMode = resolvedSearchParams?.purchase ?? "";
  const patientLabel = `${patient.lastName}, ${patient.firstName}${patient.preferredName ? ` (${patient.preferredName})` : ""}`;

  const age = patient.dateOfBirth ? dayjs().diff(dayjs(patient.dateOfBirth), "year") : null;
  const patientBalance = computePatientBalance(patient.sales);
  const primaryPayer = patient.payerPolicies
    ?.slice()
    .sort((a, b) => {
      const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.payerName.localeCompare(b.payerName);
    })?.[0]?.payerName;
  const phoneButtons = patient.phones.length
    ? patient.phones.slice(0, 3).map((phone) => ({
        label: phone.type || "Phone",
        number: phone.number || phone.normalized,
      }))
    : [
        { label: "Home", number: "(202) 555-0100" },
        { label: "Mobile", number: "(202) 555-0101" },
      ];

  const deviceRecords = patient.devices.map((d) => ({
    id: d.id,
    ear: d.ear,
    manufacturer: d.manufacturer,
    model: d.model,
    serial: d.serial,
    warrantyEnd: d.warrantyEnd?.toISOString() ?? null,
    lossDamageWarrantyEnd: d.lossDamageWarrantyEnd?.toISOString() ?? null,
    status: d.status || "Current",
    purchaseDate: d.purchaseDate?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  const inOrderItems = (patient.purchaseOrders ?? []).flatMap((order) =>
    order.lineItems
      .filter((item) => item.status === "ordered" || item.status === "received")
      .map((item) => ({
        orderId: order.id,
        lineItemId: item.id,
        itemName: item.itemName,
        side: item.side,
        status: item.status,
        orderedAt: order.createdAt.toISOString(),
        serialNumber: item.serialNumber ?? null,
        manufacturerWarrantyEnd: item.manufacturerWarrantyEnd?.toISOString() ?? null,
        lossDamageWarrantyEnd: item.lossDamageWarrantyEnd?.toISOString() ?? null,
        color: item.color ?? null,
        battery: item.battery ?? null,
        notes: item.notes ?? null,
        requiresManufacturerOrder: item.requiresManufacturerOrder,
      }))
  );

  return (
    <div className="flex flex-col gap-2">
      <PatientTabRegistrar id={patient.id} label={patientLabel} status={patient.status} />
      <section className="patient-header">
        {/* Row 1: avatar + name/meta + badges + stats */}
        <div className="patient-header-row">
          <PatientPhotoAvatar
            patientId={patient.id}
            firstName={patient.firstName}
            initialPhotoDataUrl={patient.photoDataUrl ?? null}
          />

          <div className="patient-header-identity">
            <span className="patient-header-name">
              {patient.lastName}, {patient.firstName}
            </span>
            <span className="patient-header-meta">
              {patient.dateOfBirth ? dayjs(patient.dateOfBirth).format("MM/DD/YYYY") : "—"}
              {age ? <><span className="patient-header-sep">|</span>{age}</> : ""}
              {primaryPayer ? <><span className="patient-header-sep">|</span>{primaryPayer}</> : ""}
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
            <span className="patient-header-stat">
              <span className="patient-header-stat-label">Bal</span>
              <span
                className={
                  patientBalance > 0
                    ? "patient-header-stat-value patient-header-stat-value-danger"
                    : "patient-header-stat-value"
                }
              >
                {formatCurrency(patientBalance)}
              </span>
            </span>
          </div>
        </div>

        {/* Row 2: seg-tabs flush below */}
        <div className="seg-tabs" style={{ padding: "4px 12px 0" }}>
          <div className="seg-tabs-inner">
            {tabs.map((tab) => (
              <Link
                key={tab}
                href={`/patients/${patient.id}?tab=${encodeURIComponent(tab)}`}
                className={`seg-tab${normalizedActiveTab === tab ? " active" : ""}`}
              >
                {tab}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {normalizedActiveTab === "Audiology" ? (
        <PatientAudiology patientId={patient.id} />
      ) : normalizedActiveTab === "Journal" ? (
        <PatientJournal patientId={patient.id} />
      ) : normalizedActiveTab === "Insurance/Payers" || normalizedActiveTab === "3rd party payers" ? (
        <PatientPayers patientId={patient.id} />
      ) : normalizedActiveTab === "Messaging" ? (
        <PatientMessaging patientId={patient.id} />
      ) : normalizedActiveTab === "Sales history" ? (
        <PatientSales patientId={patient.id} autoOpenCreate={purchaseMode === "direct" || purchaseMode === "tracked"} />
      ) : normalizedActiveTab === "Documents" ? (
        <PatientDocuments
          patientId={patient.id}
          patientEmail={patient.email}
          patientPhones={patient.phones}
        />
      ) : normalizedActiveTab === "Marketing" ? (
        <PatientMarketing />
      ) : (
        <div className="content-area">
          {/* Record Panel (60%) */}
          <section className="record-panel">
            <PatientSummaryForm
              patient={{
                ...patient,
                dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
              }}
            />
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

            {/* Device Registry */}
            <div className="ctx-card">
              <PatientDeviceRegistry
                patientId={patient.id}
                devices={deviceRecords}
                inOrderItems={inOrderItems}
              />
            </div>

            {/* Recent Notes */}
            <div className="ctx-card">
              <div className="ctx-card-title">
                <span>Recent Notes</span>
                <Button variant="ghost" size="sm" className="btn-sm-ghost">
                  + Note
                </Button>
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
