"use client";

import { Fragment, useState } from "react";

type Phone = { id: string; type: string; number: string; normalized: string };
type PayerPolicy = { id: string; payerName: string; memberId: string | null; groupId: string | null };

type PatientSummaryFormProps = {
  patient: {
    id: string;
    legacyId: string | null;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
    dateOfBirth?: string | null;
    email?: string | null;
    status?: string | null;
    providerName?: string | null;
    location?: string | null;
    phones: Phone[];
    payerPolicies: PayerPolicy[];
  };
  aidModels: string[];
};

const PLACEHOLDER_ADDRESS = {
  streetNumber: "2387",
  street: "Example St",
  aptUnit: "",
  city: "Washington",
  state: "DC",
  zip: "20001",
  country: "USA",
};

function formatDob(dob: string | null | undefined): string {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function computeAge(dob: string | null | undefined): string {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export function PatientSummaryForm({ patient, aidModels }: PatientSummaryFormProps) {
  const [editing, setEditing] = useState(false);

  const initialFields = () => ({
    firstName: patient.firstName,
    lastName: patient.lastName,
    preferredName: patient.preferredName || "",
    title: "",
    gender: "",
    dob: formatDob(patient.dateOfBirth),
    age: computeAge(patient.dateOfBirth),
    status: patient.status || "Active",
    provider: patient.providerName || "",
    streetNumber: PLACEHOLDER_ADDRESS.streetNumber,
    street: PLACEHOLDER_ADDRESS.street,
    aptUnit: PLACEHOLDER_ADDRESS.aptUnit,
    city: PLACEHOLDER_ADDRESS.city,
    state: PLACEHOLDER_ADDRESS.state,
    zip: PLACEHOLDER_ADDRESS.zip,
    country: PLACEHOLDER_ADDRESS.country,
    email: patient.email || "",
    doNotMail: false,
    doNotEmail: false,
    doNotText: false,
    doNotSendCommercial: false,
  });

  const initialPhones = () =>
    patient.phones.length > 0
      ? patient.phones.map((p, i) => ({ type: p.type || "Phone", number: p.number || p.normalized, altName: "", altRelation: "", primary: i === 0 }))
      : [
          { type: "Home", number: "(202) 555-0100", altName: "", altRelation: "", primary: true },
          { type: "Work", number: "", altName: "", altRelation: "", primary: false },
          { type: "Mobile", number: "(202) 555-0101", altName: "", altRelation: "", primary: false },
        ];

  const [fields, setFields] = useState(initialFields);
  const [phones, setPhones] = useState(initialPhones);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: keyof typeof fields, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const updatePhone = (index: number, key: "type" | "number" | "altName" | "altRelation", value: string) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const setPrimaryPhone = (index: number) => {
    setPhones((prev) => {
      const updated = prev.map((p, i) => ({ ...p, primary: i === index }));
      return [updated[index], ...updated.filter((_, i) => i !== index)];
    });
  };

  const removePhone = (index: number) => {
    setPhones((prev) => {
      if (prev.length <= 1) return prev;
      const removed = prev.filter((_, i) => i !== index);
      if (!removed.some((p) => p.primary)) removed[0].primary = true;
      return removed;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fields.firstName.trim()) errs.firstName = "Required";
    if (!fields.lastName.trim()) errs.lastName = "Required";
    if (fields.dob && !/^\d{2}\/\d{2}\/\d{4}$/.test(fields.dob)) errs.dob = "MM/DD/YYYY";
    if (fields.email && !/.+@.+\..+/.test(fields.email)) errs.email = "Invalid email";
    if (fields.zip && !/^\d{5}(-\d{4})?$/.test(fields.zip)) errs.zip = "5-digit zip";
    phones.forEach((phone, i) => {
      if (phone.number) {
        const digits = phone.number.replace(/\D/g, "");
        if (digits.length < 10) errs[`phone_${i}`] = "10 digits min";
      }
    });
    return errs;
  };

  const handleCancel = () => {
    setFields(initialFields);
    setPhones(initialPhones);
    setErrors({});
    setEditing(false);
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    // TODO: persist changes via server action
    setEditing(false);
  };

  return (
    <form id="patient-data-search-form" role="search" autoComplete="off" onSubmit={(e) => e.preventDefault()} className="tab-content">
      {/* Personal Information */}
      <div className="section-title">
        Personal Information
        <span className="section-title-actions">
          {editing ? (
            <>
              <button type="button" className="btn-sm-ghost" onClick={handleCancel}><XIcon /> Cancel</button>
              <button type="button" className="btn-sm-primary" onClick={handleSave}><CheckIcon /> Save</button>
            </>
          ) : (
            <button type="button" className="btn-sm-ghost" onClick={() => setEditing(true)}><PencilIcon /></button>
          )}
        </span>
      </div>
      <div className="form-grid-dense">
        <Field label="Title" value={fields.title} editing={editing} onChange={(v) => updateField("title", v)} />
        <Field label="Gender" value={fields.gender} editing={editing} onChange={(v) => updateField("gender", v)} />
        <Field label="First Name" value={fields.firstName} editing={editing} error={errors.firstName} onChange={(v) => updateField("firstName", v)} />
        <Field label="Preferred" value={fields.preferredName} editing={editing} onChange={(v) => updateField("preferredName", v)} />
        <Field label="Last Name" value={fields.lastName} editing={editing} error={errors.lastName} onChange={(v) => updateField("lastName", v)} />
        <Field label="DOB" value={fields.dob} editing={editing} error={errors.dob} onChange={(v) => updateField("dob", v)} />
        <Field label="Age" value={fields.age} />
        <Field label="Status" value={fields.status} editing={editing} onChange={(v) => updateField("status", v)} />
      </div>

      {/* Address */}
      <div className="section-title">Address</div>
      <div className="form-grid-address">
        <Field label="St #" value={fields.streetNumber} editing={editing} onChange={(v) => updateField("streetNumber", v)} />
        <Field label="Street" value={fields.street} editing={editing} onChange={(v) => updateField("street", v)} />
        <Field label="Apt" value={fields.aptUnit} editing={editing} onChange={(v) => updateField("aptUnit", v)} />
        <Field label="City" value={fields.city} editing={editing} onChange={(v) => updateField("city", v)} />
        <Field label="State" value={fields.state} editing={editing} onChange={(v) => updateField("state", v)} />
        <Field label="Zip" value={fields.zip} editing={editing} error={errors.zip} onChange={(v) => updateField("zip", v)} />
        <Field label="Country" value={fields.country} editing={editing} onChange={(v) => updateField("country", v)} />
      </div>
      <div className="form-prefs">
        <label className="form-pref-check">
          <input type="checkbox" disabled={!editing} checked={fields.doNotMail} onChange={(e) => updateField("doNotMail", e.target.checked)} />
          Do not mail
        </label>
        <label className="form-pref-check">
          <input type="checkbox" disabled={!editing} checked={fields.doNotEmail} onChange={(e) => updateField("doNotEmail", e.target.checked)} />
          Do not email
        </label>
        <label className="form-pref-check">
          <input type="checkbox" disabled={!editing} checked={fields.doNotText} onChange={(e) => updateField("doNotText", e.target.checked)} />
          Do not text
        </label>
      </div>

      {/* Contact */}
      <div className="section-title">Contact</div>
      <div className="phone-grid">
        {phones.map((phone, i) => (
          <Fragment key={i}>
            <div className="phone-row">
              <div className="form-field">
                {i === 0 && <span className="form-label">Type</span>}
                {editing ? (
                  <select
                    className="form-input"
                    value={phone.type}
                    onChange={(e) => updatePhone(i, "type", e.target.value)}
                  >
                    <option value="Mobile">Mobile</option>
                    <option value="Home">Home</option>
                    <option value="Alternate">Alternate</option>
                  </select>
                ) : (
                  <span className="form-value">{phone.type || "—"}</span>
                )}
              </div>
              <Field label={i === 0 ? "Number" : ""} value={phone.number} editing={editing} error={errors[`phone_${i}`]} onChange={(v) => updatePhone(i, "number", v)} />
              <Field label={i === 0 ? "Email" : ""} value={i === 0 ? fields.email : ""} editing={i === 0 ? editing : false} error={i === 0 ? errors.email : undefined} onChange={i === 0 ? (v) => updateField("email", v) : undefined} />
              {editing && (
                <div className="phone-actions">
                  <button
                    type="button"
                    className={`phone-action-btn${phone.primary ? " active" : ""}`}
                    title={phone.primary ? "Primary" : "Set as primary"}
                    onClick={() => setPrimaryPhone(i)}
                  >
                    <StarIcon filled={phone.primary} />
                  </button>
                  {!phone.primary && phones.length > 1 && (
                    <button
                      type="button"
                      className="phone-action-btn danger"
                      title="Remove"
                      onClick={() => removePhone(i)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              )}
            </div>
            {phone.type === "Alternate" && (
              <div className="phone-row phone-row-alt">
                <span />
                <Field label="Contact Name" value={phone.altName} editing={editing} onChange={(v) => updatePhone(i, "altName", v)} />
                <Field label="Relation" value={phone.altRelation} editing={editing} onChange={(v) => updatePhone(i, "altRelation", v)} />
              </div>
            )}
          </Fragment>
        ))}
        {editing && (
          <button
            type="button"
            className="btn-sm-ghost"
            onClick={() => setPhones((prev) => [...prev, { type: "Mobile", number: "", altName: "", altRelation: "", primary: false }])}
          >
            + Phone
          </button>
        )}
      </div>
      <div className="form-prefs">
        <label className="form-pref-check">
          <input type="checkbox" disabled={!editing} checked={fields.doNotSendCommercial} onChange={(e) => updateField("doNotSendCommercial", e.target.checked)} />
          Do not send commercial messages
        </label>
      </div>

      {/* Insurance / Payers */}
      <div className="section-title">Insurance / Payers</div>
      {patient.payerPolicies.length > 0 ? (
        <div className="form-grid">
          {patient.payerPolicies.map((policy, i) => (
            <Fragment key={policy.id || i}>
              <Field label="Payer" value={policy.payerName} />
              <Field label="Member ID" value={policy.memberId || "—"} />
              <Field label="Group ID" value={policy.groupId || "—"} />
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="form-grid">
          <Field label="Payer" value="—" />
        </div>
      )}

      {/* Clinical */}
      <div className="section-title">Clinical</div>
      <div className="form-grid">
        {aidModels.map((model, i) => (
          <Field key={i} label={`Current Aid${aidModels.length > 1 ? ` ${i + 1}` : ""}`} value={model} />
        ))}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  editing,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  editing?: boolean;
  error?: string;
  type?: string;
}) {
  const editable = editing && !!onChange;
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      {editable ? (
        <>
          <input
            className={`form-input${error ? " form-input-error" : ""}`}
            type={type}
            name={`_xf${Array.from(label).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(36)}`}
            value={value}
            placeholder="—"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore
            onChange={(e) => onChange?.(e.target.value)}
          />
          {error && <span className="form-error">{error}</span>}
        </>
      ) : (
        <span className="form-value">{value || "—"}</span>
      )}
    </div>
  );
}
