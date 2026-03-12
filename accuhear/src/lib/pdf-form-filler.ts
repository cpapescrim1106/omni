import { PDFDocument } from "pdf-lib";

import {
  FORM_FIELD_MAPPINGS,
  type FormFieldMapping,
} from "./pdf-form-mappings";

export type PrefillData = {
  clinic: {
    clinicName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    contactName: string;
  };
  accountNumber: string | null;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
  };
  audiogram: {
    right: Record<number, number>; // frequencyHz → decibel
    left: Record<number, number>;
  };
  provider?: string | null;
  orderId?: string | null;
};

export async function fillOrderForm(
  pdfBytes: Buffer | Uint8Array,
  formPath: string,
  data: PrefillData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const mapping = FORM_FIELD_MAPPINGS[formPath];
  if (!mapping) return pdfDoc.save();

  const tf = mapping.textFields;

  // Helper: safely set text field
  const setText = (fieldName: string | undefined, value: string) => {
    if (!fieldName || !value) return;
    try {
      form.getTextField(fieldName).setText(value);
    } catch {
      // Field not found in this PDF — skip silently
    }
  };

  // Helper: safely check checkbox
  const checkBox = (fieldName: string) => {
    try {
      form.getCheckBox(fieldName).check();
    } catch {
      // Field not found — skip silently
    }
  };

  // 1. Clinic info
  setText(tf.clinicName, data.clinic.clinicName);
  setText(tf.clinicAddress, data.clinic.address);
  setText(tf.clinicCity, data.clinic.city);
  setText(tf.clinicState, data.clinic.state);
  setText(tf.clinicZip, data.clinic.zip);
  setText(tf.clinicPhone, data.clinic.phone);
  setText(tf.clinicEmail, data.clinic.email);
  setText(tf.provider, data.clinic.contactName || data.provider || "");

  // Starkey multiline address blocks
  if (tf.clinicAddressBlock) {
    const block = [
      data.clinic.address,
      `${data.clinic.city}, ${data.clinic.state} ${data.clinic.zip}`,
    ]
      .filter(Boolean)
      .join("\n");
    setText(tf.clinicAddressBlock, block);
  }
  if (tf.billToAddressBlock) {
    const block = [
      data.clinic.address,
      `${data.clinic.city}, ${data.clinic.state} ${data.clinic.zip}`,
    ]
      .filter(Boolean)
      .join("\n");
    setText(tf.billToAddressBlock, block);
  }

  // 2. Account number
  setText(tf.billingAccountNumber, data.accountNumber ?? "");
  setText(tf.shippingAccountNumber, data.accountNumber ?? "");

  // 3. Patient info
  if (tf.patientFullName) {
    setText(
      tf.patientFullName,
      `${data.patient.firstName} ${data.patient.lastName}`.trim()
    );
  } else {
    setText(tf.patientFirstName, data.patient.firstName);
    setText(tf.patientLastName, data.patient.lastName);
  }

  if (data.patient.dateOfBirth) {
    if (tf.patientDob) {
      setText(
        tf.patientDob,
        data.patient.dateOfBirth.toLocaleDateString("en-US")
      );
    }
    if (tf.patientAge) {
      const age = Math.floor(
        (Date.now() - data.patient.dateOfBirth.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      );
      setText(tf.patientAge, String(age));
    }
  }

  // 4. Date and order info
  const today = new Date().toLocaleDateString("en-US");
  setText(tf.todaysDate, today);
  setText(tf.orderDate, today);
  setText(tf.orderId, data.orderId ?? "");

  // Provider (if not already set via clinic contactName)
  if (data.provider && tf.provider) {
    setText(tf.provider, data.provider);
  }

  // 5. Audiogram
  const freqMap: Record<
    number,
    { right: string | undefined; left: string | undefined }
  > = {
    250: { right: tf.acRight250, left: tf.acLeft250 },
    500: { right: tf.acRight500, left: tf.acLeft500 },
    1000: { right: tf.acRight1000, left: tf.acLeft1000 },
    2000: { right: tf.acRight2000, left: tf.acLeft2000 },
    3000: { right: tf.acRight3000, left: tf.acLeft3000 },
    4000: { right: tf.acRight4000, left: tf.acLeft4000 },
    6000: { right: tf.acRight6000, left: tf.acLeft6000 },
    8000: { right: tf.acRight8000, left: tf.acLeft8000 },
  };

  for (const [freq, fields] of Object.entries(freqMap)) {
    const hz = Number(freq);
    if (data.audiogram.right[hz] !== undefined) {
      setText(fields.right, String(data.audiogram.right[hz]));
    }
    if (data.audiogram.left[hz] !== undefined) {
      setText(fields.left, String(data.audiogram.left[hz]));
    }
  }

  // 6. Earmold defaults (check bilateral checkboxes)
  if (mapping.defaultEarmoldCheckboxes) {
    for (const cb of mapping.defaultEarmoldCheckboxes) {
      checkBox(cb);
    }
  }

  // 7. Radio group defaults
  if (mapping.defaultRadioSelections) {
    for (const { fieldName, optionValue } of mapping.defaultRadioSelections) {
      try {
        form.getRadioGroup(fieldName).select(optionValue);
      } catch {
        // Field not found or not a radio group — skip silently
      }
    }
  }

  // DO NOT flatten — fields stay editable
  return pdfDoc.save();
}
