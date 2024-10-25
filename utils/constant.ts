import { RequestSigner } from "@/components/FormBuilder/SignerSection";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { MeetingDetails, MeetingType, SectionWithField } from "./types";

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://formsly.io"
    : "http://localhost:3000";

export const ONE_OFFICE_URL =
  process.env.NODE_ENV === "production"
    ? "https://oneoffice.ph"
    : "http://localhost:3001";

export const APP_SOURCE_ID = "d513a2b5-c223-4f7b-a19f-165ad29655ec";

export const DEFAULT_REQUEST_LIST_LIMIT = 13;
export const DEFAULT_TICKET_LIST_LIMIT = 13;
export const DEFAULT_FORM_LIST_LIMIT = 18;
export const DEFAULT_TEAM_MEMBER_LIST_LIMIT = 10;
export const DEFAULT_TEAM_GROUP_LIST_LIMIT = 10;
export const NOTIFICATION_LIST_LIMIT = 10;
export const DEFAULT_NOTIFICATION_LIST_LIMIT = 10;
export const ROW_PER_PAGE = 10;
export const DIALOG_ROW_PER_PAGE = 7;
export const MAX_FILE_SIZE_IN_MB = 5;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_IN_MB * 1024 * 1024;
export const MAX_INT = 2147483647;
export const MAX_TEXT_LENGTH = 4000;
export const DEFAULT_NUMBER_SSOT_ROWS = 10;
export const DEFAULT_ITEM_ANALYTICS_ROWS = 20;
export const DEFAULT_ON_SCROLL_LIMIT = 10;
export const FETCH_OPTION_LIMIT = 1000;
export const SELECT_OPTION_LIMIT = 1000;
export const TICKET_ADMIN_ANALYTICS_LIMIT = 10;
export const FORMSLY_PRICE_PER_MONTH = 35000;

export const APPLICATION_STATUS_CANCELLED = "CANCELLED";
export const APPLICATION_STATUS_PENDING = "PENDING";

export const MEETING_TYPE_DETAILS: Record<MeetingType, MeetingDetails> = {
  hr_phone_interview: {
    breakDuration: 5,
    duration: 15,
  },
  technical_interview: {
    breakDuration: 5,
    duration: 30,
  },
  trade_test: {
    breakDuration: 5,
    duration: 30,
  },
};

export const unsortableFieldList = [
  "Name",
  "Full Name",
  "Nickname",
  "Contact Number",
  "Email",
  "Assigned HR",
  "Action",
  "Meeting Link",
  "Job Offer Attachment",
  "Job Offer History",
  "Evaluation",
];

export const READ_ONLY_TICKET_CATEGORY_LIST = [
  "Incident Report for Employees",
  "Bug Report",
];

export const UNHIDEABLE_FORMLY_FORMS = [
  "Quotation",
  "Receiving Inspecting Report",
  "Release Order",
  "Sourced Item",
  "Transfer Receipt",
  "Subcon",
  "Request For Payment Code",
  "Bill of Quantity",
  "Petty Cash Voucher Balance",
];

export const REQUEST_LIST_HIDDEN_FORMS = [
  "Quotation",
  "Receiving Inspecting Report",
  "Release Order",
  "Sourced Item",
  "Transfer Receipt",
  "Subcon",
];

export const SLA_LIST = [
  {
    title: "Approver",
    description:
      "Approver SLA track, analyze, and optimize approver response times.",
    href: "/sla/approver",
  },
];

export const REPORT_LIST = [
  {
    title: "Incident Report for Employees",
    description: "Track and analyze report for a user.",
    href: "/report/incident-report",
  },
];

export const UUID_EXP =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export const SIGN_IN_PAGE_PATH = "/sign-in";
export const CREATE_PASSWORD_PAGE_PATH = "/create-password";
export const DEFAULT_LANDING_PAGE = "/team-requests/dashboard";

export const defaultRequestFormBuilderSection = (
  formId: string
): SectionWithField[] => [
  {
    section_form_id: formId,
    section_id: uuidv4(),
    section_name: "",
    section_order: 1,
    section_is_duplicatable: false,
    fields: [],
  },
];

export const defaultRequestFormBuilderSigners = (
  formId: string
): RequestSigner[] => {
  return [
    {
      signer_id: uuidv4(),
      signer_team_member_id: "",
      signer_action: "",
      signer_is_primary_signer: true,
      signer_form_id: formId,
      signer_order: 1,
    },
  ];
};

export const formslyPremadeFormsData = (teamMemberId: string) => {
  // form ids
  const itemFormId = uuidv4();
  const sourcedItemFormId = uuidv4();
  const quotationFormId = uuidv4();
  const receivingInspectingReportFormId = uuidv4();
  const releaseOrderFormId = uuidv4();
  const transferReceiptFormId = uuidv4();
  const subconFormId = uuidv4();

  // section ids
  const itemMainSectionId = uuidv4();
  const itemItemSectionId = uuidv4();
  const sourcedItemIdSectionId = uuidv4();
  const sourcedItemItemSectionId = uuidv4();
  const quotationIdSectionId = uuidv4();
  const quotationMainSectionId = uuidv4();
  const quotationAdditionalChargeSectionId = uuidv4();
  const quotationItemSectionId = uuidv4();
  const rirIdSectionId = uuidv4();
  const rirQualityCheckSectionId = uuidv4();
  const rirItemSectionId = uuidv4();
  const roIdSectionId = uuidv4();
  const roItemSectionId = uuidv4();
  const transferReceiptIdSectionId = uuidv4();
  const transferReceiptQuantityCheckSectionId = uuidv4();
  const transferReceiptItemSectionId = uuidv4();
  const subconMainSectionId = uuidv4();
  const subconServiceSectionId = uuidv4();

  // field ids
  const itemTypeFieldId = uuidv4();
  const quotationRequestSendMethodId = uuidv4();
  const quotationPaymentTermsId = uuidv4();
  const subconTypeId = uuidv4();

  const formData = {
    item: {
      form: {
        form_id: itemFormId,
        form_name: "Item",
        form_description: "formsly premade Item form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: itemMainSectionId,
          section_name: "Main",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: itemFormId,
        },
        {
          section_id: itemItemSectionId,
          section_name: "Item",
          section_order: 2,
          section_is_duplicatable: true,
          section_form_id: itemFormId,
        },
      ],
      field: [
        {
          field_name: "Requesting Project",
          field_type: "DROPDOWN",
          field_order: 1,
          field_section_id: itemMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Date Needed",
          field_type: "DATE",
          field_order: 3,
          field_section_id: itemMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Purpose",
          field_type: "TEXT",
          field_order: 4,
          field_section_id: itemMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "General Name",
          field_type: "DROPDOWN",
          field_order: 5,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Base Unit of Measurement",
          field_type: "TEXT",
          field_order: 6,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 7,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "GL Account",
          field_type: "TEXT",
          field_order: 8,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "CSI Code Description",
          field_type: "DROPDOWN",
          field_order: 9,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "CSI Code",
          field_type: "TEXT",
          field_order: 10,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Division Description",
          field_type: "TEXT",
          field_order: 11,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Level 2 Major Group Description",
          field_type: "TEXT",
          field_order: 12,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Level 2 Minor Group Description",
          field_type: "TEXT",
          field_order: 13,
          field_section_id: itemItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
      ],
      option: [
        {
          option_value: "Cash Purchase - Advance Payment",
          option_order: 1,
          option_field_id: itemTypeFieldId,
        },
        {
          option_value: "Cash Purchase - Local Purchase",
          option_order: 2,
          option_field_id: itemTypeFieldId,
        },
        {
          option_value: "Order to Purchase",
          option_order: 3,
          option_field_id: itemTypeFieldId,
        },
      ],
    },
    sourcedItem: {
      form: {
        form_id: sourcedItemFormId,
        form_name: "Sourced Item",
        form_description: "formsly premade Sourced Item form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: sourcedItemIdSectionId,
          section_name: "ID",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: sourcedItemFormId,
        },
        {
          section_id: sourcedItemItemSectionId,
          section_name: "Item",
          section_order: 2,
          section_is_duplicatable: true,
          section_form_id: sourcedItemFormId,
        },
      ],
      field: [
        {
          field_name: "Item ID",
          field_type: "LINK",
          field_order: 1,
          field_section_id: sourcedItemIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Item",
          field_type: "DROPDOWN",
          field_order: 2,
          field_section_id: sourcedItemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 3,
          field_section_id: sourcedItemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Source Project",
          field_type: "DROPDOWN",
          field_order: 4,
          field_section_id: sourcedItemItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
      ],
    },
    quotation: {
      form: {
        form_id: quotationFormId,
        form_name: "Quotation",
        form_description: "formsly premade Quotation form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: quotationIdSectionId,
          section_name: "ID",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: quotationFormId,
        },
        {
          section_id: quotationMainSectionId,
          section_name: "Main",
          section_order: 2,
          section_is_duplicatable: false,
          section_form_id: quotationFormId,
        },
        {
          section_id: quotationAdditionalChargeSectionId,
          section_name: "Additional Charges",
          section_order: 3,
          section_is_duplicatable: false,
          section_form_id: quotationFormId,
        },
        {
          section_id: quotationItemSectionId,
          section_name: "Item",
          section_order: 4,
          section_is_duplicatable: true,
          section_form_id: quotationFormId,
        },
      ],
      field: [
        {
          field_name: "Item ID",
          field_type: "LINK",
          field_order: 1,
          field_section_id: quotationIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Supplier",
          field_type: "DROPDOWN",
          field_order: 2,
          field_section_id: quotationMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Supplier Quotation",
          field_type: "FILE",
          field_order: 3,
          field_section_id: quotationMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Proof of Sending",
          field_type: "FILE",
          field_order: 5,
          field_section_id: quotationMainSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Lead Time",
          field_type: "NUMBER",
          field_order: 7,
          field_section_id: quotationMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Required Down Payment",
          field_type: "NUMBER",
          field_order: 8,
          field_section_id: quotationMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Delivery Fee",
          field_type: "NUMBER",
          field_order: 9,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Bank Charge",
          field_type: "NUMBER",
          field_order: 10,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Mobilization Charge",
          field_type: "NUMBER",
          field_order: 11,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Demobilization Charge",
          field_type: "NUMBER",
          field_order: 12,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Freight Charge",
          field_type: "NUMBER",
          field_order: 13,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Hauling Charge",
          field_type: "NUMBER",
          field_order: 14,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Handling Charge",
          field_type: "NUMBER",
          field_order: 15,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Packing Charge",
          field_type: "NUMBER",
          field_order: 16,
          field_section_id: quotationAdditionalChargeSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Item",
          field_type: "DROPDOWN",
          field_order: 17,
          field_section_id: quotationItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Price per Unit",
          field_type: "NUMBER",
          field_order: 18,
          field_section_id: quotationItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 19,
          field_section_id: quotationItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
      ],
      option: [
        {
          option_value: "Email",
          option_order: 1,
          option_field_id: quotationRequestSendMethodId,
        },
        {
          option_value: "Text",
          option_order: 2,
          option_field_id: quotationRequestSendMethodId,
        },
        {
          option_value: "Other",
          option_order: 3,
          option_field_id: quotationRequestSendMethodId,
        },
        {
          option_value: "7 PDC",
          option_order: 1,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "15 PDC",
          option_order: 2,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "30 PDC",
          option_order: 3,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "45 PDC",
          option_order: 4,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "60 PDC",
          option_order: 5,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "70 PDC",
          option_order: 6,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "90 PDC",
          option_order: 7,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "120 PDC",
          option_order: 8,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "7 UPI",
          option_order: 9,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "15 UPI",
          option_order: 10,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "30 UPI",
          option_order: 11,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "35 UPI",
          option_order: 12,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "45 UPI",
          option_order: 13,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "60 UPI",
          option_order: 14,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "90 UPI",
          option_order: 15,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "120 UPI",
          option_order: 16,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "7 DAYS",
          option_order: 17,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "COD",
          option_order: 18,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "DATED",
          option_order: 19,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "FO3",
          option_order: 20,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "LC",
          option_order: 21,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "PB",
          option_order: 22,
          option_field_id: quotationPaymentTermsId,
        },
        {
          option_value: "TT",
          option_order: 23,
          option_field_id: quotationPaymentTermsId,
        },
      ],
    },
    receivingInspectingReport: {
      form: {
        form_id: receivingInspectingReportFormId,
        form_name: "Receiving Inspecting Report",
        form_description: "formsly premade Receiving Inspecting Report form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: rirIdSectionId,
          section_name: "ID",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: receivingInspectingReportFormId,
        },
        {
          section_id: rirQualityCheckSectionId,
          section_name: "Quality Check",
          section_order: 2,
          section_is_duplicatable: false,
          section_form_id: receivingInspectingReportFormId,
        },
        {
          section_id: rirItemSectionId,
          section_name: "Item",
          section_order: 3,
          section_is_duplicatable: true,
          section_form_id: receivingInspectingReportFormId,
        },
      ],
      field: [
        {
          field_name: "Item ID",
          field_type: "LINK",
          field_order: 1,
          field_section_id: rirIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Quotation ID",
          field_type: "LINK",
          field_order: 2,
          field_section_id: rirIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "DR",
          field_type: "FILE",
          field_order: 3,
          field_section_id: rirQualityCheckSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "SI",
          field_type: "FILE",
          field_order: 4,
          field_section_id: rirQualityCheckSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "QCIR",
          field_type: "FILE",
          field_order: 5,
          field_section_id: rirQualityCheckSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Item",
          field_type: "DROPDOWN",
          field_order: 6,
          field_section_id: rirItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 7,
          field_section_id: rirItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Receiving Status",
          field_type: "TEXT",
          field_order: 8,
          field_section_id: rirItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
      ],
    },
    releaseOrder: {
      form: {
        form_id: releaseOrderFormId,
        form_name: "Release Order",
        form_description: "formsly premade Release Order form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: roIdSectionId,
          section_name: "ID",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: releaseOrderFormId,
        },
        {
          section_id: roItemSectionId,
          section_name: "Item",
          section_order: 2,
          section_is_duplicatable: true,
          section_form_id: releaseOrderFormId,
        },
      ],
      field: [
        {
          field_name: "Item ID",
          field_type: "LINK",
          field_order: 1,
          field_section_id: roIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Sourced Item ID",
          field_type: "LINK",
          field_order: 2,
          field_section_id: roIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Item",
          field_type: "DROPDOWN",
          field_order: 3,
          field_section_id: roItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 4,
          field_section_id: roItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Receiving Status",
          field_type: "TEXT",
          field_order: 5,
          field_section_id: roItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Source Project",
          field_type: "TEXT",
          field_order: 6,
          field_section_id: roItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
      ],
    },
    transferReceipt: {
      form: {
        form_id: transferReceiptFormId,
        form_name: "Transfer Receipt",
        form_description: "formsly premade Transfer Receipt form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: transferReceiptIdSectionId,
          section_name: "ID",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: transferReceiptFormId,
        },
        {
          section_id: transferReceiptQuantityCheckSectionId,
          section_name: "Quantity Check",
          section_order: 2,
          section_is_duplicatable: false,
          section_form_id: transferReceiptFormId,
        },
        {
          section_id: transferReceiptItemSectionId,
          section_name: "Item",
          section_order: 3,
          section_is_duplicatable: true,
          section_form_id: transferReceiptFormId,
        },
      ],
      field: [
        {
          field_name: "Item ID",
          field_type: "LINK",
          field_order: 1,
          field_section_id: transferReceiptIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Sourced Item ID",
          field_type: "LINK",
          field_order: 2,
          field_section_id: transferReceiptIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Release Order ID",
          field_type: "LINK",
          field_order: 3,
          field_section_id: transferReceiptIdSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Transfer Shipment",
          field_type: "FILE",
          field_order: 4,
          field_section_id: transferReceiptQuantityCheckSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Transfer Receipt",
          field_type: "FILE",
          field_order: 5,
          field_section_id: transferReceiptQuantityCheckSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Item",
          field_type: "DROPDOWN",
          field_order: 6,
          field_section_id: transferReceiptItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Quantity",
          field_type: "NUMBER",
          field_order: 7,
          field_section_id: transferReceiptItemSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Receiving Status",
          field_type: "TEXT",
          field_order: 8,
          field_section_id: transferReceiptItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
        {
          field_name: "Source Project",
          field_type: "TEXT",
          field_order: 9,
          field_section_id: transferReceiptItemSectionId,
          field_is_required: true,
          field_is_read_only: true,
        },
      ],
    },
    subcon: {
      form: {
        form_id: subconFormId,
        form_name: "Subcon",
        form_description: "formsly premade Subcon form",
        form_app: "REQUEST",
        form_is_formsly_form: true,
        form_is_hidden: true,
        form_team_member_id: teamMemberId,
        form_is_disabled: false,
      },
      section: [
        {
          section_id: subconMainSectionId,
          section_name: "Main",
          section_order: 1,
          section_is_duplicatable: false,
          section_form_id: subconFormId,
        },
        {
          section_id: subconServiceSectionId,
          section_name: "Service",
          section_order: 2,
          section_is_duplicatable: true,
          section_form_id: subconFormId,
        },
      ],
      field: [
        {
          field_name: "Requesting Project",
          field_type: "DROPDOWN",
          field_order: 1,
          field_section_id: subconMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Date Needed",
          field_type: "DATE",
          field_order: 2,
          field_section_id: subconMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Purpose",
          field_type: "TEXT",
          field_order: 3,
          field_section_id: subconMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Description of Work",
          field_type: "TEXT",
          field_order: 5,
          field_section_id: subconMainSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
        {
          field_name: "Nominated Subcon",
          field_type: "MULTISELECT",
          field_order: 6,
          field_section_id: subconMainSectionId,
          field_is_required: false,
          field_is_read_only: false,
        },
        {
          field_name: "Service Name",
          field_type: "DROPDOWN",
          field_order: 7,
          field_section_id: subconServiceSectionId,
          field_is_required: true,
          field_is_read_only: false,
        },
      ],
      option: [
        {
          option_value: "Supply and Installation / Supply and Application",
          option_order: 1,
          option_field_id: subconTypeId,
        },
        {
          option_value: "Installation / Application Works / Fabrication only",
          option_order: 2,
          option_field_id: subconTypeId,
        },
        {
          option_value: "Supply and Fabrication",
          option_order: 3,
          option_field_id: subconTypeId,
        },
      ],
    },
  };

  const fieldsWithId = [
    {
      field_id: itemTypeFieldId,
      field_name: "Type",
      field_type: "DROPDOWN",
      field_order: 2,
      field_section_id: itemMainSectionId,
      field_is_required: true,
      field_is_read_only: false,
    },
    {
      field_id: quotationRequestSendMethodId,
      field_name: "Request Send Method",
      field_type: "DROPDOWN",
      field_order: 4,
      field_section_id: quotationMainSectionId,
      field_is_required: false,
      field_is_read_only: false,
    },
    {
      field_id: quotationPaymentTermsId,
      field_name: "Payment Terms",
      field_type: "DROPDOWN",
      field_order: 6,
      field_section_id: quotationMainSectionId,
      field_is_required: true,
      field_is_read_only: false,
    },
    {
      field_id: subconTypeId,
      field_name: "Type",
      field_type: "DROPDOWN",
      field_order: 4,
      field_section_id: subconMainSectionId,
      field_is_required: true,
      field_is_read_only: false,
    },
  ];

  const {
    item,
    sourcedItem,
    quotation,
    receivingInspectingReport,
    releaseOrder,
    transferReceipt,
    subcon,
  } = formData;

  return {
    forms: [
      item.form,
      sourcedItem.form,
      quotation.form,
      receivingInspectingReport.form,
      releaseOrder.form,
      transferReceipt.form,
      subcon.form,
    ],
    sections: [
      ...item.section,
      ...sourcedItem.section,
      ...quotation.section,
      ...receivingInspectingReport.section,
      ...releaseOrder.section,
      ...transferReceipt.section,
      ...subcon.section,
    ],
    fieldsWithoutId: [
      ...item.field,
      ...sourcedItem.field,
      ...quotation.field,
      ...receivingInspectingReport.field,
      ...releaseOrder.field,
      ...transferReceipt.field,
      ...subcon.field,
    ],
    fieldWithId: fieldsWithId,
    options: [...item.option, ...quotation.option, ...subcon.option],
  };
};

export const FORMSLY_GROUP = [
  "OPERATIONS/ENGINEERING",
  "PURCHASER",
  "SITE WAREHOUSE",
  "LEAD INVENTORY CONTROLLER",
  "WAREHOUSE CORPORATE SUPPORT LEAD",
  "TREASURY PROCESSOR",
  "AUDIT PROCESSOR",
];

export const ITEM_PURPOSE_CHOICES = [
  "Major Material (cement, aggregates, ready-mix concerete, rebar, admixture, RC pipe, CHB)",
  "Formworks (all parts and types including accessories)",
  "Office Supplies, Furnitures, and Equipment",
  "Light Equipment & Tools",
  "PPE & Safety Paraphernalia",
  "Subcontractor (supply of labor, materials, fabrication, manufacture, production)",
  "Permanent Materials w/ BAC (line items in BOQ)",
  "IT Equipment",
  "Fuel",
  "Hauling Works",
  "Survey, Calibration & Testing of Instruments",
  "Consumable/Common Materials for Permanent",
  "PED Transactions",
  "Repairs and Maintenance",
  "Other Services",
];

export const ITEM_FIELDS_ORDER = [
  "Requesting Project",
  "Type",
  "Date Needed",
  "Purpose",
];

export const FORMSLY_FORM_ORDER = [
  "Item",
  "Sourced Item",
  "Release Order",
  "Transfer Receipt",
  "Quotation",
  "Receiving Inspecting Report",
];

// Common image file extensions
export const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
];

// Common PDF file extensions
export const pdfExtensions = [".pdf"];

// Common document file extensions
export const documentExtensions = [
  ".doc",
  ".docx",
  ".txt",
  ".rtf",
  ".odt",
  ".csv",
  ".xlsx",
];

// Common audio and video file extensions
export const mediaExtensions = [
  ".mp4",
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".avi",
];

export const GL_ACCOUNT_CHOICES = [
  "Formworks Accessories",
  "Construction Materials",
  "Spare Parts & Supplies",
  "Uniform and Safety Paraphernalia",
  "Fuel, Oil, Lubricants",
  "Office Supplies & Stationeries",
  "Miscellaneous Supplies",
  "Fixed Asset - Construction Equipment, Machinery and Tools",
  "Fixed Asset - Transportation Equipment",
  "Fixed Asset - Office Machine and Equipment",
  "Fixed Asset - Low Value Asset >50k",
  "Minor Equipment, Furniture and Tools <50k",
  "Computer Software",
  "Temporary Facility",
  "Bidding",
];

export const FORM_SEGMENT_CHOCIES = [
  { label: "Form Preview", value: "Form Preview" },
  { label: "Form Details", value: "Form Details" },
  { label: "Form Lookup", value: "Form Lookup" },
];

export const formatDate = (dateValue: Date) => {
  return moment(dateValue).format("YYYY-MM-DD");
};

export const formatTime = (timeValue: Date) => {
  return moment(timeValue).format("LT");
};

export const ID_OPTIONS = [
  {
    value: "Company ID",
    label: "Company ID",
  },
  {
    value: "Pag-IBIG",
    label: "Pag-IBIG",
  },
  {
    value: "PhilHealth",
    label: "PhilHealth",
  },
  {
    value: "Philippine Driver's License",
    label: "Philippine Driver's License",
  },
  {
    value: "Philippine Identification (PhilID) / ePhilID",
    label: "Philippine Identification (PhilID) / ePhilID",
  },
  {
    value: "Philippine Passport",
    label: "Philippine Passport",
  },
  {
    value: "SSS",
    label: "SSS",
  },
  {
    value: "Unified Multi-Purpose Identification (UMID) Card",
    label: "Unified Multi-Purpose Identification (UMID) Card",
  },
];

export const createTicketFilePlaceholder = (url: string) => {
  const urlArray = `${url}`.split("___");
  const fileName = urlArray[urlArray.length - 2].replace("%20", " ");
  const fileContent = "temporary";
  return new File([fileContent], fileName);
};

export const generateYearList = (
  startYear = 2000,
  endYear = 2050
): string[] => {
  const years: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year.toString());
  }
  return years;
};

export const generateMonthList = (): string[] => {
  const months: string[] = [];
  const date = new Date();
  for (let i = 0; i < 12; i++) {
    date.setMonth(i);
    months.push(date.toLocaleString(undefined, { month: "long" }));
  }
  return months;
};

export const ITEM_FIELD_ID_LIST = [
  "51b6da24-3e28-49c4-9e19-5988b9ad3909",
  "6882287e-57c7-42ae-a672-b0d6c8979b01",
  "46dc154d-1c35-4a3c-9809-698b56d17faa",
  "c08820a5-592a-4bf9-9528-97b7ee7be94b",
  "b2c899e8-4ac7-4019-819e-d6ebcae71f41",
  "c3efa89d-8297-4920-8c3e-d9dee61fdf13",
  "d78145e8-ba83-4fa8-907f-db66fd3cae0d",
  "440d9a37-656a-4237-be3b-c434f512eaa9",
  "a6266f0b-1339-4c50-910e-9bae73031df0",
  "0c9831e7-dc18-4aaf-87f7-2e7bcbc53eae",
  "64bb5899-bad4-4fe4-bc08-60dce9923f57",
  "8fdb158b-bed5-4eac-a6dc-bc69275f1ac7",
  "b69182a9-dc96-472b-aa31-b1f2f92ec78b",
  "159c86c3-dda6-4c8a-919f-50e1674659bd",
];

export const PED_ITEM_FIELD_ID_LIST = [
  "b93e3160-4f07-4b70-98bc-f84a372bd54c",
  "cf80d363-be97-4fb3-a91f-4fb9a0616b67",
  "20d9159a-c410-4e4b-8c21-c02e44d8f1e9",
  "218b70f8-7a3b-49a4-91c8-04567500812f",
  "53df2b33-9d35-4a15-b13d-431940738c68",
  "5f8d6c56-cac1-4756-8419-8aa8998bf8ed",
  "5eed4963-e011-4a1e-a03c-a901636d0dfa",
  "9638fdb6-4f8a-41cf-bf26-68b94f479a51",
  "7971912e-bdea-4820-9e1d-ff501296a62c",
  "c81706d5-bebf-4ffd-813b-71f57b219de5",
  "137bbd25-2f65-4b65-86e7-7f5726857084",
];

export const IT_ASSET_FIELD_ID_LIST = [
  "e638e010-44e8-4060-b065-e624fc5f1ab9",
  "7b0354fd-3f42-4c32-bed2-2f08231b168c",
  "58de3cd4-4a3c-4422-9d27-c57f173a3a3e",
  "f16c09d6-b9b7-4e77-a276-028537ec4e6a",
  "5c903026-b913-4071-a7a3-cb7ee9ee907f",
  "bbf26ed6-8e28-4249-b4ef-173a8255d231",
  "20251c66-fa30-4fce-bb06-87c5e9a891ed",
  "1a7001b7-e2d5-4469-9382-a49e74102ebb",
  "8a14bffe-2672-4a99-9943-9d7e6a7a15fa",
  "59c6b617-b0b5-4ecd-b9b5-7d7072098511",
  "6cff0df1-aed7-4ecc-a40f-25371649581d",
  "83556f5a-150d-473f-ae5a-bfe3c084a4eb",
  "8e25ccba-eb60-4a8c-965b-c77f81b66795",
  "85a78a9f-d0cd-45d5-b781-c909efab5769",
  "60b17659-6f6e-4719-99f1-47bed94fe7a8",
  "7313a52b-a131-4e93-ae97-f806acc1534f",
  "f2ac0b86-c483-435c-abda-08bf310e570b",
  "cfdba656-ad4f-4bec-9541-96d9fbfcf03f",
];

export const TECHNICAL_ASSESSMENT_FIELD_LIST = [
  "226b0080-b9bf-423e-ba3a-87132dfa9c6a",
  "4858119a-9f7a-423b-8130-7f1a69f3c296",
  "72abb19c-ac74-4378-941a-e4e64cf4f39e",
  "ab67c29a-b82b-4012-b74e-c99fe3444ab1",
  "c54ad877-222f-4e01-a77a-dd50a5839c12",
  "362bff3d-54fa-413b-992c-fd344d8552c6",
  "ef1e47d2-413f-4f92-b541-20c88f3a67b2",
  "ce73bb3c-e3f3-4257-a546-d079dea4cfc5",
  "f5f904e3-a13b-4369-a942-e686486dc827",
  "1653cdf2-08e6-4a3a-8280-55a7bd7de486",
  "8ff15d7e-c015-4ba1-8e16-59f5e47ffa67",
  "fc32500d-62df-4b3c-84be-238c7fb374c9",
  "a30ea8a0-ccd4-4e9c-8492-2487aad74cca",
];

export const DAYS_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];

export const INTERVAL_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const CSI_HIDDEN_FIELDS = [
  "CSI Code Description",
  "CSI Code",
  "Division Description",
  "Level 2 Major Group Description",
  "Level 2 Minor Group Description",
  "CSI Division",
];

export const ALLOWED_USER_TO_EDIT_LRF_REQUESTS =
  "accounting.ca@staclara.com.ph";

export const frequencyOptions = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

// projects that does not require cost code
export const costCodeExemptionList = [
  "YARD",
  "CENTRAL OFFICE",
  "SANTISIMO LOGISTICS",
];

export const excludedKeys = [
  "inventory_request_name",
  "request_creator_first_name",
  "request_creator_last_name",
  "site_name",
  "inventory_assignee_team_member_id",
  "request_creator_team_member_id",
  "request_creator_user_id",
  "assignee_user_id",
  "inventory_assignee_asset_request_id",
  "request_creator_avatar",
  "assignee_team_member_id",
  "assignee_first_name",
  "assignee_last_name",
  "inventory_request_purchase_date",
  "inventory_request_purchase_from",
  "inventory_request_purchase_order",
  "inventory_request_created_by",
  "inventory_request_created",
  "inventory_request_cost",
  "inventory_assignee_site_id",
  "inventory_request_form_id",
  "inventory_request_status_color",
  "inventory_request_item_code",
  "inventory_request_serial_number",
  "inventory_request_si_number",
  "inventory_event_date_created",
];
