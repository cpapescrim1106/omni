export type FormFieldMapping = {
  textFields: {
    clinicName?: string;
    clinicAddress?: string;
    clinicCity?: string;
    clinicState?: string;
    clinicZip?: string;
    clinicPhone?: string;
    clinicEmail?: string;
    billingAccountNumber?: string;
    shippingAccountNumber?: string;
    patientFirstName?: string;
    patientLastName?: string;
    patientFullName?: string;
    patientDob?: string;
    patientAge?: string;
    provider?: string;
    todaysDate?: string;
    orderDate?: string;
    orderId?: string;
    // Audiogram - AC
    acRight250?: string;
    acRight500?: string;
    acRight1000?: string;
    acRight2000?: string;
    acRight3000?: string;
    acRight4000?: string;
    acRight6000?: string;
    acRight8000?: string;
    acLeft250?: string;
    acLeft500?: string;
    acLeft1000?: string;
    acLeft2000?: string;
    acLeft3000?: string;
    acLeft4000?: string;
    acLeft6000?: string;
    acLeft8000?: string;
    // Clinic address multiline (Starkey)
    clinicAddressBlock?: string;
    billToAddressBlock?: string;
  };
  // Checkboxes to check for earmold defaults (bilateral)
  defaultEarmoldCheckboxes?: string[];
  // Radio groups for order type
  defaultRadioSelections?: Array<{ fieldName: string; optionValue: string }>;
};

// ---------------------------------------------------------------------------
// Oticon forms
// ---------------------------------------------------------------------------

const OTICON_COMMON_TEXT = {
  clinicName: "clinicName",
  clinicAddress: "clinicStreetLine",
  clinicCity: "clinicCity",
  clinicState: "clinicProvince",
  clinicZip: "clinicPostalCode",
  clinicPhone: "clinicPhoneNumber",
  clinicEmail: "clinicEmailAddress",
  billingAccountNumber: "clinicBillingAccountNumber",
  shippingAccountNumber: "clinicShippingAccountNumber",
  patientFirstName: "patientGivenName",
  patientLastName: "patientSurname",
  patientAge: "patientAge",
  provider: "provider",
  todaysDate: "todaysDate",
  acRight250: "ACRight250",
  acRight500: "ACRight500",
  acRight1000: "ACRight1000",
  acRight2000: "ACRight2000",
  acRight3000: "ACRight3000",
  acRight4000: "ACRight4000",
  acRight6000: "ACRight6000",
  acLeft250: "ACLeft250",
  acLeft500: "ACLeft500",
  acLeft1000: "ACLeft1000",
  acLeft2000: "ACLeft2000",
  acLeft3000: "ACLeft3000",
  acLeft4000: "ACLeft4000",
  acLeft6000: "ACLeft6000",
} as const;

// ---------------------------------------------------------------------------
// Signia forms
// ---------------------------------------------------------------------------

const SIGNIA_COMMON_TEXT = {
  billingAccountNumber: "clinicBillingAccountNumber",
  shippingAccountNumber: "clinicShippingAccountNumber",
  patientFullName: "patientName",
  provider: "provider",
  todaysDate: "todaysDate",
  acRight250: "ACRight250",
  acRight500: "ACRight500",
  acRight1000: "ACRight1000",
  acRight2000: "ACRight2000",
  acRight3000: "ACRight3000",
  acRight4000: "ACRight4000",
  acRight6000: "ACRight6000",
  acRight8000: "ACRight8000",
  acLeft250: "ACLeft250",
  acLeft500: "ACLeft500",
  acLeft1000: "ACLeft1000",
  acLeft2000: "ACLeft2000",
  acLeft3000: "ACLeft3000",
  acLeft4000: "ACLeft4000",
  acLeft6000: "ACLeft6000",
  acLeft8000: "ACLeft8000",
} as const;

// ---------------------------------------------------------------------------
// Starkey forms
// ---------------------------------------------------------------------------

const STARKEY_COMMON_TEXT = {
  billingAccountNumber: "clinicBillingAccountNumber",
  shippingAccountNumber: "clinicShippingAccountNumber",
  provider: "provider",
  todaysDate: "todaysDate",
  acRight250: "ACRight250",
  acRight500: "ACRight500",
  acRight1000: "ACRight1000",
  acRight2000: "ACRight2000",
  acRight3000: "ACRight3000",
  acRight4000: "ACRight4000",
  acRight6000: "ACRight6000",
  acRight8000: "ACRight8000",
  acLeft250: "ACLeft250",
  acLeft500: "ACLeft500",
  acLeft1000: "ACLeft1000",
  acLeft2000: "ACLeft2000",
  acLeft3000: "ACLeft3000",
  acLeft4000: "ACLeft4000",
  acLeft6000: "ACLeft6000",
  acLeft8000: "ACLeft8000",
} as const;

// ---------------------------------------------------------------------------
// All mappings keyed by relative file path
// ---------------------------------------------------------------------------

export const FORM_FIELD_MAPPINGS: Record<string, FormFieldMapping> = {
  // ---- Oticon ----

  "var/manufacturer-forms/oticon/bte-earmold.pdf": {
    textFields: {
      ...OTICON_COMMON_TEXT,
      orderDate: "orderPurchaseDate",
      modelNameRight: "modelNameRight",
      styleRight: "styleRight",
      serialNumberRight: "serialNumberRight",
      colorRight: "colorRight",
    } as FormFieldMapping["textFields"],
    defaultEarmoldCheckboxes: [
      "BTE Mold Hrd Acrylic R",
      "BTE Mold Hrd Acrylic L",
      "BTE Mold Retention Canal Lk R",
      "BTE Mold Retention Canal Lk L",
      "BTE mold Vent Med R",
      "BTE mold Vent Med L",
    ],
    defaultRadioSelections: [
      {
        fieldName: "Instument info and id",
        optionValue: "BTE New mold for existing instrument",
      },
    ],
  },

  "var/manufacturer-forms/oticon/minirite-earmold-polaris.pdf": {
    textFields: {
      ...OTICON_COMMON_TEXT,
      orderDate: "orderPurchaseDate",
      modelNameRight: "modelNameRight",
      styleRight: "styleRight",
      serialNumberRight: "serialNumberRight",
      colorRight: "colorRight",
    } as FormFieldMapping["textFields"],
    defaultEarmoldCheckboxes: [
      "MicroMold Hrd Acrylic R",
      "MicroMold Hrd Acrylic L",
      "MicroMold Retention Canal Lk R",
      "MicroMold Retention Canal Lk L",
      "MicroMold Fitting 85 R",
      "MicroMold Fitting 85 L",
      "MicroMold Vent Med R",
      "MicroMold Vent Med L",
    ],
    defaultRadioSelections: [
      {
        fieldName: "Instument info and id",
        optionValue: "miniRITE New mold for existing instrument",
      },
    ],
  },

  "var/manufacturer-forms/oticon/minirite-earmold-sirius.pdf": {
    textFields: {
      ...OTICON_COMMON_TEXT,
      orderDate: "orderPurchaseDate",
    },
    defaultEarmoldCheckboxes: [
      "MicroMold Hard Acrylic R",
      "MicroMold Hard Acrylic L",
      "MicroMold Canal Lock R",
      "MicroMold Canal Lock L",
      "MicroMold miniFit 85 R",
      "MicroMold miniFit 85 L",
      "MicroMold Medium R",
      "MicroMold Medium L",
      // Sirius uses checkboxes not radio; Check Box3 = existing instrument
      "Check Box3",
    ],
  },

  "var/manufacturer-forms/oticon/custom-device.pdf": {
    textFields: {
      ...OTICON_COMMON_TEXT,
      orderDate: "orderDate",
    },
  },

  // ---- Signia ----

  "var/manufacturer-forms/signia/custom-device.pdf": {
    textFields: {
      ...SIGNIA_COMMON_TEXT,
      clinicPhone: "clinicPhoneNumber",
      orderId: "orderInvoiceNumber",
    },
  },

  "var/manufacturer-forms/signia/ric-earmold.pdf": {
    textFields: {
      ...SIGNIA_COMMON_TEXT,
      orderId: "orderId",
    },
  },

  // ---- Starkey ----

  "var/manufacturer-forms/starkey/custom-device.pdf": {
    textFields: {
      ...STARKEY_COMMON_TEXT,
      clinicPhone: "clinicPhoneNumber",
      clinicEmail: "clinicEmailAddress",
      clinicAddressBlock: "clinicAddressMultipleLines",
      billToAddressBlock: "orderBillToAddressMultipleLines",
      patientFirstName: "patientGivenName",
      patientLastName: "patientSurname",
      patientDob: "patientBirthdate",
      orderId: "orderId",
    },
  },

  "var/manufacturer-forms/starkey/earmold.pdf": {
    textFields: {
      ...STARKEY_COMMON_TEXT,
      clinicEmail: "clinicEmailAddress",
      patientFirstName: "patientGivenName",
      patientLastName: "patientSurname",
    },
  },

  "var/manufacturer-forms/starkey/ric-receiver.pdf": {
    textFields: {
      ...STARKEY_COMMON_TEXT,
      clinicPhone: "clinicPhoneNumber",
      clinicEmail: "clinicEmailAddress",
      clinicAddressBlock: "clinicAddressMultipleLines",
      billToAddressBlock: "orderBillToAddressMultipleLines",
      patientFirstName: "patientGivenName",
      patientLastName: "patientSurname",
      patientDob: "patientBirthdate",
      orderId: "orderId",
    },
  },

  "var/manufacturer-forms/starkey/signature-series-custom.pdf": {
    textFields: {
      ...STARKEY_COMMON_TEXT,
      clinicName: "clinicName",
      clinicPhone: "clinicPhoneNumber",
      clinicEmail: "clinicEmailAddress",
      clinicAddressBlock: "clinicAddressMultipleLines",
      billToAddressBlock: "orderBillToAddressMultipleLines",
      patientFirstName: "patientGivenName",
      patientLastName: "patientSurname",
      patientDob: "patientBirthdate",
      orderId: "orderId",
      orderDate: "orderDate",
    },
  },
};
