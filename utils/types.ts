import { Database } from "@/utils/database";
import { Database as OneOfficeDatabase } from "oneoffice-api";

// Start: Database Table Types
export type AttachmentTableRow =
  Database["public"]["Tables"]["attachment_table"]["Row"];
export type AttachmentTableInsert =
  Database["public"]["Tables"]["attachment_table"]["Insert"];
export type AttachmentTableUpdate =
  Database["public"]["Tables"]["attachment_table"]["Update"];

export type CommentTableRow =
  Database["request_schema"]["Tables"]["comment_table"]["Row"];
export type CommentTableInsert =
  Database["request_schema"]["Tables"]["comment_table"]["Insert"];
export type CommentTableUpdate =
  Database["request_schema"]["Tables"]["comment_table"]["Update"];

export type DefaultFieldTableRow =
  Database["form_schema"]["Tables"]["field_table"]["Row"];
export type FieldTableRow = Omit<
  DefaultFieldTableRow,
  "field_special_field_template_id"
> & { field_special_field_template_id?: string | null };
export type FieldTableInsert =
  Database["form_schema"]["Tables"]["field_table"]["Insert"];
export type FieldTableUpdate =
  Database["form_schema"]["Tables"]["field_table"]["Update"];

export type FormTableRow =
  Database["form_schema"]["Tables"]["form_table"]["Row"];
export type FormTableInsert =
  Database["form_schema"]["Tables"]["form_table"]["Insert"];
export type FormTableUpdate =
  Database["form_schema"]["Tables"]["form_table"]["Update"];

export type InvitationTableRow =
  Database["user_schema"]["Tables"]["invitation_table"]["Row"];
export type InvitationTableInsert =
  Database["user_schema"]["Tables"]["invitation_table"]["Insert"];
export type InvitationTableUpdate =
  Database["user_schema"]["Tables"]["invitation_table"]["Update"];

export type NotificationTableRow =
  Database["public"]["Tables"]["notification_table"]["Row"];
export type NotificationTableInsert =
  Database["public"]["Tables"]["notification_table"]["Insert"];
export type NotificationTableUpdate =
  Database["public"]["Tables"]["notification_table"]["Update"];

export type OptionTableRow =
  Database["form_schema"]["Tables"]["option_table"]["Row"];
export type OptionTableInsert =
  Database["form_schema"]["Tables"]["option_table"]["Insert"];
export type OptionTableUpdate =
  Database["form_schema"]["Tables"]["option_table"]["Update"];

export type DefaultRequestResponseTableRow =
  Database["request_schema"]["Tables"]["request_response_table"]["Row"];
export type RequestResponseTableRow = Omit<
  DefaultRequestResponseTableRow,
  "request_response_prefix"
> & {
  request_response_prefix?: string | null;
};
export type RequestResponseTableInsert =
  Database["request_schema"]["Tables"]["request_response_table"]["Insert"];
export type RequestResponseTableUpdate =
  Database["request_schema"]["Tables"]["request_response_table"]["Update"];

export type RequestSignerTableRow =
  Database["request_schema"]["Tables"]["request_signer_table"]["Row"];
export type RequestSignerTableInsert =
  Database["request_schema"]["Tables"]["request_signer_table"]["Insert"];
export type RequestSignerTableUpdate =
  Database["request_schema"]["Tables"]["request_signer_table"]["Update"];

export type RequestTableRow =
  Database["request_schema"]["Tables"]["request_table"]["Row"];
export type RequestTableInsert =
  Database["request_schema"]["Tables"]["request_table"]["Insert"];
export type RequestTableUpdate =
  Database["request_schema"]["Tables"]["request_table"]["Update"];

export type SectionTableRow =
  Database["form_schema"]["Tables"]["section_table"]["Row"];
export type SectionTableInsert =
  Database["form_schema"]["Tables"]["section_table"]["Insert"];
export type SectionTableUpdate =
  Database["form_schema"]["Tables"]["section_table"]["Update"];

export type SignerTableRow =
  Database["form_schema"]["Tables"]["signer_table"]["Row"];
export type SignerTableInsert =
  Database["form_schema"]["Tables"]["signer_table"]["Insert"];
export type SignerTableUpdate =
  Database["form_schema"]["Tables"]["signer_table"]["Update"];

export type TeamMemberTableRow =
  Database["team_schema"]["Tables"]["team_member_table"]["Row"];
export type TeamMemberTableInsert =
  Database["team_schema"]["Tables"]["team_member_table"]["Insert"];
export type TeamMemberTableUpdate =
  Database["team_schema"]["Tables"]["team_member_table"]["Update"];

export type TeamTableRow =
  Database["team_schema"]["Tables"]["team_table"]["Row"];
export type TeamTableInsert =
  Database["team_schema"]["Tables"]["team_table"]["Insert"];
export type TeamTableUpdate =
  Database["team_schema"]["Tables"]["team_table"]["Update"];

export type UserTableRow =
  Database["user_schema"]["Tables"]["user_table"]["Row"];
export type UserTableInsert =
  Database["user_schema"]["Tables"]["user_table"]["Insert"];
export type UserTableUpdate =
  Database["user_schema"]["Tables"]["user_table"]["Update"];

export type ItemTableRow =
  Database["item_schema"]["Tables"]["item_table"]["Row"];
export type ItemTableInsert =
  Database["item_schema"]["Tables"]["item_table"]["Insert"];
export type ItemTableUpdate =
  Database["item_schema"]["Tables"]["item_table"]["Update"];

export type ItemDescriptionTableRow =
  Database["item_schema"]["Tables"]["item_description_table"]["Row"];
export type ItemDescriptionTableInsert =
  Database["item_schema"]["Tables"]["item_description_table"]["Insert"];
export type ItemDescriptionTableUpdate =
  Database["item_schema"]["Tables"]["item_description_table"]["Update"];

export type ItemDescriptionFieldTableRow =
  Database["item_schema"]["Tables"]["item_description_field_table"]["Row"];
export type ItemDescriptionFieldTableInsert =
  Database["item_schema"]["Tables"]["item_description_field_table"]["Insert"];
export type ItemDescriptionFieldTableUpdate =
  Database["item_schema"]["Tables"]["item_description_field_table"]["Update"];

export type ItemDescriptionFieldUOMTableRow =
  Database["item_schema"]["Tables"]["item_description_field_uom_table"]["Row"];
export type ItemDescriptionFieldUOMTableInsert =
  Database["item_schema"]["Tables"]["item_description_field_uom_table"]["Insert"];
export type ItemDescriptionFieldUOMTableUpdate =
  Database["item_schema"]["Tables"]["item_description_field_uom_table"]["Update"];

export type ItemLevelThreeeDescriptionRow =
  Database["item_schema"]["Tables"]["item_level_three_description_table"]["Row"];

export type SupplierTableRow =
  Database["team_schema"]["Tables"]["supplier_table"]["Row"];
export type SupplierTableInsert =
  Database["team_schema"]["Tables"]["supplier_table"]["Insert"];
export type SupplierTableUpdate =
  Database["team_schema"]["Tables"]["supplier_table"]["Update"];

export type TeamGroupTableRow =
  Database["team_schema"]["Tables"]["team_group_table"]["Row"];
export type TeamGroupTableInsert =
  Database["team_schema"]["Tables"]["team_group_table"]["Insert"];
export type TeamGroupTableUpdate =
  Database["team_schema"]["Tables"]["team_group_table"]["Update"];

export type TeamProjectTableRow =
  Database["team_schema"]["Tables"]["team_project_table"]["Row"];
export type TeamProjectTableInsert =
  Database["team_schema"]["Tables"]["team_project_table"]["Insert"];
export type TeamProjectTableUpdate =
  Database["team_schema"]["Tables"]["team_project_table"]["Update"];

export type CSICodeTableRow =
  Database["lookup_schema"]["Tables"]["csi_code_table"]["Row"];
export type CSICodeTableInsert =
  Database["lookup_schema"]["Tables"]["csi_code_table"]["Insert"];
export type CSICodeTableUpdate =
  Database["lookup_schema"]["Tables"]["csi_code_table"]["Update"];

export type ServiceTableRow =
  Database["service_schema"]["Tables"]["service_table"]["Row"];
export type ServiceTableInsert =
  Database["service_schema"]["Tables"]["service_table"]["Insert"];
export type ServiceTableUpdate =
  Database["service_schema"]["Tables"]["service_table"]["Update"];

export type ServiceScopeTableRow =
  Database["service_schema"]["Tables"]["service_scope_table"]["Row"];
export type ServiceScopeTableInsert =
  Database["service_schema"]["Tables"]["service_scope_table"]["Insert"];
export type ServiceScopeTableUpdate =
  Database["service_schema"]["Tables"]["service_scope_table"]["Update"];

export type ServiceScopeChoiceTableRow =
  Database["service_schema"]["Tables"]["service_scope_choice_table"]["Row"];
export type ServiceScopeChoiceTableInsert =
  Database["service_schema"]["Tables"]["service_scope_choice_table"]["Insert"];
export type ServiceScopeChoiceTableUpdate =
  Database["service_schema"]["Tables"]["service_scope_choice_table"]["Update"];

export type TicketTableRow =
  Database["ticket_schema"]["Tables"]["ticket_table"]["Row"];
export type TicketTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_table"]["Insert"];
export type TicketTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_table"]["Update"];

export type TicketCommentTableRow =
  Database["ticket_schema"]["Tables"]["ticket_comment_table"]["Row"];
export type TicketCommentTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_comment_table"]["Insert"];
export type TicketCommentTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_comment_table"]["Update"];

export type ServiceCategoryTableRow =
  Database["service_schema"]["Tables"]["service_category_table"]["Row"];
export type ServiceCategoryTableInsert =
  Database["service_schema"]["Tables"]["service_category_table"]["Insert"];
export type ServiceCategoryTableUpdate =
  Database["service_schema"]["Tables"]["service_category_table"]["Update"];

export type EquipmentTableRow =
  Database["equipment_schema"]["Tables"]["equipment_table"]["Row"];
export type EquipmentTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_table"]["Insert"];
export type EquipmentTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_table"]["Update"];

export type EquipmentDescriptionTableRow =
  Database["equipment_schema"]["Tables"]["equipment_description_table"]["Row"];
export type EquipmentDescriptionTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_description_table"]["Insert"];
export type EquipmentDescriptionTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_description_table"]["Update"];

export type EquipmentPartTableRow =
  Database["equipment_schema"]["Tables"]["equipment_part_table"]["Row"];
export type EquipmentPartTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_part_table"]["Insert"];
export type EquipmentPartTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_part_table"]["Update"];

export type EquipmentCategoryTableRow =
  Database["equipment_schema"]["Tables"]["equipment_category_table"]["Row"];
export type EquipmentCategoryTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_category_table"]["Insert"];
export type EquipmentCategoryTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_category_table"]["Update"];

export type EquipmentBrandTableRow =
  Database["equipment_schema"]["Tables"]["equipment_brand_table"]["Row"];
export type EquipmentBrandTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_brand_table"]["Insert"];
export type EquipmentBrandTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_brand_table"]["Update"];

export type EquipmentModelTableRow =
  Database["equipment_schema"]["Tables"]["equipment_model_table"]["Row"];
export type EquipmentModelTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_model_table"]["Insert"];
export type EquipmentModelTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_model_table"]["Update"];

export type EquipmentUnitOfMeasurementTableRow =
  Database["unit_of_measurement_schema"]["Tables"]["equipment_unit_of_measurement_table"]["Row"];
export type EquipmentUnitOfMeasurementTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_brand_table"]["Insert"];
export type EquipmentUnitOfMeasurementTableUpdate =
  Database["unit_of_measurement_schema"]["Tables"]["equipment_unit_of_measurement_table"]["Update"];

export type EquipmentComponentCategoryTableRow =
  Database["equipment_schema"]["Tables"]["equipment_component_category_table"]["Row"];
export type EquipmentComponentCategoryTableInsert =
  Database["equipment_schema"]["Tables"]["equipment_component_category_table"]["Insert"];
export type EquipmentComponentCategoryTableUpdate =
  Database["equipment_schema"]["Tables"]["equipment_component_category_table"]["Update"];

export type MemoTableRow =
  Database["memo_schema"]["Tables"]["memo_table"]["Row"];
export type MemoTableInsert =
  Database["memo_schema"]["Tables"]["memo_table"]["Insert"];
export type MemoTableUpdate =
  Database["memo_schema"]["Tables"]["memo_table"]["Update"];

export type MemoSignerTableRow =
  Database["memo_schema"]["Tables"]["memo_signer_table"]["Row"];
export type MemoSignerTableInsert =
  Database["memo_schema"]["Tables"]["memo_signer_table"]["Insert"];
export type MemoSignerTableUpdate =
  Database["memo_schema"]["Tables"]["memo_signer_table"]["Update"];

export type MemoLineItemTableRow =
  Database["memo_schema"]["Tables"]["memo_line_item_table"]["Row"];
export type MemoLineItemTableInsert =
  Database["memo_schema"]["Tables"]["memo_line_item_table"]["Insert"];
export type MemoLineItemTableUpdate =
  Database["memo_schema"]["Tables"]["memo_line_item_table"]["Update"];

export type MemoLineItemAttachmentTableRow =
  Database["memo_schema"]["Tables"]["memo_line_item_attachment_table"]["Row"];
export type MemoLineItemAttachmentTableInsert =
  Database["memo_schema"]["Tables"]["memo_line_item_attachment_table"]["Insert"];
export type MemoLineItemAttachmentTableUpdate =
  Database["memo_schema"]["Tables"]["memo_line_item_attachment_table"]["Update"];

export type MemoReadReceiptTableRow =
  Database["memo_schema"]["Tables"]["memo_read_receipt_table"]["Row"];
export type MemoReadReceiptTableInsert =
  Database["memo_schema"]["Tables"]["memo_read_receipt_table"]["Insert"];
export type MemoReadReceiptTableUpdate =
  Database["memo_schema"]["Tables"]["memo_read_receipt_table"]["Update"];

export type MemoAgreementTableRow =
  Database["memo_schema"]["Tables"]["memo_agreement_table"]["Row"];
export type MemoAgreementTableInsert =
  Database["memo_schema"]["Tables"]["memo_agreement_table"]["Insert"];
export type MemoAgreementTableUpdate =
  Database["memo_schema"]["Tables"]["memo_agreement_table"]["Update"];
export type OtherExpensesTypeTableRow =
  Database["other_expenses_schema"]["Tables"]["other_expenses_type_table"]["Row"];
export type OtherExpensesTypeTableInsert =
  Database["other_expenses_schema"]["Tables"]["other_expenses_type_table"]["Insert"];
export type OtherExpensesTypeTableUpdate =
  Database["other_expenses_schema"]["Tables"]["other_expenses_type_table"]["Update"];

export type SignatureHistoryTableRow =
  Database["history_schema"]["Tables"]["signature_history_table"]["Row"];
export type UserValidIDTableRow =
  Database["user_schema"]["Tables"]["user_valid_id_table"]["Row"];
export type UserValidIDTableInsert =
  Database["user_schema"]["Tables"]["user_valid_id_table"]["Insert"];
export type UserValidIDTableUpdate =
  Database["user_schema"]["Tables"]["user_valid_id_table"]["Update"];

export type MemoFormatTableRow =
  Database["memo_schema"]["Tables"]["memo_format_section_table"]["Row"];
export type MemoFormatTableInsert =
  Database["memo_schema"]["Tables"]["memo_format_section_table"]["Insert"];
export type MemoFormatTableUpdate =
  Database["memo_schema"]["Tables"]["memo_format_section_table"]["Update"];

export type MemoFormatSubsectionTableRow =
  Database["memo_schema"]["Tables"]["memo_format_subsection_table"]["Row"];
export type MemoFormatSubsectionTableInsert =
  Database["memo_schema"]["Tables"]["memo_format_subsection_table"]["Insert"];
export type MemoFormatSubsectionTableUpdate =
  Database["memo_schema"]["Tables"]["memo_format_subsection_table"]["Update"];

export type MemoFormatAttachmentTableRow =
  Database["memo_schema"]["Tables"]["memo_format_attachment_table"]["Row"];
export type MemoFormatAttachmentTableInsert =
  Database["memo_schema"]["Tables"]["memo_format_attachment_table"]["Insert"];
export type MemoFormatAttachmentTableUpdate =
  Database["memo_schema"]["Tables"]["memo_format_attachment_table"]["Update"];

export type QueryTableRow =
  Database["lookup_schema"]["Tables"]["query_table"]["Row"];

export type FormSLATableRow =
  Database["form_schema"]["Tables"]["form_sla_table"]["Row"];
export type FormSLATableInsert =
  Database["form_schema"]["Tables"]["form_sla_table"]["Insert"];
export type FormSLATableUpdate =
  Database["form_schema"]["Tables"]["form_sla_table"]["Update"];

export type TicketCategoryTableRow =
  Database["ticket_schema"]["Tables"]["ticket_category_table"]["Row"];
export type TicketCategoryTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_category_table"]["Insert"];
export type TicketCategoryTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_category_table"]["Update"];

export type TicketSectionTableRow =
  Database["ticket_schema"]["Tables"]["ticket_section_table"]["Row"];
export type TicketSectionTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_section_table"]["Insert"];
export type TicketSectionTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_section_table"]["Update"];

export type TicketFieldTableRow =
  Database["ticket_schema"]["Tables"]["ticket_field_table"]["Row"];
export type TicketFieldTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_field_table"]["Insert"];
export type TicketFieldTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_field_table"]["Update"];

export type TicketOptionTableRow =
  Database["ticket_schema"]["Tables"]["ticket_option_table"]["Row"];
export type TicketOptionTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_option_table"]["Insert"];
export type TicketOptionTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_option_table"]["Update"];

export type TicketResponseTableRow =
  Database["ticket_schema"]["Tables"]["ticket_response_table"]["Row"];
export type TicketResponseTableInsert =
  Database["ticket_schema"]["Tables"]["ticket_response_table"]["Insert"];
export type TicketResponseTableUpdate =
  Database["ticket_schema"]["Tables"]["ticket_response_table"]["Update"];

export type AddressTableRow =
  Database["public"]["Tables"]["address_table"]["Row"];
export type AddressTableInsert =
  Database["public"]["Tables"]["address_table"]["Insert"];
export type AddressTableUpdate =
  Database["public"]["Tables"]["address_table"]["Update"];

export type RequestViewTableRow =
  Database["public"]["Views"]["request_view"]["Row"];

export type JiraProjectTableRow =
  Database["jira_schema"]["Tables"]["jira_project_table"]["Row"];
export type JiraProjectTableInsert =
  Database["jira_schema"]["Tables"]["jira_project_table"]["Insert"];
export type JiraProjectTableUpdate =
  Database["jira_schema"]["Tables"]["jira_project_table"]["Update"];

export type JiraFormslyProjectTableRow =
  Database["jira_schema"]["Tables"]["jira_formsly_project_table"]["Row"];
export type JiraFormslyProjectTableInsert =
  Database["jira_schema"]["Tables"]["jira_formsly_project_table"]["Insert"];
export type JiraFormslyProjectTableUpdate =
  Database["jira_schema"]["Tables"]["jira_formsly_project_table"]["Update"];

export type JiraUserAccountTableRow =
  Database["jira_schema"]["Tables"]["jira_user_account_table"]["Row"];
export type JiraUserAccountTableInsert =
  Database["jira_schema"]["Tables"]["jira_user_account_table"]["Insert"];
export type JiraUserAccountTableUpdate =
  Database["jira_schema"]["Tables"]["jira_user_account_table"]["Update"];

export type JiraUserRoleTableRow =
  Database["jira_schema"]["Tables"]["jira_user_role_table"]["Row"];
export type JiraUserRoleTableInsert =
  Database["jira_schema"]["Tables"]["jira_user_role_table"]["Insert"];
export type JiraUserRoleTableUpdate =
  Database["jira_schema"]["Tables"]["jira_user_role_table"]["Update"];

export type JiraProjectUserTableRow =
  Database["jira_schema"]["Tables"]["jira_project_user_table"]["Row"];
export type JiraProjectUserTableInsert =
  Database["jira_schema"]["Tables"]["jira_project_user_table"]["Insert"];
export type JiraProjectUserTableUpdate =
  Database["jira_schema"]["Tables"]["jira_project_user_table"]["Update"];

export type JiraItemCategoryTableRow =
  Database["jira_schema"]["Tables"]["jira_item_category_table"]["Row"];
export type JiraItemCategoryTableInsert =
  Database["jira_schema"]["Tables"]["jira_item_category_table"]["Insert"];
export type JiraItemCategoryTableUpdate =
  Database["jira_schema"]["Tables"]["jira_item_category_table"]["Update"];

export type JiraItemCategoryUserTableRow =
  Database["jira_schema"]["Tables"]["jira_item_user_table"]["Row"];
export type JiraItemCategoryUserTableInsert =
  Database["jira_schema"]["Tables"]["jira_item_user_table"]["Insert"];
export type JiraItemCategoryUserTableUpdate =
  Database["jira_schema"]["Tables"]["jira_item_user_table"]["Update"];

export type ItemCategoryTableRow =
  Database["item_schema"]["Tables"]["item_category_table"]["Row"];
export type ItemCategoryTableInsert =
  Database["item_schema"]["Tables"]["item_category_table"]["Insert"];
export type ItemCategoryTableUpdate =
  Database["item_schema"]["Tables"]["item_category_table"]["Update"];

export type JiraOrganizationTableRow =
  Database["jira_schema"]["Tables"]["jira_organization_table"]["Row"];
export type JiraOrganizationTableInsert =
  Database["jira_schema"]["Tables"]["jira_organization_table"]["Insert"];
export type JiraOrganizationTableUpdate =
  Database["jira_schema"]["Tables"]["jira_organization_table"]["Update"];

export type JiraOrganizationTeamProjectTableRow =
  Database["jira_schema"]["Tables"]["jira_organization_team_project_table"]["Row"];
export type JiraOrganizationTeamProjectTableInsert =
  Database["jira_schema"]["Tables"]["jira_organization_team_project_table"]["Insert"];
export type JiraOrganizationTeamProjectTableUpdate =
  Database["jira_schema"]["Tables"]["jira_organization_team_project_table"]["Update"];

export type SpecialFieldTemplateTableRow =
  Database["form_schema"]["Tables"]["special_field_template_table"]["Row"];
export type SpecialFieldTemplateTableInsert =
  Database["form_schema"]["Tables"]["special_field_template_table"]["Insert"];
export type SpecialFieldTemplateTableUpdate =
  Database["form_schema"]["Tables"]["special_field_template_table"]["Update"];

export type SCICEmployeeTableRow =
  Database["lookup_schema"]["Tables"]["scic_employee_table"]["Row"];
export type SCICEmployeeTableInsert =
  Database["lookup_schema"]["Tables"]["scic_employee_table"]["Insert"];
export type SCICEmployeeTableUpdate =
  Database["lookup_schema"]["Tables"]["scic_employee_table"]["Update"];

export type TransactionTableRow =
  OneOfficeDatabase["transaction_schema"]["Tables"]["transaction_table"]["Row"];

export type JobTitleTableRow =
  Database["lookup_schema"]["Tables"]["employee_job_title_table"]["Row"];
export type JobTitleTableInsert =
  Database["lookup_schema"]["Tables"]["employee_job_title_table"]["Insert"];
export type JobTitleTableUpdate =
  Database["lookup_schema"]["Tables"]["employee_job_title_table"]["Update"];

export type PositionTableRow =
  Database["lookup_schema"]["Tables"]["position_table"]["Row"];
export type PositionTableInsert =
  Database["lookup_schema"]["Tables"]["position_table"]["Insert"];
export type PositionTableUpdate =
  Database["lookup_schema"]["Tables"]["position_table"]["Update"];

export type FieldCorrectResponseTableRow =
  Database["form_schema"]["Tables"]["correct_response_table"]["Row"];
export type FieldCorrectResponseTableInsert =
  Database["form_schema"]["Tables"]["correct_response_table"]["Insert"];
export type FieldCorrectResponseTableUpdate =
  Database["form_schema"]["Tables"]["correct_response_table"]["Update"];

export type HRPhoneInterviewTableRow =
  Database["hr_schema"]["Tables"]["hr_phone_interview_table"]["Row"];
export type HRPhoneInterviewTableInsert =
  Database["hr_schema"]["Tables"]["hr_phone_interview_table"]["Insert"];
export type HRPhoneInterviewTableUpdate =
  Database["hr_schema"]["Tables"]["hr_phone_interview_table"]["Update"];

export type TradeTestTableRow =
  Database["hr_schema"]["Tables"]["trade_test_table"]["Row"];
export type TradeTestTableInsert =
  Database["hr_schema"]["Tables"]["trade_test_table"]["Insert"];
export type TradeTestTableUpdate =
  Database["hr_schema"]["Tables"]["trade_test_table"]["Update"];

export type TechnicalInterviewTableRow =
  Database["hr_schema"]["Tables"]["technical_interview_table"]["Row"];
export type TechnicalInterviewTableInsert =
  Database["hr_schema"]["Tables"]["technical_interview_table"]["Insert"];
export type TechnicalInterviewTableUpdate =
  Database["hr_schema"]["Tables"]["technical_interview_table"]["Update"];

export type BackgroundCheckTableRow =
  Database["hr_schema"]["Tables"]["background_check_table"]["Row"];
export type BackgroundCheckTableInsert =
  Database["hr_schema"]["Tables"]["background_check_table"]["Insert"];
export type BackgroundCheckTableUpdate =
  Database["hr_schema"]["Tables"]["background_check_table"]["Update"];

export type JobOfferTableRow =
  Database["hr_schema"]["Tables"]["job_offer_table"]["Row"];
export type JobOfferTableInsert =
  Database["hr_schema"]["Tables"]["job_offer_table"]["Insert"];
export type JobOfferTableUpdate =
  Database["hr_schema"]["Tables"]["job_offer_table"]["Update"];

export type TeamDepartmentTableRow =
  Database["team_schema"]["Tables"]["team_department_table"]["Row"];

export type RequestViewRow = Database["public"]["Views"]["request_view"]["Row"];

export type InterviewOnlineMeetingTableRow =
  Database["hr_schema"]["Tables"]["interview_online_meeting_table"]["Row"];
export type InterviewOnlineMeetingTableInsert =
  Database["hr_schema"]["Tables"]["interview_online_meeting_table"]["Insert"];
export type InterviewOnlineMeetingTableUpdate =
  Database["hr_schema"]["Tables"]["interview_online_meeting_table"]["Update"];

export type HRProjectTableRow =
  Database["hr_schema"]["Tables"]["hr_project_table"]["Row"];
export type HRProjectTableInsert =
  Database["hr_schema"]["Tables"]["hr_project_table"]["Insert"];
export type HRProjectTableUpdate =
  Database["hr_schema"]["Tables"]["hr_project_table"]["Update"];

export type ErrorTableRow = Database["public"]["Tables"]["error_table"]["Row"];
export type ErrorTableInsert =
  Database["public"]["Tables"]["error_table"]["Insert"];
export type ErrorTableUpdate =
  Database["public"]["Tables"]["error_table"]["Update"];

export type AdOwnerTableRow =
  Database["lookup_schema"]["Tables"]["ad_owner_table"]["Row"];

export type AdOwnerRequestTableInsert =
  Database["lookup_schema"]["Tables"]["ad_owner_request_table"]["Insert"];

export type UserSSSTableRow =
  Database["user_schema"]["Tables"]["user_sss_table"]["Row"];
export type UserSSSTableInsert =
  Database["user_schema"]["Tables"]["user_sss_table"]["Insert"];
export type UserSSSTableUpdate =
  Database["user_schema"]["Tables"]["user_sss_table"]["Update"];

export type SiteTableRow =
  Database["inventory_schema"]["Tables"]["site_table"]["Row"];

export type LocationTableRow =
  Database["inventory_schema"]["Tables"]["location_table"]["Row"];

export type CategoryTableRow =
  Database["inventory_schema"]["Tables"]["category_table"]["Row"];

export type InventoryFieldRow =
  Database["inventory_schema"]["Tables"]["field_table"]["Row"];

export type InventoryCustomerRow =
  Database["inventory_schema"]["Tables"]["customer_table"]["Row"];

export type InventoryEventRow =
  Database["inventory_request_schema"]["Tables"]["inventory_event_table"]["Row"];

export type InventoryHistoryRow =
  Database["inventory_request_schema"]["Tables"]["inventory_history_table"]["Row"];

export type InventoryRequestRow =
  Database["inventory_request_schema"]["Tables"]["inventory_request_table"]["Row"];

export type EventTableRow =
  Database["inventory_schema"]["Tables"]["inventory_event_table"]["Row"];

export type InventoryRequestResponseInsert =
  Database["inventory_request_schema"]["Tables"]["inventory_custom_response_table"]["Insert"];
// End: Database Table Types

// Start: Database Enums
export type AppType = "GENERAL" | "REQUEST" | "REVIEW";
export type MemberRoleType = "OWNER" | "APPROVER" | "MEMBER" | "ADMIN";
export type AttachmentBucketType =
  | "USER_AVATARS"
  | "USER_SIGNATURES"
  | "USER_VALID_IDS"
  | "TEAM_LOGOS"
  | "COMMENT_ATTACHMENTS"
  | "REQUEST_ATTACHMENTS"
  | "MEMO_ATTACHMENTS"
  | "TEAM_PROJECT_ATTACHMENTS"
  | "TICKET_ATTACHMENTS"
  | "JOB_OFFER_ATTACHMENTS"
  | "SSS_ID_ATTACHMENTS";
export type ReceiverStatusType = "PENDING" | "APPROVED" | "REJECTED";
export type FormStatusType = ReceiverStatusType | "CANCELED";
export type TicketStatusType =
  | "PENDING"
  | "UNDER REVIEW"
  | "INCORRECT"
  | "CLOSED";
export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SWITCH"
  | "DROPDOWN"
  | "MULTISELECT"
  | "FILE"
  | "DATE"
  | "TIME"
  | "LINK"
  | "MULTIPLE CHOICE"
  | "AUTOCOMPLETE"
  | "CHECKBOX";
// | "SLIDER";
export type FieldTagType =
  | "POSITIVE_METRIC"
  | "NEGATIVE_METRIC"
  | "SUBMISSION_FORM_TITLE"
  | "SUBMISSION_FORM_DESCRIPTION"
  | "REVIEW_GENERAL_COMMENT"
  | "DUPLICATABLE_SECTION";
export type CommentType =
  | "ACTION_APPROVED"
  | "ACTION_REJECTED"
  | "REQUEST_CANCELED"
  // | "REQUEST_UNDO"
  | "REQUEST_COMMENT"
  // | "REQUEST_CREATED"
  | "REVIEW_CREATED"
  | "REVIEW_COMMENT"
  | "ACTION_REVERSED";
export type NotificationType =
  | "REQUEST"
  | "APPROVE"
  | "REJECT"
  | "INVITE"
  | "REVIEW"
  | "COMMENT"
  | "REVERSAL";
export type InvitationStatusType = "ACCEPTED" | "DECLINED" | "PENDING";
// End: Database Enums

// Start: Joined Types
export type RequestType = {
  request_id: string;
  request_date_created: string;
  request_status: FormStatusType;
  request_team_member: {
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string | null;
    };
  };
  request_form: {
    form_id: string;
    form_name: string;
    form_description: string;
  };
  request_signer: {
    request_signer_id: string;
    request_signer_status: ReceiverStatusType;
    request_signer: {
      signer_is_primary_signer: boolean;
      signer_team_member: {
        team_member_user: {
          user_id: string;
          user_first_name: string;
          user_last_name: string;
          user_avatar: string | null;
        };
      };
    };
  }[];
};

export type UserWithSignatureType = UserTableRow & {
  user_employee_number: string;
} & {
  user_signature_attachment: AttachmentTableRow;
};

export type RequestWithResponseType = RequestTableRow & {
  isWithNextStep?: boolean;
} & {
  request_formsly_id: string;
} & {
  request_form: {
    form_id: string;
    form_name: string;
    form_description: string;
    form_is_formsly_form: boolean;
    form_type?: string;
    form_sub_type?: string;
    form_section: (SectionTableRow & {
      section_field: (FieldTableRow & {
        field_section_duplicatable_id?: string;
        field_description?: string;
        field_option: OptionTableRow[];
        field_response: RequestResponseTableRow[];
        field_options?: OptionTableRow[] | null;
      })[];
    })[];
  };
} & {
  request_team_member: {
    team_member_team_id: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_username: string;
      user_avatar: string;
      user_job_title: string;
    };
  };
} & {
  request_signer: (RequestSignerTableRow & {
    request_signer_id: string;
    request_signer_status: string;
    request_signer_signer: {
      signer_id: string;
      signer_is_primary_signer: boolean;
      signer_action: string;
      signer_order: number;
      signer_team_member: {
        team_member_id: string;
        team_member_user: {
          user_id: string;
          user_first_name: string;
          user_last_name: string;
          user_job_title: string | null;
          user_signature_attachment_id: string | null;
        };
      };
    };
  })[];
} & {
  request_comment: {
    comment_id: string;
    comment_date_created: string;
    comment_content: string;
    comment_is_edited: boolean;
    comment_last_updated: string;
    comment_type: CommentType;
    comment_team_member_id: string;
    comment_team_member: {
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_username: string;
        user_avatar: string;
      };
    };
    comment_attachment: CommentAttachmentWithPublicUrl;
  }[];
} & {
  request_project: {
    team_project_name: string;
    team_project_id: string;
  };
};

export type TeamMemberType = {
  team_member_id: string;
  team_member_role: MemberRoleType;
  team_member_date_created: string;
  team_member_user: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string;
    user_email: string;
    user_employee_number: string;
  };
};

export type FormWithOwnerType = FormTableRow & {
  form_team_member: TeamMemberTableRow & {
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
  };
};

export type TeamMemberWithUserType = {
  team_member_id: string;
  team_member_role: string;
  team_member_user: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string;
  };
};

export type FormType = {
  form_id: string;
  form_name: string;
  form_description: string;
  form_date_created: string;
  form_is_hidden: boolean;
  form_is_formsly_form: boolean;
  form_is_for_every_member: boolean;
  form_type?: string;
  form_sub_type?: string;
  form_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_username: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
    team_member_team_id: string;
  };
  form_signer: {
    signer_id: string;
    signer_is_primary_signer: boolean;
    signer_action: string;
    signer_order: number;
    signer_team_member: {
      team_member_id: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
      };
    };
  }[];
  form_section: (SectionTableRow & {
    section_field: (FieldTableRow & {
      field_option: OptionTableRow[];
      field_section_duplicatable_id?: string;
      field_correct_response?: FieldCorrectResponseTableRow | null;
    })[];
  })[];
  form_team_group: {
    team_group: {
      team_group_id: string;
      team_group_is_disabled: boolean;
      team_group_name: string;
    };
  }[];
};

export type FormWithResponseType = {
  form_id: string;
  form_name: string;
  form_description: string;
  form_date_created: string;
  form_is_hidden: boolean;
  form_is_formsly_form: boolean;
  form_is_for_every_member: boolean;
  form_type?: string;
  form_sub_type?: string;
  form_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_username: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
    team_member_team_id: string;
  };
  form_signer: {
    signer_id: string;
    signer_is_primary_signer: boolean;
    signer_action: string;
    signer_order: number;
    signer_team_member: {
      team_member_id: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
      };
    };
  }[];
  form_section: (SectionTableRow & {
    section_field: (FieldTableRow & {
      field_section_duplicatable_id?: string;
      field_description?: string;
      field_option: OptionTableRow[];
      field_correct_response?: FieldCorrectResponseTableRow | null;
      field_response?: unknown;
      field_prefix?: string;
      field_is_correct?: boolean;
    })[];
  })[];
  form_team_group: {
    team_group: {
      team_group_id: string;
      team_group_is_disabled: boolean;
      team_group_name: string;
    };
  }[];
};

export type FormWithTeamMember = FormTableRow & {
  form_team_member: TeamMemberTableRow[];
};

export type ItemWithDescriptionType = ItemTableRow & {
  item_division_id_list: string[];
  item_level_three_description?: string;
} & {
  item_description: ItemDescriptionTableRow[];
};

export type ServiceWithScopeType = ServiceTableRow & {
  service_scope: ServiceScopeTableRow[];
};

export type ItemForm = {
  generalName: string;
  descriptions: {
    description: string;
    withUoM: boolean;
    descriptionId?: string;
    fieldId?: string;
    order?: number;
  }[];
  unit: string;
  isAvailable: boolean;
  glAccount: string;
  division: string[];
  divisionDescription: string;
  isPedItem: boolean;
  isITAsset: boolean;
  itemCategory: string;
};

export type ItemCategoryForm = {
  category: string;
  signer: string;
};

export type ServiceForm = {
  name: string;
  scope: { name: string; type: FieldType; isWithOther: boolean }[];
  isAvailable: boolean;
};
export type ServiceScopeChoiceForm = {
  name: string;
  isAvailable: boolean;
};

export type ServiceWithScopeAndChoice = ServiceTableRow & {
  service_scope: (ServiceScopeChoiceTableRow & {
    service_scope_choice: ServiceScopeChoiceTableRow[];
    service_field: FieldTableRow;
  })[];
};

export type ItemDescriptionFieldForm = {
  value: string;
  unitOfMeasurement: string;
  isAvailable: boolean;
};
export type SectionWithField = {
  fields: FieldWithChoices[];
} & SectionTableRow;

export type FieldWithChoices = {
  options: OptionTableRow[];
} & FieldTableRow;

export type ItemWithDescriptionAndField = ItemTableRow & {
  item_description: (ItemDescriptionTableRow & {
    item_description_field: (ItemDescriptionFieldTableRow & {
      item_description_field_uom: {
        item_description_field_uom: string | null;
      }[];
    })[];
    item_field: FieldTableRow;
  })[];
} & ItemCategoryType;

export type InvitationWithTeam = InvitationTableRow & {
  invitation_from_team_member: TeamMemberTableRow & {
    team_member_team: TeamTableRow;
  };
};

export type RequestByFormType = RequestTableRow & {
  request_form: {
    form_id: string;
    form_name: string;
    form_description: string;
    form_is_formsly_form: boolean;
    form_section: (SectionTableRow & {
      section_field: (FieldTableRow & {
        field_option: OptionTableRow[];
        field_response: (RequestResponseTableRow & {
          request_response_team_member_id?: string | null;
          request_response_request_status?: string;
        })[];
      })[];
    })[];
  };
} & {
  request_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_username: string;
      user_avatar: string;
    };
  };
};

export type RequestDashboardOverviewData = RequestTableRow & {
  request_form: {
    form_id: string;
    form_name: string;
    form_description: string;
    form_is_formsly_form: boolean;
  };
} & {
  request_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_username: string;
      user_avatar: string;
    };
  };
} & {
  request_signer: (RequestSignerTableRow & {
    request_signer_id: string;
    request_signer_status: string;
    request_signer_signer: {
      signer_id: string;
      signer_is_primary_signer: boolean;
      signer_action: string;
      signer_order: number;
      signer_team_member: {
        team_member_id: string;
        team_member_user: {
          user_first_name: string;
          user_last_name: string;
          user_avatar: string | null;
        };
      };
    };
  })[];
};

export type ConnectedFormsType = "Item" | "Invoice" | "Account Payable Voucher";

export type SearchKeywordResponseType = RequestResponseTableRow & {
  request_form: {
    request_id: string;
    request_form_id: string;
  };
} & { response_field: FieldTableRow };

export type FieldWithResponseType =
  RequestByFormType["request_form"]["form_section"][0]["section_field"];

export type ResponseDataType = {
  id: string;
  type: FieldType;
  label: string;
  optionList: string[];
  section_id?: string;
  responseList: {
    label: string;
    value: number;
    groupId?: string | null;
  }[];
};

export type LineChartDataType = {
  label: string;
  value: number;
};

export type PurchaseTrendChartDataType = {
  request_response_id: string;
  request_response: string;
  request_response_request_id: string;
  request_response_field_id: string;
  request_response_date_purchased?: string | undefined;
  request_response_team_member_id?: string | null;
  request_response_request_status?: string | null;
  request_response_item_general_name?: string;
};

export type RequestResponseDataType = {
  sectionLabel: string;
  responseData: FieldWithResponseType;
};
export type FormslyFormType = {
  Item: string[];
  Quotation: string[];
  "Receiving Inspecting Report": string[];
};

export type FormslyFormKeyType =
  | "Item"
  | "Quotation"
  | "Receiving Inspecting Report";

export type RequestSignerListType =
  RequestDashboardOverviewData["request_signer"][0]["request_signer_signer"] & {
    signerCount: {
      approved: number;
      rejected: number;
    };
  };
export type TeamGroupForFormType =
  | "Item"
  | "Quotation"
  | "Receiving Inspecting Report"
  | "Audit";

type SSOTRequestOwnerType = {
  user_first_name: string;
  user_last_name: string;
};

export type SSOTResponseType = {
  request_response: string;
  request_response_field_name: string;
  request_response_field_type: string;
  request_response_duplicatable_section_id: string;
};

export type SSOTType = {
  item_request_formsly_id: string;
  item_request_jira_id: string;
  item_request_otp_id: string;
  item_request_id: string;
  item_request_date_created: string;
  item_request_owner: SSOTRequestOwnerType;
  item_request_response: SSOTResponseType[];
  item_quotation_request: {
    quotation_request_id: string;
    quotation_request_formsly_id: string;
    quotation_request_date_created: string;
    quotation_request_owner: SSOTRequestOwnerType;
    quotation_request_response: SSOTResponseType[];
    quotation_rir_request: {
      rir_request_id: string;
      rir_request_formsly_id: string;
      rir_request_date_created: string;
      rir_request_owner: SSOTRequestOwnerType;
      rir_request_response: SSOTResponseType[];
    }[];
  }[];
  item_sourced_item_request: {
    sourced_item_request_id: string;
    sourced_item_request_formsly_id: string;
    sourced_item_request_date_created: string;
    sourced_item_request_owner: SSOTRequestOwnerType;
    sourced_item_request_response: SSOTResponseType[];
    sourced_item_ro_request: {
      ro_request_id: string;
      ro_request_formsly_id: string;
      ro_request_date_created: string;
      ro_request_owner: SSOTRequestOwnerType;
      ro_request_response: SSOTResponseType[];
      ro_transfer_receipt_request: {
        transfer_receipt_request_id: string;
        transfer_receipt_request_formsly_id: string;
        transfer_receipt_request_date_created: string;
        transfer_receipt_request_owner: SSOTRequestOwnerType;
        transfer_receipt_request_response: SSOTResponseType[];
      }[];
    }[];
  }[];
  item_cheque_reference_request: {
    cheque_reference_request_id: string;
    cheque_reference_request_formsly_id: string;
    cheque_reference_request_date_created: string;
    cheque_reference_request_response: SSOTResponseType[];
    cheque_reference_request_owner: SSOTRequestOwnerType;
  }[];
};

export type Section = SectionTableRow & {
  section_duplicatable_id?: string | null;
} & {
  section_field: (FieldTableRow & {
    field_option?: OptionTableRow[];
    field_response: RequestResponseTableRow[];
  })[];
};

// contains only 1 field_response per field
export type DuplicateSectionType = SectionTableRow & {
  section_duplicatable_id?: string | null;
} & {
  section_field: (FieldTableRow & {
    field_option?: OptionTableRow[];
    field_response: RequestResponseTableRow | null;
    field_section_duplicatable_id?: string;
  })[];
};

export type CanvassType = Record<
  string,
  {
    quotationId: string;
    price: number;
    quantity: number;
  }[]
>;
export type CanvassLowestPriceType = Record<string, number>;
export type CanvassAdditionalDetailsType = {
  quotation_id: string;
  formsly_id: string;
  lead_time: number;
  payment_terms: string;
}[];

export type RequestProjectSignerStatusType = {
  signer_project_name: string;
  signer_status: ReceiverStatusType;
  signer_team_member_id: string;
}[];

export type RequestProjectSignerType = {
  request_signer_id: string;
  request_signer_status: string;
  request_signer_request_id: string;
  request_signer_signer_id: string;
  request_signer: {
    signer_id: string;
    signer_is_primary_signer: boolean;
    signer_action: string;
    signer_order: number;
    signer_is_disabled: boolean;
    signer_form_id: string;
    signer_team_member_id: string;
    signer_team_project_id: string;
    signer_team_project: { team_project_name: string };
  };
}[];

export type requestSignerType = {
  request_signer_id: string;
  request_signer_status: string;
  request_signer: {
    signer_team_member_id: string;
    signer_is_primary_signer: boolean;
  };
};

export type RequestListItemType = {
  request_id: string;
  request_formsly_id: string;
  request_date_created: string;
  request_status: string;
  request_jira_id?: string;
  request_jira_link?: string;
  request_otp_id?: string;
  request_form_id: string;
  request_team_member_id: string;
  request_signer: requestSignerType[];
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_avatar: string | null;
  form_name: string;
  request_is_with_view_indicator: boolean;
  request_is_with_progress_indicator: boolean;
};

export type ConnectedRequestItemType = {
  request_id: string;
  request_formsly_id: string;
};

export type ConnectedRequestIdList = {
  [key: string]: ConnectedRequestItemType[];
};

export type ItemFieldsType = FieldTableRow & {
  field_option: OptionTableRow[];
} & { field_response: RequestResponseTableRow[] }[];

export type TeamMemberWithUserDetails = {
  team_member_id: string;
  team_member_user: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string | null;
    user_email: string;
  };
}[];

export type TeamMemberOnLoad = {
  member: TeamMemberTableRow & {
    team_member_user: UserTableRow & { user_employee_number: string };
  };
  userValidId: UserValidIDTableRow | undefined;
  groupList: {
    team_group_member_id: string;
    team_group: TeamGroupTableRow;
  }[];
  groupCount: number;
  projectList: {
    team_project_member_id: string;
    team_project: TeamProjectTableRow;
  }[];
  projectCount: number;
};

export type TeamOnLoad = {
  team: TeamTableRow;
  teamMembers: TeamMemberType[];
  teamGroups: TeamGroupTableRow[];
  teamProjects: TeamProjectTableRow[];
  teamGroupsCount: number;
  teamProjectsCount: number;
};

export type NotificationOnLoad = {
  notificationList: NotificationTableRow[];
  totalNotificationCount: number;
  tab: "all" | "unread";
};

export type SSOTOnLoad = {
  data: SSOTType[];
  projectNameList: string[];
  itemNameList: string[];
};

export type RequestListOnLoad = {
  requestList: RequestListItemType[];
  requestListCount: number;
  teamMemberList: TeamMemberWithUserType[];
  formList: { label: string; value: string }[];
  isFormslyTeam: boolean;
};

export type CommentAttachmentWithPublicUrl = (AttachmentTableRow & {
  attachment_public_url: string;
})[];

export type RequestCommentType =
  RequestWithResponseType["request_comment"][0] & {
    comment_attachment: CommentAttachmentWithPublicUrl;
  };

export type RequestPageOnLoad = {
  request: RequestWithResponseType;
  connectedFormIdAndGroup: {
    formId: string;
    formIsForEveryone: boolean;
    formIsMember: boolean;
    formName: string;
  };
  connectedRequestIDList: ConnectedRequestIdList;
  connectedForm: {
    form_name: string;
    form_id: string;
    form_is_for_every_member: boolean;
    form_is_member: boolean;
  }[];
  canvassRequest?: string[];
  projectSignerStatus?: RequestProjectSignerStatusType;
};

export type CreateTicketPageOnLoad = {
  member: {
    team_member_id: string;
    team_member_role: MemberRoleType;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string | null;
      user_email: string;
    };
  };
  categoryList: TicketCategoryTableRow[];
};

export type TicketRequesterUserType = {
  user_id: string;
  user_avatar: string | null;
  user_username: string;
  user_last_name: string;
  user_first_name: string;
};

export type TicketApproverUserType = {
  user_id: string;
  user_avatar: string | null;
  user_username: string;
  user_last_name: string;
  user_first_name: string;
};

export type TicketListType = ({
  ticket_id: string;
  ticket_status: "PENDING" | "UNDER REVIEW" | "INCORRECT" | "CLOSED";
  ticket_date_created: string;
  ticket_status_date_updated: string | null;
  ticket_is_disabled: boolean;
  ticket_category_id: string;
  ticket_requester_team_member_id: string;
  ticket_approver_team_member_id: string;
  ticket_category: string;
  ticket_requester_user: TicketRequesterUserType;
  ticket_approver_user: TicketApproverUserType;
} & TicketTableRow & { ticket_category: string })[];

export type TicketType = {
  ticket_category: string;
  ticket_requester: CreateTicketPageOnLoad["member"];
  ticket_approver: CreateTicketPageOnLoad["member"] | null;
  ticket_comment: {
    ticket_comment_id: string;
    ticket_comment_content: string;
    ticket_comment_is_disabled: boolean;
    ticket_comment_is_edited: boolean;
    ticket_comment_type: string;
    ticket_comment_date_created: string;
    ticket_comment_last_updated: string | null;
    ticket_comment_ticket_id: string;
    ticket_comment_team_member_id: string;
    ticket_comment_team_member: {
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_username: string;
        user_avatar: string | null;
      };
    };
    ticket_comment_attachment: CommentAttachmentWithPublicUrl;
  }[];
} & TicketTableRow;

export type TicketPageOnLoad = {
  ticket: TicketType;
  user: CreateTicketPageOnLoad["member"];
  ticketForm: CreateTicketFormValues;
};

export type TicketCommentType =
  RequestWithResponseType["request_comment"][0] & {
    comment_attachment: CommentAttachmentWithPublicUrl;
  };

export type TicketListOnLoad = {
  ticketList: TicketListType[];
  ticketListCount: number;
  ticketCategoryList: TicketCategoryTableRow[];
};

export type ApproverUnresolvedRequestCountType = {
  pendingRequestCount: number;
  approvedRequestCount: {
    total: number;
    withJiraId: number;
    withoutJiraId: number;
  };
};

export type EquipmentWithCategoryType = EquipmentTableRow & {
  equipment_category: string;
};

export type EquipmentForm = {
  name: string;
  category: string;
  isAvailable: boolean;
  shorthand: string;
};

export type EquipmentDescriptionType = EquipmentDescriptionTableRow & {
  equipment_description_property_number_with_prefix: string;
} & {
  equipment_description_brand: string;
  equipment_description_model: string;
};

export type EquipmentDescriptionForm = {
  propertyNumber: string;
  serialNumber: string;
  brand: string;
  model: string;
  acquisitionDate: Date | null;
  isAvailable: boolean;
  isRental: boolean;
};

export type EquipmentPartType = EquipmentPartTableRow & {
  equipment_part_general_name: string;
  equipment_part_brand: string;
  equipment_part_model: string;
  equipment_part_unit_of_measurement: string;
  equipment_part_component_category: string;
};

export type EquipmentPartForm = {
  name: string;
  partNumber: string;
  brand: string;
  model: string;
  uom: string;
  category: string;
  isAvailable: boolean;
};

export type FormSegmentType = "Form Preview" | "Form Details" | "Form Lookup";

export type LookupForm = {
  value: string;
  isAvailable: boolean;
};

export type EquipmentLookupChoices =
  | "equipment_category"
  | "equipment_brand"
  | "equipment_model"
  | "equipment_unit_of_measurement"
  | "equipment_component_category";

export type LookupTable = {
  id: string;
  status: boolean;
  value: string;
};

export type EquipmentLookupTableUpdate =
  | EquipmentCategoryTableUpdate
  | EquipmentBrandTableUpdate
  | EquipmentModelTableUpdate
  | EquipmentUnitOfMeasurementTableUpdate
  | EquipmentComponentCategoryTableUpdate;

export type UserIssuedItem = {
  itemName: string;
  itemUom: string;
  itemQuantity: number;
  variation: {
    quantity: number;
    specification: {
      fieldName: string;
      response: string;
    }[];
  }[];
};

export type MemoSignerItem = {
  team_member_id: string;
  team_member_user: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_job_title: string | null;
    user_avatar: string | null;
  };
  signer_signature_public_url: string;
};

export type MemoLineItem = {
  memo_line_item_content: string;
  memo_line_item_attachment?: File | Blob;
  memo_line_item_attachment_name?: string;
  memo_line_item_attachment_caption?: string;
};

export type MemoType = MemoTableRow & {
  memo_author_user: UserTableRow;
  memo_status: string;
  memo_date_updated: string;
} & {
  memo_signer_list: (MemoSignerTableRow & {
    memo_signer_team_member: {
      team_member_id: string;
      user: UserTableRow;
    };
    memo_signer_signature_public_url: string;
  })[];
} & {
  memo_line_item_list: (MemoLineItemTableRow & {
    memo_line_item_attachment?: MemoLineItemAttachmentTableRow;
  })[];
} & {
  memo_read_receipt_list: (MemoReadReceiptTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
} & {
  memo_agreement_list: (MemoAgreementTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
};

export type MemoListItemType = MemoTableRow & {
  memo_author_user: UserTableRow;
  memo_status: string;
  memo_date_updated: string;
} & { memo_signer_list: MemoType["memo_signer_list"] };

export type EditMemoType = MemoTableRow & {
  memo_author_user: UserTableRow;
  memo_status: string;
  memo_date_updated: string;
} & {
  memo_signer_list: (MemoSignerTableRow & {
    memo_signer_team_member?: {
      team_member_id: string;
      user: {
        user_first_name: string;
        user_last_name: string;
        user_avatar: string | null;
        user_job_title: string | null;
        user_id: string;
      };
    };
    memo_signer_signature_public_url: string;
  })[];
} & {
  memo_line_item_list: (MemoLineItemTableRow & {
    memo_line_item_attachment?: MemoLineItemAttachmentTableRow & {
      memo_line_item_attachment_file?: File;
    };
  })[];
} & {
  memo_read_receipt_list: (MemoReadReceiptTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
} & {
  memo_agreement_list: (MemoAgreementTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
};

export type ReferenceMemoType = MemoTableRow & {
  memo_author_user: UserTableRow;
} & {
  memo_signer_list: (MemoSignerTableRow & {
    memo_signer_team_member?: {
      team_member_id: string;
      user: {
        user_first_name: string;
        user_last_name: string;
        user_avatar: string | null;
        user_job_title: string | null;
        user_id: string;
      };
    };
    memo_signer_signature_public_url: string;
  })[];
} & {
  memo_line_item_list: (MemoLineItemTableRow & {
    memo_line_item_attachment?: MemoLineItemAttachmentTableRow & {
      memo_line_item_attachment_file?: File;
    };
  })[];
} & {
  memo_read_receipt_list: (MemoReadReceiptTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
} & {
  memo_agreement_list: (MemoAgreementTableRow & {
    user_avatar: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_employee_number: string;
  })[];
};

export type OtherExpensesTypeWithCategoryType = OtherExpensesTypeTableRow & {
  other_expenses_category: string;
};

export type UserValidIdWithUser = Omit<
  UserValidIDTableRow,
  | "user_valid_id_user_id"
  | "user_valid_id_approver_user_id"
  | "user_valid_id_address_id"
> & {
  user_valid_id_user: UserTableRow;
  user_valid_id_approver_user: UserTableRow;
  user_valid_id_address: AddressTableRow;
};

export type TeamProjectWithAddressType = TeamProjectTableRow & {
  team_project_address: AddressTableRow;
};

export type OptionType = {
  label: string;
  value: string;
};

export type SignerRequestSLA = {
  request_id: string;
  request_date_created: string;
  formsly_id: string;
  request_signer_status_date_updated: string;
  time_difference: string;
  status: string;
};

export type SignerWithProfile = SignerTableRow & {
  signer_team_member: {
    team_member_user: UserTableRow;
  } & TeamMemberTableRow;
};

export type FormSLAWithForm = {
  form_table: FormTableRow;
} & FormSLATableRow;

export type TicketSection = TicketSectionTableRow & {
  field_section_duplicatable_id?: string;
  ticket_section_fields: (TicketFieldTableRow & {
    ticket_field_option: string[] | { label: string; value: string }[];
    ticket_field_response?: unknown;
    ticket_field_response_referrence?: unknown;
    ticket_field_response_id?: string;
    ticket_field_hidden?: boolean;
  })[];
};

export type CreateTicketFormValues = {
  ticket_sections: TicketSection[];
};

export type TeamMemberWithUser = TeamMemberTableRow & {
  team_member_user: UserTableRow;
};

export type IncidentReport = {
  interval: string;
  data: { date: string; report_count: number }[];
};

export type ItemDescriptionFieldWithUoM = {
  item_description_field_uom: { item_description_field_uom: string }[];
} & ItemDescriptionFieldTableRow;

export type RequestListItemSignerType = {
  request_signer_id: string;
  request_signer_status: string;
  request_signer: {
    signer_team_member_id: string;
    signer_is_primary_signer: boolean;
  };
  signer_team_member_user: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string;
  };
};

export type ApproverDetailsType = {
  name: string;
  jobDescription: string | null;
  status: string;
  date: string | null;
  signature: string | null;
};

export type JiraFormslyProjectType = {
  team_project_id: string;
  team_project_name: string;
  assigned_jira_project: {
    jira_formsly_project_id: string;
    formsly_project_id: string;
    jira_project_id: string;
    jira_project: JiraProjectTableRow | null;
  } | null;
  assigned_jira_organization: {
    jira_organization_team_project_id: string;
    jira_organization_team_project_project_id: string;
    jira_organization_team_project_organization_id: string;
    jira_organization_team_project_organization: JiraOrganizationTableRow | null;
  } | null;
};

export type ProjectJiraUserAccountType = JiraProjectUserTableRow &
  JiraUserAccountTableRow &
  JiraUserRoleTableRow;

export type JiraItemUserTableData = {
  jira_item_user_id: string;
  jira_item_user_item_category_id: string;
  jira_item_user_account_id: {
    jira_user_account_jira_id: string;
    jira_user_account_display_name: string;
    jira_user_account_id: string;
  };
  jira_item_user_role_id: {
    jira_user_role_id: string;
    jira_user_role_label: string;
  };
};

export type JiraFormslyItemCategoryWithUserDataType =
  JiraItemCategoryTableRow & {
    assigned_jira_user: {
      jira_item_user_id: string;
      jira_item_user_account_id: {
        jira_user_account_jira_id: string;
        jira_user_account_display_name: string;
        jira_user_account_id: string;
      };
      jira_item_user_role_id: {
        jira_user_role_id: string;
        jira_user_role_label: string;
      };
      jira_user_account_jira_id: string;
      jira_user_account_display_name: string;
      jira_user_account_id: string;
      jira_user_role_id: string;
      jira_user_role_label: string;
    } | null;
  };

export type JiraUserDataType = {
  jira_user_account_jira_id: string;
  jira_user_account_display_name: string;
  jira_user_role_label: string;
};

export type JiraProjectDataType = {
  jira_project_jira_id: string;
  jira_project_jira_label: string;
  jira_user_list: JiraUserDataType[];
};

export type JiraItemCategoryDataType = {
  jira_item_category_id: string;
  jira_item_category_jira_id: string;
  jira_item_category_jira_label: string;
  jira_item_category_formsly_label: string;
} & JiraUserDataType;

export type JiraTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  requestFormType: string;
  requestTypeId: string;
  jiraProjectSiteId: string;
  jiraItemCategoryId: string;
  warehouseCorporateLeadId: string;
  warehouseAreaLeadId: string;
  warehouseRepresentativeId: string;
  warehouseRequestParticipantIdList: string[];
  jiraItemCategoryLabel?: string;
  jiraOrganizationId: string;
};

export type JiraITAssetTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  requestTypeId: string;
  jiraProjectSiteId: string;
  assignee: {
    employeeId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
  };
  purpose: string;
  item: string;
  requestFormType: string;
};

export type JiraTicketData = { jiraTicketId: string; jiraTicketLink: string };

export type ItemCategoryWithSigner = ItemCategoryTableRow & {
  item_category_signer: {
    signer_id: string;
    signer_team_member: {
      team_member_id: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
      };
    };
  };
};

export type ItemCategoryType = {
  item_category: {
    item_category_signer: {
      signer_id: string;
      signer_is_primary_signer: boolean;
      signer_action: string;
      signer_order: number;
      signer_team_member: {
        team_member_id: string;
        team_member_user: {
          user_id: string;
          user_first_name: string;
          user_last_name: string;
          user_avatar: string;
        };
      };
    };
  };
};

export type InitialFormType = FormTableRow & {
  form_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
      user_username: string;
    };
  };
} & {
  form_team_group: {
    team_group: {
      team_group_id: string;
      team_group_name: string;
      team_group_is_disabled: boolean;
    };
  }[];
} & {
  form_signer: (SignerTableRow & {
    signer_team_member: {
      team_member_id: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
        user_username: string;
      };
    };
  })[];
};

export type ITAssetForm = {
  generalName: string;
  descriptions: {
    description: string;
    withUoM: boolean;
    descriptionId?: string;
    fieldId?: string;
    order?: number;
  }[];
  unit: string;
  isAvailable: boolean;
  glAccount: string;
  division: string[];
  divisionDescription: string;
  isITAsset: boolean;
  itemCategory: string;
};

export type FetchRequestListParams = {
  teamId: string;
  page: number;
  limit: number;
  teamMemberId?: string;
  columnAccessor?: string;
} & RequestListFilterValues;

export type RequestListFilterValues = {
  search?: string;
  requestor?: string[];
  approver?: string[];
  form?: string[];
  project?: string[];
  status?: FormStatusType[];
  isAscendingSort: boolean;
  isApproversView: boolean;
};

export type TeamInviteJwtPayload = {
  teamId: string;
  invitedEmail: string;
};

export type JiraPayloadType = {
  form: {
    answers: {
      [key: string]: {
        choices?: (string | null)[];
        text?: string;
        users?: string[];
        date?: string;
      };
    };
  };
  isAdfRequest: boolean;
  requestFieldValues: { [key: string]: string };
  requestTypeId: string;
  serviceDeskId: string;
  requestParticipants: string[];
  raiseOnBehalfOf?: string;
};

export type JiraFormFieldChoice = {
  id: string;
  name: string;
};

export type JiraLRFTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  jiraProjectSiteId: string;
  department: string;
  purpose: string;
  typeOfRequest: string;
  requestFormType: string;
  workingAdvances: string;
  ticketId: string;
  requestor: string;
  amount: number;
};

export type ConnectedRequestFormProps = {
  request_id: string;
  request_form_id: string;
  request_project_id: string;
  form_section: string[];
  duplicatableSectionIdList: string[];
};

export type JiraPTRFTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  typeOfTransfer: string;
  mannerOfTransfer: string;
  department: string;
  projectNameFrom: string;
  projectNameTo: string;
  purpose: string;
  withITAsset: boolean;
};

export type JiraWAVTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  requestor: string;
  jiraProjectSiteId: string;
  amount: string;
  department: string;
  isForOfficialBusiness: boolean;
  isChargedToProject: boolean;
  approvedOfficialBusiness?: string;
  particulars: string;
};

export type JiraESRTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  jiraProjectSiteId: string;
  requestorName: string;
  department: string;
  workcode: string;
  propertyNumber: string;
};

export type JiraRFPTicketPayloadProps = {
  requestId: string;
  requestUrl: string;
  jiraProjectSiteId: string;
  department: string;
  purpose: string;
  urgency: string;
  chargeTo: string;
  payeeType: string;
  departmentCode?: string;
  costCode?: string;
  boqCode?: string;
  obTicket?: string;
};

export type DepartmentSigner = SignerTableRow & {
  team_member_user: TeamMemberWithUser["team_member_user"];
} & { team_department_name: string };

export type PendingInviteType = {
  invitation_id: string;
  invitation_to_email: string;
  invitation_date_created: string;
  team_member: {
    team_member_team_id: string;
  };
};

export type SchemaType =
  | "public"
  | "history_schema"
  | "other_expenses_schema"
  | "user_schema";

export type LRFSpreadsheetData = {
  request_id: string;
  request_formsly_id_prefix: string;
  request_formsly_id_serial: string;
  request_date_created: string;
  request_status_date_updated: string;
  request_jira_id?: string;
  form_id: string;
  form_name: string;
  request_response_list: {
    request_response: string;
    request_response_field_id: string;
    request_response_request_id: string;
    request_response_duplicatable_section_id: string | null;
    field_name: string;
  }[];
  request_boq_data?: {
    request_id: string;
    request_formsly_id: string;
  };
  request_department_code: string;
  jira_project_jira_label: string;
};

export type ApplicationInformationSpreadsheetData = {
  request_id: string;
  request_formsly_id: string;
  request_date_created: string;
  request_status: string;
  request_status_date_updated: string;
  request_score_value: string;
  request_response_list: (RequestResponseTableRow & { field_id: string })[];
  request_signer_list: RequestListItemSignerType[];
  request_ad_owner: string;
};

export type SectionWithFieldType = SectionTableRow & {
  section_field: FieldTableRow[];
};

export type ApplicationInformationFieldType = FieldTableRow & {
  field_section: SectionTableRow;
} & { field_response: string };

export type ApplicationInformationFieldObjectType = Record<
  string,
  FieldTableRow & {
    field_section: SectionTableRow;
  }
>;

export type ApplicationInformationFieldOptionType = {
  field_option: OptionTableRow[];
  field_name: string;
};

export type ApplicationInformationFilterFormValues = {
  limit?: number;
  page?: number;
  sort?: {
    field: string;
    order: string;
    dataType: string;
  };
  requestFilter?: {
    requestId?: string;
    dateCreatedRange?: {
      start?: string;
      end?: string;
    };
    status?: string[];
    dateUpdatedRange?: { start?: string; end?: string };
    approver?: string[];
    requestScoreRange?: {
      start?: number;
      end?: number;
    };
  };
  responseFilter?: {
    seniority?: string;
    position?: string[];
    certification?: boolean;
    license?: boolean;
    source?: string[];
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    ageRange?: {
      start?: number;
      end?: number;
    };
    civilStatus?: string[];
    contactNumber?: string;
    emailAddress?: string;
    region?: string;
    province?: string;
    city?: string;
    barangay?: string;
    street?: string;
    zipCode?: string;
    sssId?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    tin?: string;
    highestEducationalAttainment?: string[];
    degree?: string;
    torOrDiplomaAttachment?: boolean;
    school?: string;
    yearGraduated?: {
      start?: number;
      end?: number;
    };
    employmentStatus?: string;
    workedAtStaClara?: boolean;
    shiftWillingToWork?: boolean;
    willingToBeAssignedAnywhere?: boolean;
    regionWillingToBeAssigned?: string[];
    soonestJoiningDate?: {
      start?: number;
      end?: number;
    };
    workExperience?: {
      start?: number;
      end?: number;
    };
    expectedSalary?: {
      start?: number;
      end?: number;
    };
  };
};

export type UserRequestListFilterValues = {
  search?: string;
  status?: FormStatusType[];
  form?: string[];
  isAscendingSort: boolean;
};

export type UserRequestListItemType = {
  request_id: string;
  request_formsly_id: string;
  request_date_created: string;
  request_status: string;
  request_form_id: string;
  request_signer: requestSignerType[];
  form_name: string;
};

export type FetchUserRequestListParams = {
  page: number;
  limit: number;
  columnAccessor?: string;
  search?: string;
  status?: FormStatusType[];
  isAscendingSort: boolean;
  email: string;
  form?: string[];
};

export type HRSpreadsheetGeneralData = {
  hr_request_reference_id: string;
  position: string;
  application_information_request_id: string;
  application_information_score: number;
  general_assessment_request_id: string;
  general_assessment_score: number;
  technical_assessment_request_id: string;
  technical_assessment_score: number;
  application_information_full_name: string;
  application_information_contact_number: string;
  application_information_email: string;
  assigned_hr: string;
  assigned_hr_team_member_id: string;
};

export type HRSpreadsheetGeneralFilterFormValues = {
  limit?: number;
  page?: number;
  sort?: {
    sortBy: string;
    order: string;
  };
  position?: string;
  application_information_request_id?: string;
  application_information_score?: {
    start?: number;
    end?: number;
  };
  general_assessment_request_id?: string;
  general_assessment_score?: {
    start?: number;
    end?: number;
  };
  technical_assessment_request_id?: string;
  technical_assessment_score?: {
    start?: number;
    end?: number;
  };
  assigned_hr?: string;
};

export type HRPhoneInterviewSpreadsheetData = HRSpreadsheetGeneralData & {
  hr_phone_interview_id: string;
  hr_phone_interview_date_created: string;
  hr_phone_interview_status: string;
  hr_phone_interview_schedule: string;
};

export type HRPhoneInterviewFilterFormValues =
  HRSpreadsheetGeneralFilterFormValues & {
    hr_phone_interview_date_created?: {
      start?: string;
      end?: string;
    };
    hr_phone_interview_status?: string;
    hr_phone_interview_schedule?: {
      start?: string;
      end?: string;
    };
  };

export type TradeTestSpreadsheetData = HRSpreadsheetGeneralData & {
  trade_test_id: string;
  trade_test_date_created: string;
  trade_test_status: string;
  trade_test_schedule: string;
  meeting_link: string;
};

export type TradeTestFilterFormValues = HRSpreadsheetGeneralFilterFormValues & {
  trade_test_date_created?: {
    start?: string;
    end?: string;
  };
  trade_test_status?: string;
  trade_test_schedule?: {
    start?: string;
    end?: string;
  };
};

export type TechnicalInterviewSpreadsheetData = HRSpreadsheetGeneralData & {
  technical_interview_id: string;
  technical_interview_date_created: string;
  technical_interview_status: string;
  technical_interview_schedule: string;
  meeting_link: string;
};

export type TechnicalInterviewFilterFormValues =
  HRSpreadsheetGeneralFilterFormValues & {
    technical_interview_date_created?: {
      start?: string;
      end?: string;
    };
    technical_interview_status?: string;
    technical_interview_schedule?: {
      start?: string;
      end?: string;
    };
  };

export type BackgroundCheckSpreadsheetData = HRSpreadsheetGeneralData & {
  background_check_id: string;
  background_check_date_created: string;
  background_check_status: string;
  application_information_nickname: string;
};

export type BackgroundCheckFilterFormValues =
  HRSpreadsheetGeneralFilterFormValues & {
    background_check_date_created?: {
      start?: string;
      end?: string;
    };
    background_check_status?: string;
  };

export type JobOfferSpreadsheetData = HRSpreadsheetGeneralData & {
  job_offer_id: string;
  job_offer_date_created: string;
  job_offer_status: string;
  job_offer_project_assignment: string;
  job_offer_attachment: AttachmentTableRow | null;
};

export type JobOfferFilterFormValues = HRSpreadsheetGeneralFilterFormValues & {
  job_offer_date_created?: {
    start?: string;
    end?: string;
  };
  job_offer_status?: string;
};

export type JobOfferHistoryType = JobOfferTableRow & {
  job_offer_attachment: AttachmentTableRow | null;
  job_offer_reason_for_rejection: string | null;
  job_offer_team_member: {
    team_member_id: string;
    team_member_full_name: string;
  };
};
export type MeetingDetails = {
  breakDuration: number;
  duration: number;
};

export type MeetingType =
  | "hr_phone_interview"
  | "trade_test"
  | "technical_interview";

export type HRProjectType = HRProjectTableRow & {
  hr_project_address: AddressTableRow;
};

export type JobOfferFormType = {
  title: string;
  projectAssignment: string;
  projectAddress: string;
  projectLongitude?: string;
  projectLatitude?: string;
  manpowerLoadingId: string;
  manpowerLoadingReferenceCreatedBy: string;
  compensation: string;
  attachment: File | null;
};

export type TechnicalAssessmentFilterValues = {
  search?: string;
  creator?: string;
  isAscendingSort: boolean;
};

export type TechnicalAssessmentTableRow = {
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_is_disabled: boolean;
  questionnaire_date_created: string | null;
  questionnaire_date_updated: string | null;
  questionnaire_team_id: string;
  questionnaire_created_by: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string;
  };
  questionnaire_updated_by: {
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_avatar: string;
  } | null;
};

export type ApiKeyData = {
  team_key_api_key: string;
  team_key_label: string;
};

export type HRAnalyticsResponseType = {
  request_response: string;
  count: number;
};

export type HRAnalyticsData = {
  candidate_referral_source: HRAnalyticsResponseType[];
  most_applied_position: HRAnalyticsResponseType[];
  applicant_age_bracket: HRAnalyticsResponseType[];
};

export type QuestionOption = {
  option_id: string;
  option_value: string | null;
  option_order: number;
  option_field_id: string;
};
export type QuestionFields = {
  field_name: string;
  field_id: string;
  field_response: string;
  field_is_required: boolean;
  field_type: string;
  field_position_type: string;
  field_options: {
    field_id: string;
    field_name: string;
    field_response: string;
    field_is_correct: boolean;
  }[];
};

export type QuestionnaireData = {
  questionnaire_name: string;
  questionnaire_date_created: string;
  fields: QuestionFields[];
};

export type TechnicalQuestionFormValues = {
  sections: {
    field_id: string;
    field_name: string;
    question: string;
    section_is_duplicatable: boolean;
    choices: {
      field_id: string;
      field_name: string;
      choice: string;
      isCorrectAnswer: boolean;
    }[];
  }[];
  positions?: string[];
};

export type DatasetChartResponse = {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
};

export type Dataset = {
  dates: string[];
  pending_counts: string[];
  approved_counts: string[];
  rejected_counts: string[];
  qualified_counts: string[];
  for_pooling_counts: string[];
  waiting_for_schedule_counts: string[];
  waiting_for_offer_counts: string[];
  not_qualified_counts: string[];
  not_responsive_counts: string[];
  accepted_counts: string[];
  cancelled_counts: string[];
  missed_counts: string[];
};

export type UnformattedRequestListItemRequestSigner = {
  request_signer_id: string;
  request_signer_status: string;
  signer_team_member_id: string;
  signer_is_primary_signer: boolean;
};

export type InventoryFormResponseType = {
  form_id: string;
  form_name: string;
  form_description: string;
  form_date_created: string;
  form_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_username: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
    team_member_team_id: string;
  };
  form_section: (SectionTableRow & {
    section_field: (FieldTableRow & {
      field_section_duplicatable_id?: string;
      field_description?: string;
      field_option: OptionTableRow[];
      field_response?: unknown;
      field_date_order?: number;
      field_prefix?: string;
      field_is_sub_category?: boolean;
      field_is_custom_field?: boolean;
    })[];
  })[];
  form_team_group: {
    team_group: {
      team_group_id: string;
      team_group_is_disabled: boolean;
      team_group_name: string;
    };
  }[];
};

export type InventoryFormType = {
  form_id: string;
  form_name: string;
  form_description: string;
  form_date_created: string;
  form_team_member: {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_username: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
    team_member_team_id: string;
  };
  form_section: (SectionTableRow & {
    section_field: (FieldTableRow & {
      field_option: OptionTableRow[];
      field_section_duplicatable_id?: string;
      field_response?: string;
      field_correct_response?: FieldCorrectResponseTableRow | null;
    })[];
  })[];
  form_team_group: {
    team_group: {
      team_group_id: string;
      team_group_is_disabled: boolean;
      team_group_name: string;
    };
  }[];
};

export type SubCategory = {
  category_name: string;
  sub_category_id: string;
  sub_category_name: string;
};

export type SubCategoryData = {
  data: SubCategory[];
  totalCount: number;
};

export type InventoryListType = InventoryRequestRow & {
  site_name?: string;
  customer_name?: string;
  inventory_request_status_color: string;
  inventory_request_due_date: string;
  request_creator_team_member_id?: string;
  request_creator_user_id?: string;
  request_creator_first_name?: string;
  request_creator_last_name?: string;
  request_creator_avatar?: string;
  assignee_team_member_id?: string;
  assignee_user_id?: string;
  assignee_first_name?: string;
  assignee_last_name?: string;
};

export type InventoryAssetFormValues = {
  site_id?: string;
  location_name?: string;
  category_name?: string;
  category_id?: string;
  sub_category?: string;
  department_name?: string;
  site_name?: string;
  site_description?: string;
};

export type InventoryResponseValues = {
  result_id: string;
  result_name: string;
  result_category_name: string;
  result_description: string;
  result_site_id: string;
  result_team_id: string;
};

export type InventoryHistory = {
  inventory_history_id: string;
  inventory_history_date_created: string;
  inventory_history_event: string;
  inventory_history_changed_from: string;
  inventory_history_changed_to: string;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  team_member_id: string;
};

export type updateTypeDate = {
  type_name: string;
  type_description?: string;
};

export type SecurityGroupData = permissionsFormValues & {
  asset: {
    permissions: { key: string; value: boolean }[];
    filter: {
      site: string[];
      department: string[];
      category: string[];
      event: string[];
    };
  };
};

export type securityGroupsFormValues = {
  viewOnly: boolean;
  addAssets: boolean;
  editAssets: boolean;
  deleteAssets: boolean;
  site: string[];
  department: string[];
  category: string[];
  event: string[];
};
export type permissions = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
};
export type permissionsFormValues = {
  privileges: {
    site: permissions;
    location: permissions;
    category: permissions;
    subCategory: permissions;
    department: permissions;
    customField: permissions;
  };
};

export type customFieldFormValues = {
  fieldId?: string;
  fieldName: string;
  fieldType: string;
  fieldIsRequired: boolean;
  fieldOption: string[];
  fieldCategory: string[];
};

export type eventFormField = {
  field_name: string;
  field_type: string;
  field_label: string;
  field_is_required: boolean;
  field_is_included: boolean;
};

export type eventFormDetails = {
  eventName: string;
  eventColor: string;
  eventStatus: string;
  eventDescription: string;
  enableEvent: boolean;
};

export type eventFormAssignedTo = {
  assignToPerson: boolean;
  assignToCustomer: boolean;
  assignToSite: boolean;
};

export type createEventFormvalues = {
  event: eventFormDetails;
  fields: eventFormField[];
  assignedTo: eventFormAssignedTo;
};

export type InventoryDynamicRow = {
  event_id: string;
  event_name: string;
  event_date_created: string;
  event_signature: string;
  event_notes: string;
  [key: string]: string;
};

export type InventoryLocationSiteRow = LocationTableRow & {
  site_name: string;
};

export type InventoryEmployeeList = SCICEmployeeTableRow & {
  site_name: string;
  location_name: string;
  team_department_name: string;
};
