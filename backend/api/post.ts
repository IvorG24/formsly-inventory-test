import { InventoryFormValues } from "@/components/AssetInventory/EventFormModal";
import { RequestFormValues } from "@/components/CreateRequestPage/CreateRequestPage";
import { FormBuilderData } from "@/components/FormBuilder/FormBuilder";
import { TeamMemberType as GroupTeamMemberType } from "@/components/TeamPage/TeamGroup/TeamGroups/GroupMembers";
import { TeamMemberType as ProjectTeamMemberType } from "@/components/TeamPage/TeamProject/ProjectMembers";
import {
  APP_SOURCE_ID,
  BASE_URL,
  formatDate,
  formslyPremadeFormsData,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  capitalizeFirstWord,
  editImageWithUUID,
  extractInventoryData,
  formatJiraItemUserTableData,
  shortId,
} from "@/utils/functions";
import {
  escapeQuotes,
  escapeQuotesForObject,
  getFileType,
} from "@/utils/string";
import {
  AddressTableInsert,
  AdOwnerRequestTableInsert,
  AttachmentBucketType,
  AttachmentTableInsert,
  CommentTableInsert,
  CreatePracticalTestFormType,
  createEventFormvalues,
  CreateTicketFormValues,
  customFieldFormValues,
  EquipmentDescriptionTableInsert,
  EquipmentPartTableInsert,
  EquipmentTableInsert,
  ErrorTableInsert,
  FieldCorrectResponseTableInsert,
  FieldTableInsert,
  FormTableRow,
  FormType,
  InterviewOnlineMeetingTableInsert,
  InterviewOnlineMeetingTableRow,
  InventoryAssetFormValues,
  InventoryCustomerRow,
  InventoryEmployeeList,
  InventoryFieldRow,
  InventoryListType,
  InventoryRequestResponseInsert,
  InventoryRequestRow,
  InventoryResponseValues,
  InvitationTableRow,
  ItemDescriptionFieldTableInsert,
  ItemDescriptionFieldUOMTableInsert,
  ItemDescriptionTableUpdate,
  ItemForm,
  ItemTableInsert,
  JiraFormslyItemCategoryWithUserDataType,
  JiraItemCategoryTableInsert,
  JiraItemCategoryUserTableInsert,
  JiraItemUserTableData,
  JiraOrganizationTableInsert,
  JiraProjectTableInsert,
  JiraUserAccountTableInsert,
  JobTitleTableInsert,
  MemoAgreementTableRow,
  MemoLineItem,
  MemoTableRow,
  NotificationTableInsert,
  OtherExpensesTypeTableInsert,
  permissionsFormValues,
  QuestionOption,
  ReferenceMemoType,
  RequestResponseTableInsert,
  RequestSignerTableInsert,
  RequestTableRow,
  SCICEmployeeTableInsert,
  SCICEmployeeTableUpdate,
  securityGroupsFormValues,
  ServiceForm,
  ServiceScopeChoiceTableInsert,
  ServiceTableInsert,
  SignerTableInsert,
  SupplierTableInsert,
  TeamGroupTableInsert,
  TeamMemberTableInsert,
  TeamProjectWithAddressType,
  TeamTableInsert,
  TechnicalAssessmentTableRow,
  TechnicalQuestionFormValues,
  TicketCommentTableInsert,
  TicketResponseTableInsert,
  TicketTableRow,
  UserSSSTableInsert,
  UserTableInsert,
  UserTableRow,
  UserValidIDTableInsert,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";
import Compressor from "compressorjs";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { getCurrentDate } from "./get";
import { getAssetId } from "./get";

// Upload Image
export const uploadImage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    image: Blob | File;
    bucket: AttachmentBucketType;
    fileType: string;
    userId: string;
    sssId?: string;
    applicationInformationFormslyId?: string;
  }
) => {
  const {
    image,
    bucket,
    fileType,
    userId,
    sssId,
    applicationInformationFormslyId,
  } = params;

  const { data: uploadData, error: uploadDataError } = await supabaseClient
    .rpc("get_storage_upload_details", {
      input_data: {
        userId,
        sssId,
        applicationInformationFormslyId,
      },
    })
    .select("*");
  if (uploadDataError) throw uploadDataError;
  const { sssIDNumber, currentDate } = uploadData as unknown as {
    sssIDNumber: string;
    currentDate: string;
  };

  // compress image
  const compressedImage: Blob = await new Promise((resolve) => {
    new Compressor(image, {
      quality: 0.6,
      success(result) {
        resolve(result);
      },
      error(error) {
        throw error;
      },
    });
  });

  const formattedFileName = `${formatDate(
    new Date(currentDate)
  )}-${sssIDNumber}-${fileType}-${shortId()}.${image.name.split(".").pop()}`;

  // upload image
  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(formattedFileName, compressedImage, { upsert: true });
  if (uploadError) throw uploadError;

  // get public url
  const { data } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(formattedFileName);

  return {
    fileName: formattedFileName,
    publicUrl: data.publicUrl,
  };
};

// Upload File
export const uploadFile = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    file: Blob | File;
    bucket: AttachmentBucketType;
    fileType: string;
    userId: string;
    sssId?: string;
    applicationInformationFormslyId?: string;
  }
) => {
  const {
    file,
    bucket,
    fileType,
    userId,
    sssId,
    applicationInformationFormslyId,
  } = params;

  const { data: uploadData, error: uploadDataError } = await supabaseClient
    .rpc("get_storage_upload_details", {
      input_data: {
        userId,
        sssId,
        applicationInformationFormslyId,
      },
    })
    .select("*");
  if (uploadDataError) throw uploadDataError;
  const { sssIDNumber, currentDate } = uploadData as unknown as {
    sssIDNumber: string;
    currentDate: string;
  };

  const formattedFileName = `${formatDate(
    new Date(currentDate)
  )}-${sssIDNumber}-${fileType}-${shortId()}.${file.name.split(".").pop()}`;

  // upload file
  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(formattedFileName, file, { upsert: true });
  if (uploadError) throw uploadError;

  // get public url
  const { data } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(formattedFileName);

  return {
    fileName: formattedFileName,
    publicUrl: data.publicUrl,
  };
};

// Create User
export const createUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: UserTableInsert & { user_employee_number: string }
) => {
  const { user_phone_number } = params;

  const { data, error } = await supabaseClient
    .rpc("create_user", {
      input_data: {
        ...params,
        user_phone_number: user_phone_number || "",
      },
    })
    .select()
    .single();
  if (error) throw error;

  return data as UserTableRow;
};

// Create Team
export const createTeam = async (
  supabaseClient: SupabaseClient<Database>,
  params: TeamTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_table")
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Create Team Member
export const createTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: TeamMemberTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .insert(params)
    .select();
  if (error) throw error;
  return data;
};

// Create Team Member with team name
export const createTeamMemberReturnTeamName = async (
  supabaseClient: SupabaseClient<Database>,
  params: TeamMemberTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .insert(params)
    .select("*, team:team_table(team_name)");
  if (error) throw error;
  return data as unknown as [
    {
      team: { team_name: string };
    } & TeamMemberTableInsert,
  ];
};

// Create Team Invitation/s
export const createTeamInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    emailList: string[];
    teamMemberId: string;
    teamName: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("create_team_invitation", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as InvitationTableRow[];
};

// Sign Up User
export const signUpUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: { email: string; password: string }
) => {
  const { data, error } = await supabaseClient.auth.signUp({
    ...params,
  });
  if (error) throw error;

  if (data.user && data.user.identities && data.user.identities?.length > 0) {
    return { data, error: null };
  } else {
    return { data, error: "Email already registered." };
  }
};

// Sign In User
export const signInUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: { email: string; password: string }
) => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      ...params,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: `${e}` };
  }
};

// Email verification
export const checkIfEmailExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("user_schema")
    .from("user_table")
    .select("user_email")
    .eq("user_email", params.email);
  if (error) throw error;
  return data.length > 0;
};

// Send Reset Password Email
export const sendResetPasswordEmail = async (
  supabaseClient: SupabaseClient<Database>,
  email: string
) => {
  await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE_URL}/reset-password`,
  });
};

// Reset Password
export const resetPassword = async (
  supabaseClient: SupabaseClient<Database>,
  password: string
) => {
  const { error } = await supabaseClient.auth.updateUser({ password });
  return { error: error };
};

export const createAttachment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    attachmentData: AttachmentTableInsert;
    file: File;
    fileType: string;
    userId: string;
    applicationInformationFormslyId?: string;
  }
) => {
  const {
    file,
    attachmentData,
    fileType,
    userId,
    applicationInformationFormslyId,
  } = params;

  let attachmentValue;
  if (file["type"].split("/")[0] === "image") {
    attachmentValue = await uploadImage(supabaseClient, {
      image: file,
      bucket: attachmentData.attachment_bucket as AttachmentBucketType,
      fileType,
      userId,
      applicationInformationFormslyId,
    });
  } else {
    attachmentValue = await uploadFile(supabaseClient, {
      file: file,
      bucket: attachmentData.attachment_bucket as AttachmentBucketType,
      fileType,
      userId,
      applicationInformationFormslyId,
    });
  }

  const { data, error } = await supabaseClient
    .from("attachment_table")
    .upsert({ ...attachmentData, attachment_value: attachmentValue.fileName })
    .select()
    .single();
  if (error) throw error;

  return { data, url: attachmentValue.publicUrl };
};

// Create notification
export const createNotification = async (
  supabaseClient: SupabaseClient<Database>,
  params: NotificationTableInsert
) => {
  const { error } = await supabaseClient
    .from("notification_table")
    .insert(params);
  if (error) throw error;
};

// Create comment
export const createComment = async (
  supabaseClient: SupabaseClient<Database>,
  params: CommentTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("comment_table")
    .insert(params)
    .select("*")
    .single();
  if (error) throw error;

  return { data, error };
};

// Create item
export const createItem = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemData: ItemTableInsert & {
      item_division_id_list: string[];
      item_level_three_description?: string;
    };
    itemDescription: {
      description: string;
      withUoM: boolean;
      order: number;
    }[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("create_item", { input_data: params })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update item
export const updateItem = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemData: ItemTableInsert & {
      item_division_id_list: string[];
      item_level_three_description?: string;
    };
    toAdd: ItemForm["descriptions"];
    toUpdate: ItemDescriptionTableUpdate[];
    toRemove: { fieldId: string; descriptionId: string }[];
    formId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("update_item", { input_data: params })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Create item description field
export const createItemDescriptionField = async (
  supabaseClient: SupabaseClient<Database>,
  params: (ItemDescriptionFieldTableInsert & {
    item_description_field_uom: string | null;
  })[]
) => {
  const itemDescriptionFieldUomInput: ItemDescriptionFieldUOMTableInsert[] = [];
  const itemDescriptionFieldInput = params.map((field) => {
    const fieldId = uuidv4();
    if (field.item_description_field_uom) {
      itemDescriptionFieldUomInput.push({
        item_description_field_uom_item_description_field_id: fieldId,
        item_description_field_uom: field.item_description_field_uom,
      });
    }
    return {
      item_description_field_id: fieldId,
      item_description_field_value: field.item_description_field_value,
      item_description_field_is_available:
        field.item_description_field_is_available,
      item_description_field_item_description_id:
        field.item_description_field_item_description_id,
    };
  });
  const { data: item, error: itemError } = await supabaseClient
    .schema("item_schema")
    .from("item_description_field_table")
    .insert(itemDescriptionFieldInput)
    .select("*");
  if (itemError) throw itemError;
  const { data: uom, error: uomError } = await supabaseClient
    .schema("item_schema")
    .from("item_description_field_uom_table")
    .insert(itemDescriptionFieldUomInput)
    .select("*");
  if (uomError) throw uomError;
  return item.map((item) => {
    const itemUom = uom.find(
      (value) =>
        value.item_description_field_uom_item_description_field_id ===
        item.item_description_field_id
    );
    return {
      ...item,
      item_description_field_uom: itemUom?.item_description_field_uom,
    };
  });
};

// Create request form
export const createRequestForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formBuilderData: FormBuilderData;
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("create_request_form", {
      input_data: params,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as FormTableRow;
};

// Create request
export const createRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestFormValues: RequestFormValues;
    formId: string;
    teamMemberId?: string;
    signers: FormType["form_signer"];
    teamId: string;
    requesterName: string;
    formName: string;
    isFormslyForm: boolean;
    projectId: string;
    teamName: string;
    status?: string;
    requestScore?: number;
    rootFormslyRequestId?: string;
    recruiter?: string;
    userId: string;
    sssId?: string;
    applicationInformationFormslyId?: string;
    interviewParams?: {
      status: string;
      teamMemberId: string;
      data: {
        hr_request_reference_id: string;
        application_information_email: string;
        application_information_request_id: string;
        position: string;
      };
      technicalInterviewNumber: number;
      technicalInterviewId: string;
    };
    backgroundCheckParams?: {
      status: string;
      teamMemberId: string;
      data: {
        hr_request_reference_id: string;
        application_information_email: string;
        application_information_request_id: string;
        position: string;
      };
      backgroundCheckId: string;
    };
    tradeTestParams?: {
      status: string;
      teamMemberId: string;
      data: {
        hr_request_reference_id: string;
        application_information_email: string;
        application_information_request_id: string;
        position: string;
      };
      tradeTestId: string;
    };
  }
) => {
  const {
    requestFormValues,
    signers,
    teamId,
    requesterName,
    formName,
    isFormslyForm,
    projectId,
    teamName,
    status,
    requestScore,
    rootFormslyRequestId,
    recruiter,
    userId,
    sssId,
    applicationInformationFormslyId,
    interviewParams,
    backgroundCheckParams,
    tradeTestParams
  } = params;

  const requestId = uuidv4();

  // get request response
  const requestResponseInput: RequestResponseTableInsert[] = [];
  for (const section of requestFormValues.sections) {
    for (const field of section.section_field) {
      let responseValue = field.field_response;

      if (
        typeof responseValue === "boolean" ||
        responseValue ||
        field.field_type === "SWITCH" ||
        (field.field_type === "NUMBER" && responseValue === 0)
      ) {
        if (field.field_type === "FILE") {
          const fileResponse = responseValue as File;

          const fileType = getFileType(field.field_name);
          if (fileResponse["type"].split("/")[0] === "image") {
            responseValue = (
              await uploadImage(supabaseClient, {
                image: fileResponse,
                bucket: "REQUEST_ATTACHMENTS",
                fileType,
                userId,
                sssId,
                applicationInformationFormslyId,
              })
            ).publicUrl;
          } else {
            responseValue = (
              await uploadFile(supabaseClient, {
                file: fileResponse,
                bucket: "REQUEST_ATTACHMENTS",
                fileType,
                userId,
                sssId,
                applicationInformationFormslyId,
              })
            ).publicUrl;
          }
        } else if (field.field_type === "SWITCH" && !field.field_response) {
          responseValue = false;
        } else if (
          ["TEXT", "TEXTAREA", "AUTOCOMPLETE"].includes(field.field_type)
        ) {
          responseValue = (responseValue ? `${responseValue}` : "")
            .trim()
            .replace(/\s\s+/g, " ");
        }

        if (
          isFormslyForm &&
          formName === "Application Information" &&
          [
            "SSS ID Number",
            "Philhealth Number",
            "Pag-IBIG Number",
            "TIN",
          ].includes(field.field_name)
        ) {
          responseValue = `${responseValue}`.replace(/\D/g, "");
        }

        const response = {
          request_response: JSON.stringify(responseValue),
          request_response_duplicatable_section_id:
            field.field_section_duplicatable_id ?? null,
          request_response_field_id: field.field_id,
          request_response_request_id: requestId,
          request_response_prefix: field.field_prefix ?? null,
        };
        requestResponseInput.push(response);
      }
    }
  }
  // get request signers
  const requestSignerInput: RequestSignerTableInsert[] = [];
  const signerIdList: string[] = [];

  // get signer notification
  const requestSignerNotificationInput: NotificationTableInsert[] = [];

  signers.forEach((signer) => {
    if (!signerIdList.includes(signer.signer_id)) {
      requestSignerInput.push({
        request_signer_signer_id: signer.signer_id,
        request_signer_request_id: requestId,
      });
      requestSignerNotificationInput.push({
        notification_app: "REQUEST",
        notification_content: `${requesterName} requested you to sign his/her ${formName} request`,
        notification_redirect_url: `/${teamName}/requests/${requestId}`,
        notification_team_id: teamId,
        notification_type: "REQUEST",
        notification_user_id:
          signer.signer_team_member.team_member_user.user_id,
      });
      signerIdList.push(signer.signer_id);
    }
  });

  const responseValues = requestResponseInput
    .map((response) => {
      const escapedResponse = escapeQuotes(response.request_response);
      return `('${escapedResponse}',${
        response.request_response_duplicatable_section_id
          ? `'${response.request_response_duplicatable_section_id}'`
          : "NULL"
      },'${response.request_response_field_id}','${
        response.request_response_request_id
      }', '${
        response.request_response_prefix
          ? `${response.request_response_prefix}`
          : "NULL"
      }')`;
    })
    .join(",");

  const signerValues = requestSignerInput
    .map(
      (signer) =>
        `('${signer.request_signer_signer_id}','${signer.request_signer_request_id}')`
    )
    .join(",");

  // create request
  const { data, error } = await supabaseClient
    .rpc("create_request", {
      input_data: {
        requestId,
        formId: params.formId,
        teamMemberId: params.teamMemberId,
        responseValues,
        signerValues,
        requestSignerNotificationInput,
        formName,
        isFormslyForm,
        projectId,
        teamId,
        status,
        requestScore,
        rootFormslyRequestId,
        recruiter,
        interviewParams,
        backgroundCheckParams,
        tradeTestParams
      },
    })
    .select()
    .single();
  if (error) throw error;

  return data as RequestTableRow;
};

// Edit request
export const editRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    requestFormValues: RequestFormValues;
    signers: FormType["form_signer"];
    teamId: string;
    requesterName: string;
    formName: string;
    teamName: string;
    userId: string;
  }
) => {
  const {
    requestId,
    requestFormValues,
    signers,
    teamId,
    requesterName,
    formName,
    teamName,
    userId,
  } = params;

  // get request response
  const requestResponseInput: RequestResponseTableInsert[] = [];
  for (const section of requestFormValues.sections) {
    const duplicatableSectionId = section.section_is_duplicatable
      ? uuidv4()
      : null;
    for (const field of section.section_field) {
      let responseValue = field?.field_response as unknown;
      if (
        typeof responseValue === "boolean" ||
        responseValue ||
        field.field_type === "SWITCH" ||
        (field.field_type === "NUMBER" && responseValue === 0)
      ) {
        if (field.field_type === "FILE") {
          const fileResponse = responseValue as File;

          const fileType = getFileType(field.field_name);
          if (fileResponse["type"].split("/")[0] === "image") {
            responseValue = (
              await uploadImage(supabaseClient, {
                image: fileResponse,
                bucket: "REQUEST_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          } else {
            responseValue = (
              await uploadFile(supabaseClient, {
                file: fileResponse,
                bucket: "REQUEST_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          }
        } else if (field.field_type === "SWITCH" && !field.field_response) {
          responseValue = false;
        }

        const response = {
          request_response: JSON.stringify(responseValue),
          request_response_duplicatable_section_id: duplicatableSectionId,
          request_response_field_id: field.field_id,
          request_response_request_id: requestId,
          request_response_prefix: field.field_prefix ?? null,
        };
        requestResponseInput.push(response);
      }
    }
  }

  // get request signers
  const requestSignerInput: RequestSignerTableInsert[] = [];
  const signerIdList: string[] = [];

  // get signer notification
  const requestSignerNotificationInput: NotificationTableInsert[] = [];

  signers.forEach((signer) => {
    if (!signerIdList.includes(signer.signer_id)) {
      requestSignerInput.push({
        request_signer_signer_id: signer.signer_id,
        request_signer_request_id: requestId,
      });
      requestSignerNotificationInput.push({
        notification_app: "REQUEST",
        notification_content: `${requesterName} requested you to sign his/her ${formName} request`,
        notification_redirect_url: `/${teamName}/requests/${requestId}`,
        notification_team_id: teamId,
        notification_type: "REQUEST",
        notification_user_id:
          signer.signer_team_member.team_member_user.user_id,
      });
      signerIdList.push(signer.signer_id);
    }
  });

  const responseValues = requestResponseInput
    .map((response) => {
      const escapedResponse = escapeQuotes(response.request_response);
      return `('${escapedResponse}',${
        response.request_response_duplicatable_section_id
          ? `'${response.request_response_duplicatable_section_id}'`
          : "NULL"
      },'${response.request_response_field_id}','${
        response.request_response_request_id
      }', '${
        response.request_response_prefix
          ? `${response.request_response_prefix}`
          : "NULL"
      }')`;
    })
    .join(",");

  const signerValues = requestSignerInput
    .map(
      (signer) =>
        `('${signer.request_signer_signer_id}','${signer.request_signer_request_id}')`
    )
    .join(",");

  const notificationValues = requestSignerNotificationInput
    .map(
      (notification) =>
        `('${notification.notification_app}','${notification.notification_content}','${notification.notification_redirect_url}','${notification.notification_team_id}','${notification.notification_type}','${notification.notification_user_id}')`
    )
    .join(",");

  const { data, error } = await supabaseClient
    .rpc("edit_request", {
      input_data: {
        requestId,
        responseValues,
        signerValues,
        notificationValues,
      },
    })
    .select()
    .single();
  if (error) throw error;

  return data as RequestTableRow;
};

// Create formsly premade forms
export const createFormslyPremadeForms = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { teamMemberId } = params;

  const { forms, sections, fieldWithId, fieldsWithoutId, options } =
    formslyPremadeFormsData(teamMemberId);

  const formValues = forms
    .map(
      (form) =>
        `('${form.form_id}','${form.form_name}','${form.form_description}','${form.form_app}','${form.form_is_formsly_form}','${form.form_is_hidden}','${form.form_team_member_id}','${form.form_is_disabled}')`
    )
    .join(",");

  const sectionValues = sections
    .map(
      (section) =>
        `('${section.section_form_id}','${section.section_id}','${section.section_is_duplicatable}','${section.section_name}','${section.section_order}')`
    )
    .join(",");

  const fieldWithIdValues = fieldWithId
    .map(
      (field) =>
        `('${field.field_id}','${field.field_is_read_only}','${field.field_is_required}','${field.field_name}','${field.field_order}','${field.field_section_id}','${field.field_type}')`
    )
    .join(",");

  const fieldsWithoutIdValues = fieldsWithoutId
    .map(
      (field) =>
        `('${field.field_is_read_only}','${field.field_is_required}','${field.field_name}','${field.field_order}','${field.field_section_id}','${field.field_type}')`
    )
    .join(",");

  const optionsValues = options
    .map(
      (option) =>
        `('${option.option_field_id}','${option.option_order}','${option.option_value}')`
    )
    .join(",");

  const { error } = await supabaseClient
    .rpc("create_formsly_premade_forms", {
      input_data: {
        formValues,
        sectionValues,
        fieldWithIdValues,
        fieldsWithoutIdValues,
        optionsValues,
      },
    })
    .select()
    .single();

  if (error) throw error;
};

// Create Supplier
export const createSupplier = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    supplierData: SupplierTableInsert;
  }
) => {
  const { supplierData } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("supplier_table")
    .insert(supplierData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Create Team Group
export const createTeamGroup = async (
  supabaseClient: SupabaseClient<Database>,
  params: TeamGroupTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_table")
    .insert(params)
    .select("*")
    .single();
  if (error) throw error;

  return data;
};

// Create Team Project
export const createTeamProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamProjectName: string;
    teamProjectInitials: string;
    teamProjectTeamId: string;
    siteMapId: string;
    boqId: string;
    region: string;
    province: string;
    city: string;
    barangay: string;
    street: string;
    zipCode: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("create_team_project", {
      input_data: {
        ...params,
      },
    })
    .select()
    .single();
  if (error) throw error;

  return data as TeamProjectWithAddressType;
};

// Insert team member to group
export const insertGroupMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    groupId: string;
    teamMemberIdList: string[];
    teamProjectIdList: string[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("insert_group_member", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as unknown as { data: GroupTeamMemberType[]; count: number };
};

// Insert team member to project
export const insertProjectMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    teamMemberIdList: string[];
    teamGroupIdList: string[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("insert_project_member", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as unknown as { data: ProjectTeamMemberType[]; count: number };
};

export const cancelTeamInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    invitation_id: string;
  }
) => {
  const { invitation_id } = params;
  const { error } = await supabaseClient
    .schema("user_schema")
    .from("invitation_table")
    .update({ invitation_is_disabled: true })
    .eq("invitation_id", invitation_id)
    .select();

  if (error) throw Error;
};

export const downloadFromStorage = (
  supabaseClient: SupabaseClient<Database>,
  params: {
    bucket: string;
    filename: string;
  }
) => {
  const { bucket, filename } = params;

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filename, {
    download: true,
  });

  return data.publicUrl;
};

// Create service
export const createService = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    serviceData: ServiceTableInsert;
    scope: ServiceForm["scope"];
    formId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("create_service", { input_data: params })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Create item description field
export const createServiceScopeChoice = async (
  supabaseClient: SupabaseClient<Database>,
  params: ServiceScopeChoiceTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("service_schema")
    .from("service_scope_choice_table")
    .insert(params)
    .select("*")
    .single();
  if (error) throw error;

  return data;
};

// Create ticket comment
export const createTicketComment = async (
  supabaseClient: SupabaseClient<Database>,
  params: TicketCommentTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("ticket_schema")
    .from("ticket_comment_table")
    .insert(params)
    .select("*")
    .single();
  if (error) throw error;

  return { data, error };
};

// Create row in lookup table
export const createRowInLookupTable = async (
  supabaseClient: SupabaseClient,
  params: {
    inputData: JSON;
    tableName: string;
    schema: string;
  }
) => {
  const { tableName, inputData, schema } = params;
  const { data, error } = await supabaseClient
    .schema(schema)
    .from(`${tableName}_table`)
    .insert(inputData)
    .select()
    .single();
  if (error) throw error;

  const id = `${tableName}_id`;
  const value = tableName;
  const status = `${tableName}_is_available`;

  const formattedData = data as unknown as {
    [key: string]: string;
  };

  return {
    id: formattedData[id],
    status: Boolean(formattedData[status]),
    value: formattedData[value],
  };
};

// Create memo
export const createTeamMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    memoData: {
      memo_author_user_id: string;
      memo_subject: string;
      memo_team_id: string;
      memo_reference_number: string;
    };
    signerData: {
      memo_signer_order: number;
      memo_signer_is_primary: boolean;
      memo_signer_team_member_id: string;
      memo_signer_user_id: string;
    }[];
    lineItemData: MemoLineItem[];
    userId: string;
  }
) => {
  const { memoData, signerData, lineItemData, userId } = params;

  // upload attachments
  const updatedLineItemData = await processAllMemoLineItems(
    lineItemData,
    supabaseClient,
    userId
  );

  const input_data = {
    memoData,
    signerData,
    lineItemData: updatedLineItemData,
  };

  // create memo
  const { data, error } = await supabaseClient.rpc("create_memo", {
    input_data,
  });
  if (error) throw Error;

  return data as MemoTableRow;
};

const processAllMemoLineItems = async (
  lineItemData: MemoLineItem[],
  supabaseClient: SupabaseClient<Database>,
  userId: string
) => {
  const processedLineItems = await Promise.all(
    lineItemData.map(async (lineItem) => {
      const memo_line_item_id = uuidv4();

      if (lineItem.memo_line_item_attachment_caption) {
        lineItem.memo_line_item_attachment_caption = escapeQuotes(
          lineItem.memo_line_item_attachment_caption
        );
      }

      if (lineItem.memo_line_item_attachment) {
        const bucket = "MEMO_ATTACHMENTS";
        const attachmentPublicUrl = (
          await uploadImage(supabaseClient, {
            image: lineItem.memo_line_item_attachment,
            bucket,
            fileType: "m",
            userId,
          })
        ).publicUrl;

        return {
          ...lineItem,
          memo_line_item_id,
          memo_line_item_attachment_public_url: attachmentPublicUrl,
          memo_line_item_attachment_storage_bucket: bucket,
        };
      }

      return {
        ...lineItem,
        memo_line_item_content: escapeQuotes(lineItem.memo_line_item_content),
        memo_line_item_id,
      };
    })
  );

  return JSON.parse(JSON.stringify(processedLineItems));
};

// End create memo

// Agree to memo

export const agreeToMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: { memoId: string; teamMemberId: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("agree_to_memo", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as MemoAgreementTableRow & {
    memo_agreement_by_team_member: {
      user_data: {
        user_avatar: string;
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_employee_number: {
          user_employee_number: string;
        }[];
      };
    };
  };
};

// create reference memo
export const createReferenceMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: ReferenceMemoType,
  userId: string
) => {
  const memoId = uuidv4();
  const updatedLineItemData: ReferenceMemoType["memo_line_item_list"] =
    await processReferenceMemoLineItems(
      params.memo_line_item_list,
      supabaseClient,
      memoId,
      userId
    );

  const memoSignerTableValues = params.memo_signer_list
    .map(
      (signer, signerIndex) =>
        `('${signer.memo_signer_is_primary}', '${signerIndex}', '${signer.memo_signer_team_member?.team_member_id}', '${memoId}')`
    )
    .join(",");

  const memoLineItemTableValues = updatedLineItemData
    .map(
      (lineItem, lineItemIndex) =>
        `('${lineItem.memo_line_item_id}', '${escapeQuotes(
          lineItem.memo_line_item_content
        )}', '${lineItemIndex}', '${memoId}')`
    )
    .join(",");

  const memoLineItemAttachmentTableValues = updatedLineItemData
    .filter(
      (lineItem) =>
        lineItem.memo_line_item_attachment?.memo_line_item_attachment_name
    )
    .map(
      ({ memo_line_item_id, memo_line_item_attachment: lineItemAttachment }) =>
        `('${lineItemAttachment?.memo_line_item_attachment_name}', '${
          escapeQuotes(
            `${lineItemAttachment?.memo_line_item_attachment_caption}`
          ) ?? ""
        }', '${
          lineItemAttachment?.memo_line_item_attachment_storage_bucket
        }', '${
          lineItemAttachment?.memo_line_item_attachment_public_url
        }', '${memo_line_item_id}')`
    )
    .join(",");

  const input_data = {
    memo_id: memoId,
    memo_subject: params.memo_subject,
    memo_reference_number: params.memo_reference_number,
    memo_team_id: params.memo_team_id,
    memo_author_user_id: params.memo_author_user_id,
    memoSignerTableValues,
    memoLineItemTableValues,
    memoLineItemAttachmentTableValues,
  };

  const { data, error } = await supabaseClient.rpc("create_reference_memo", {
    input_data,
  });

  if (error) throw Error;

  return data as unknown as ReferenceMemoType;
};

const processReferenceMemoLineItems = async (
  lineItemData: ReferenceMemoType["memo_line_item_list"],
  supabaseClient: SupabaseClient<Database>,
  memoId: string,
  userId: string
) => {
  const processedLineItems = await Promise.all(
    lineItemData.map(async (lineItem) => {
      const memoLineItemId = uuidv4();
      const file =
        lineItem.memo_line_item_attachment &&
        lineItem.memo_line_item_attachment.memo_line_item_attachment_file;

      if (file) {
        const bucket = "MEMO_ATTACHMENTS";
        const attachmentPublicUrl = (
          await uploadImage(supabaseClient, {
            image: file,
            bucket,
            fileType: "m",
            userId,
          })
        ).publicUrl;

        return {
          memo_line_item_id: memoLineItemId,
          memo_line_item_content: lineItem.memo_line_item_content,
          memo_line_item_memo_id: memoId,
          memo_line_item_attachment: {
            memo_line_item_attachment_public_url: attachmentPublicUrl,
            memo_line_item_attachment_storage_bucket: bucket,
            memo_line_item_attachment_name: file.name,
            memo_line_item_attachment_caption:
              lineItem.memo_line_item_attachment
                ?.memo_line_item_attachment_caption ?? "",
          },
        };
      }

      return {
        memo_line_item_id: memoLineItemId,
        memo_line_item_content: lineItem.memo_line_item_content,
        memo_line_item_memo_id: memoId,
      };
    })
  );

  return JSON.parse(JSON.stringify(processedLineItems));
};
// Create row in other expenses type table
export const createRowInOtherExpensesTypeTable = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    inputData: OtherExpensesTypeTableInsert;
  }
) => {
  const { inputData } = params;
  const { data, error } = await supabaseClient
    .schema("other_expenses_schema")
    .from("other_expenses_type_table")
    .insert(inputData)
    .select()
    .single();
  if (error) throw error;

  return data;
};

// Create Valid ID
export const createValidID = async (
  supabaseClient: SupabaseClient<Database>,
  params: Omit<UserValidIDTableInsert, "user_valid_id_address_id"> &
    AddressTableInsert
) => {
  const { data, error } = await supabaseClient.rpc("create_user_valid_id", {
    input_data: params,
  });
  if (error) throw error;
  return data;
};

// Create ticket
export const createTicket = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
    category: string;
    ticketFormValues: CreateTicketFormValues;
    userId: string;
  }
) => {
  const { category, teamMemberId, ticketFormValues, userId } = params;

  const ticketId = uuidv4();

  // get request response
  const requestResponseInput: TicketResponseTableInsert[] = [];
  for (const section of ticketFormValues.ticket_sections) {
    for (const field of section.ticket_section_fields) {
      let responseValue = field.ticket_field_response;
      if (responseValue) {
        if (field.ticket_field_type === "FILE") {
          const fileResponse = responseValue as File;

          const fileType = getFileType(field.ticket_field_name);
          if (fileResponse["type"].split("/")[0] === "image") {
            responseValue = (
              await uploadImage(supabaseClient, {
                image: fileResponse,
                bucket: "TICKET_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          } else {
            responseValue = (
              await uploadFile(supabaseClient, {
                file: fileResponse,
                bucket: "TICKET_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          }
        }
        const response = {
          ticket_response_value: JSON.stringify(`${responseValue}`.trim()),
          ticket_response_duplicatable_section_id:
            section.field_section_duplicatable_id ?? null,
          ticket_response_field_id: field.ticket_field_id,
          ticket_response_ticket_id: ticketId,
        };
        requestResponseInput.push(response);
      }
    }
  }

  const responseValues = requestResponseInput
    .map((response) => {
      const escapedResponse = escapeQuotes(response.ticket_response_value);
      return `('${escapedResponse}',${
        response.ticket_response_duplicatable_section_id
          ? `'${response.ticket_response_duplicatable_section_id}'`
          : "NULL"
      },'${response.ticket_response_field_id}','${
        response.ticket_response_ticket_id
      }')`;
    })
    .join(",");

  // create ticket
  const { data, error } = await supabaseClient
    .rpc("create_ticket", {
      input_data: {
        category,
        ticketId,
        teamMemberId,
        responseValues,
      },
    })
    .select()
    .single();
  if (error) throw error;

  return data as TicketTableRow;
};

// Edit ticket
export const editTicket = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    ticketId: string;
    ticketFormValues: CreateTicketFormValues;
    userId: string;
  }
) => {
  const { ticketId, ticketFormValues, userId } = params;

  // get request response
  const requestResponseInput: TicketResponseTableInsert[] = [];
  for (const section of ticketFormValues.ticket_sections) {
    for (const field of section.ticket_section_fields) {
      let responseValue = field.ticket_field_response;
      if (responseValue) {
        if (
          field.ticket_field_type === "FILE" &&
          typeof responseValue !== "string"
        ) {
          const fileResponse = responseValue as File;

          const fileType = getFileType(field.ticket_field_name);
          if (fileResponse["type"].split("/")[0] === "image") {
            responseValue = (
              await uploadImage(supabaseClient, {
                image: fileResponse,
                bucket: "TICKET_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          } else {
            responseValue = (
              await uploadFile(supabaseClient, {
                file: fileResponse,
                bucket: "TICKET_ATTACHMENTS",
                fileType,
                userId,
              })
            ).publicUrl;
          }
        }
        const response = {
          ticket_response_value: JSON.stringify(`${responseValue}`.trim()),
          ticket_response_duplicatable_section_id:
            section.field_section_duplicatable_id ?? null,
          ticket_response_field_id: field.ticket_field_id,
          ticket_response_ticket_id: ticketId,
        };
        requestResponseInput.push(response);
      }
    }
  }

  const responseValues = requestResponseInput
    .map((response) => {
      const escapedResponse = escapeQuotes(response.ticket_response_value);
      return `('${escapedResponse}',${
        response.ticket_response_duplicatable_section_id
          ? `'${response.ticket_response_duplicatable_section_id}'`
          : "NULL"
      },'${response.ticket_response_field_id}','${
        response.ticket_response_ticket_id
      }')`;
    })
    .join(",");

  // edit ticket
  const { error } = await supabaseClient.rpc("edit_ticket", {
    input_data: {
      ticketId,
      responseValues,
    },
  });
  if (error) throw error;
  else return true;
};

// Create custom CSI
export const createCustomCSI = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemName: string;
    csiCodeDescription: string;
    csiCode: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("create_custom_csi", {
    input_data: {
      ...params,
    },
  });
  if (error) throw error;
  return Boolean(data);
};

// Create item division
export const createItemDivision = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemId: string;
    divisionId: string;
  }
) => {
  const { divisionId, itemId } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_division_table")
    .insert({ item_division_value: divisionId, item_division_item_id: itemId });
  if (error) throw error;
  return data;
};

// Create equipment
export const createEquipment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentData: EquipmentTableInsert;
    category: string;
  }
) => {
  const { equipmentData, category } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_table")
    .insert(equipmentData)
    .select()
    .single();
  if (error) throw error;

  return {
    ...data,
    equipment_category: category,
  };
};

// Create equipment description
export const createEquipmentDescription = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentDescriptionData: EquipmentDescriptionTableInsert;
    brand: string;
    model: string;
  }
) => {
  const { equipmentDescriptionData, brand, model } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_table")
    .insert(equipmentDescriptionData)
    .select()
    .single();
  if (error) throw error;

  return {
    ...data,
    equipment_description_brand: brand,
    equipment_description_model: model,
  };
};

// Create equipment part
export const createEquipmentPart = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentPartData: EquipmentPartTableInsert;
    name: string;
    brand: string;
    model: string;
    uom: string;
    category: string;
  }
) => {
  const { equipmentPartData, name, brand, model, uom, category } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_part_table")
    .insert(equipmentPartData)
    .select()
    .single();
  if (error) throw error;

  return {
    ...data,
    equipment_part_general_name: name,
    equipment_part_brand: brand,
    equipment_part_model: model,
    equipment_part_unit_of_measurement: uom,
    equipment_part_component_category: category,
  };
};

// create ped part from ticket request
export const createPedPartFromTicketRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentName: string;
    partName: string;
    partNumber: string;
    brand: string;
    model: string;
    unitOfMeasure: string;
    category: string;
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "create_ped_part_from_ticket_request",
    {
      input_data: escapeQuotesForObject(params),
    }
  );
  if (error) throw error;
  return data;
};

// assign jira formsly project
export const assignJiraFormslyProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formslyProjectId: string;
    jiraProjectId: string;
  }
) => {
  const { formslyProjectId, jiraProjectId } = params;

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_formsly_project_table")
    .insert({
      formsly_project_id: formslyProjectId,
      jira_project_id: jiraProjectId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return { success: true, data: data };
};

// assign jira user to project
export const assignJiraUserToProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userAccountId: string;
    userRoleId: string;
    teamProjectId: string;
    selectedRoleLabel: string;
  }
) => {
  const { userAccountId, teamProjectId, userRoleId, selectedRoleLabel } =
    params;

  // check for duplicate
  const { count, error: CountError } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_user_table")
    .select("jira_project_user_id", { count: "exact" })
    .eq("jira_project_user_account_id", userAccountId)
    .eq("jira_project_user_team_project_id", teamProjectId);
  if (CountError) throw CountError;

  if (Number(count) > 1) {
    return { success: false, data: null, error: "Duplicate entry." };
  }

  if (
    ["WAREHOUSE REPRESENTATIVE", "WAREHOUSE AREA LEAD"].includes(
      selectedRoleLabel
    )
  ) {
    const { count, error: CountError } = await supabaseClient
      .schema("jira_schema")
      .from("jira_project_user_table")
      .select("jira_project_user_id", { count: "exact" })
      .eq("jira_project_user_role_id", userRoleId)
      .eq("jira_project_user_team_project_id", teamProjectId);
    if (CountError) throw CountError;

    if (Number(count) >= 1) {
      return {
        success: false,
        data: null,
        error: `${selectedRoleLabel} must only have 1 entry per project.`,
      };
    }
  }

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_user_table")
    .insert({
      jira_project_user_account_id: userAccountId,
      jira_project_user_team_project_id: teamProjectId,
      jira_project_user_role_id: userRoleId,
    })
    .select()
    .maybeSingle();
  if (error) throw error;

  if (data) {
    return { success: true, data: data, error: null };
  } else {
    return { success: true, data: null, error: null };
  }
};

// assign or update jira user to item category

export const assignJiraUserToItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    data: JiraItemCategoryUserTableInsert;
    isUpdate: boolean;
  }
) => {
  if (params.isUpdate) {
    return await updateJiraItemCategory(supabaseClient, params);
  } else {
    return await insertJiraItemCategory(supabaseClient, params);
  }
};

const updateJiraItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: { data: JiraItemCategoryUserTableInsert }
) => {
  if (!params.data.jira_item_user_id) throw new Error();
  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_item_user_table")
    .update(params.data)
    .eq("jira_item_user_id", params.data.jira_item_user_id)
    .select(
      `
      jira_item_user_id,
      jira_item_user_item_category_id,
      jira_item_user_account_id(jira_user_account_jira_id, jira_user_account_display_name, jira_user_account_id),
      jira_item_user_role_id(jira_user_role_id, jira_user_role_label)
      `
    )
    .maybeSingle();

  if (error) throw error;

  return formatJiraItemUserTableData(data as unknown as JiraItemUserTableData);
};

const insertJiraItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: { data: JiraItemCategoryUserTableInsert }
) => {
  const { count } = await supabaseClient
    .schema("jira_schema")
    .from("jira_item_user_table")
    .select("jira_item_user_id", { count: "exact" })
    .eq(
      "jira_item_user_item_category_id",
      params.data.jira_item_user_item_category_id
    );

  if (Number(count)) {
    return { success: false, data: null, error: "Duplicate entry" };
  }

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_item_user_table")
    .insert(params.data)
    .select(
      `
      jira_item_user_id,
      jira_item_user_item_category_id,
      jira_item_user_account_id(jira_user_account_jira_id, jira_user_account_display_name, jira_user_account_id),
      jira_item_user_role_id(jira_user_role_id, jira_user_role_label)
      `
    )
    .maybeSingle();

  if (error) throw error;

  return formatJiraItemUserTableData(data as unknown as JiraItemUserTableData);
};

// create jira project
export const createJiraProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: JiraProjectTableInsert
) => {
  // check if duplicate
  const { count, error: duplicateError } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_table")
    .select("jira_project_id", { count: "exact" })
    .eq("jira_project_jira_id", params.jira_project_jira_id);

  if (duplicateError) throw duplicateError;

  if (Number(count)) {
    return { data: null, error: "Jira project already exists." };
  }

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_table")
    .insert(params)
    .select("*");

  if (error) throw error;

  return { data, error: null };
};

// create jira user
export const createJiraUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: JiraUserAccountTableInsert
) => {
  // check if duplicate
  const { count, error: duplicateError } = await supabaseClient
    .schema("jira_schema")
    .from("jira_user_account_table")
    .select("jira_user_account_id", { count: "exact" })
    .eq("jira_user_account_jira_id", params.jira_user_account_jira_id);

  if (duplicateError) throw duplicateError;

  if (Number(count)) {
    return { success: false, error: "Jira user already exists." };
  }

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_user_account_table")
    .insert(params);

  if (error) throw error;

  return { data, error: null };
};

// create jira item category
export const createJiraFormslyItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: JiraItemCategoryTableInsert
) => {
  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_item_category_table")
    .insert(params)
    .select(
      "*, assigned_jira_user: jira_item_user_table(jira_item_user_id, jira_item_user_account_id(jira_user_account_jira_id, jira_user_account_display_name, jira_user_account_id), jira_item_user_role_id(jira_user_role_id, jira_user_role_label))"
    )
    .maybeSingle();

  if (error) throw error;

  const assignedUser = data?.assigned_jira_user as unknown as {
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
  }[];

  const formattedData = {
    ...data,
    assigned_jira_user: {
      ...assignedUser[0],
      ...assignedUser[0]?.jira_item_user_account_id,
      ...assignedUser[0]?.jira_item_user_role_id,
    },
  };

  return formattedData as unknown as JiraFormslyItemCategoryWithUserDataType;
};

// Create item category
export const createItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    category: string;
    teamMemberId: string;
  }
) => {
  const { error } = await supabaseClient.rpc("create_item_category", {
    input_data: params,
  });

  if (error) throw error;
};

// create jira organization
export const createJiraOrganization = async (
  supabaseClient: SupabaseClient<Database>,
  params: JiraOrganizationTableInsert
) => {
  // check if duplicate
  const { count, error: duplicateError } = await supabaseClient
    .schema("jira_schema")
    .from("jira_organization_table")
    .select("jira_organization_id", { count: "exact", head: true })
    .eq("jira_organization_jira_id", params.jira_organization_jira_id);

  if (duplicateError) throw duplicateError;

  if (Number(count)) {
    return { success: false, error: "Jira organization already exists." };
  }

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_organization_table")
    .insert(params)
    .select();

  if (error) throw error;

  return { data, error: null };
};

// assign project organization
export const assignJiraFormslyOrganization = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formslyProjectId: string;
    jiraOrganizationId?: string;
  }
) => {
  const { formslyProjectId, jiraOrganizationId } = params;
  if (!jiraOrganizationId) return null;

  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_organization_team_project_table")
    .insert({
      jira_organization_team_project_project_id: formslyProjectId,
      jira_organization_team_project_organization_id: jiraOrganizationId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Ecrypt app source id
export const encryptAppSourceId = async () => {
  const response = await fetch("/api/jwt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "encrypt",
      value: APP_SOURCE_ID,
    }),
  });

  if (response.status !== 200) throw new Error("Encryption Error");
  const { data } = await response.json();

  return data as string;
};

export const createJobTitle = async (
  supabaseClient: SupabaseClient<Database>,
  params: JobTitleTableInsert
) => {
  // check if duplicate
  const { count, error: duplicateError } = await supabaseClient
    .schema("lookup_schema")
    .from("employee_job_title_table")
    .select("employee_job_title_id", { count: "exact" })
    .eq("employee_job_title_label", params.employee_job_title_label);

  if (duplicateError) throw duplicateError;

  if (Number(count)) {
    return { data: null, error: "Job title already exists." };
  }

  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("employee_job_title_table")
    .insert(params)
    .select("*");

  if (error) throw error;

  return { data, error: null };
};

export const createDepartmentSigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: SignerTableInsert
) => {
  // check if duplicate
  const {
    data: duplicateData,
    count,
    error: duplicateError,
  } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .select("signer_id, signer_is_disabled", {
      count: "exact",
    })
    .eq("signer_form_id", `${params.signer_form_id}`)
    .eq("signer_team_project_id", `${params.signer_team_project_id}`)
    .eq("signer_team_department_id", `${params.signer_team_department_id}`)
    .eq("signer_team_member_id", `${params.signer_team_member_id}`)
    .eq("signer_is_primary_signer", Boolean(params.signer_is_primary_signer))
    .maybeSingle();

  if (duplicateError) throw duplicateError;

  if (!duplicateData?.signer_is_disabled && Number(count)) {
    return null;
  }

  if (duplicateData?.signer_is_disabled) {
    const { data, error } = await supabaseClient
      .schema("form_schema")
      .from("signer_table")
      .update({ signer_is_disabled: false })
      .eq("signer_id", duplicateData.signer_id)
      .select("*");

    if (error) throw error;

    return data;
  }

  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .insert(params)
    .select("*");

  if (error) throw error;

  return data;
};

export const sendNotificationToCostEngineer = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    requesterName: string;
    redirectUrl: string;
    teamId: string;
  }
) => {
  const { error } = await supabaseClient.rpc(
    "send_notification_to_project_cost_engineer",
    { input_data: params }
  );
  if (error) throw error;
};

// create item from ticket request
export const createItemFromTicketRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    generalName: string;
    unitOfMeasurement: string;
    glAccount: string;
    divisionList: string[];
    divisionDescription: string;
    isPedItem: boolean;
    isITAssetItem: boolean;
    descriptionList: { description: string; isWithUom: boolean }[];
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "create_item_from_ticket_request",
    {
      input_data: params,
    }
  );
  if (error) throw error;
  return data;
};

export const addMemberToAllProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberIdList: string[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("add_team_member_to_all_project", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as InvitationTableRow[];
};

export const createInterviewOnlineMeeting = async (
  supabaseClient: SupabaseClient<Database>,
  params: InterviewOnlineMeetingTableInsert & {
    updateScheduleProps: {
      interviewSchedule: string;
      targetId: string;
      status: string;
      table: string;
      meetingTypeNumber?: number;
      team_member_id: string;
    };
  }
) => {
  const { data, error } = await supabaseClient.rpc("create_schedule", {
    input_data: params,
  });
  if (error) throw error;

  return data as InterviewOnlineMeetingTableRow;
};
export const generateApiKey = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    keyLabel: string;
  }
) => {
  const apiKey = uuidv4();
  const { teamId, keyLabel } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_key_table")
    .insert({
      team_key_team_id: teamId,
      team_key_api_key: apiKey,
      team_key_label: keyLabel.toUpperCase(),
    })
    .select("team_key_api_key, team_key_label")
    .maybeSingle();

  if (error) throw error;

  return data;
};
export const createAdOwnerRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: AdOwnerRequestTableInsert
) => {
  const { error } = await supabaseClient.rpc("create_ad_owner_request", {
    input_data: params,
  });

  if (error) throw error;
};

export const createTechnicalQuestions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestFormValues: TechnicalQuestionFormValues;
    questionnaireId: string;
  }
) => {
  const { requestFormValues, questionnaireId } = params;

  let fieldOrder = await getQuestionFieldOrder(supabaseClient, {
    questionnaireId,
  });

  fieldOrder = fieldOrder + 1;

  const FieldTableInput: FieldTableInsert[] = [];
  const OptionTableInput: QuestionOption[] = [];
  const CorrectResponseTableInput: FieldCorrectResponseTableInsert[] = [];
  const QuestionId: string[] = [];
  let FieldId = "";
  let correctAnswerFieldResponse = "";
  let correctAnswerFieldId = "";

  for (const section of requestFormValues.sections) {
    const technicalQuestion = section.field_name === "Technical Question";

    if (technicalQuestion) {
      const fieldId = uuidv4();
      FieldId = fieldId;
      correctAnswerFieldId = fieldId;

      const fieldEntry: FieldTableInsert = {
        field_id: fieldId,
        field_name: String(section.question.trim()),
        field_is_required: true,
        field_type: "MULTIPLE CHOICE",
        field_order: fieldOrder,
        field_section_id: "45a29efd-e90c-4fdd-8cb0-17d3b5a5e739",
      };

      FieldTableInput.push(fieldEntry);
      fieldOrder++;

      let optionOrder = 1;
      for (const optionField of section.choices) {
        if (optionField.field_name.toLowerCase().includes("question choice")) {
          const optionId = uuidv4();
          const optionEntry: QuestionOption = {
            option_id: optionId,
            option_value:
              String(optionField.choice) === "undefined"
                ? null
                : String(optionField.choice.trim()),
            option_order: optionOrder,
            option_field_id: FieldId,
          };

          OptionTableInput.push(optionEntry);
          optionOrder++;

          if (optionField.isCorrectAnswer) {
            correctAnswerFieldResponse = String(optionField.choice.trim());
          }
        }
      }

      if (correctAnswerFieldResponse) {
        const correctResponseEntry: FieldCorrectResponseTableInsert = {
          correct_response_id: uuidv4(),
          correct_response_value: correctAnswerFieldResponse,
          correct_response_field_id: correctAnswerFieldId,
        };
        CorrectResponseTableInput.push(correctResponseEntry);
      }
    }
  }

  const fieldResponseValues = FieldTableInput.map((response) => {
    const escapedResponse = escapeQuotes(response.field_name || "");
    return `('${response.field_id}', '${escapedResponse}', '${response.field_is_required}', '${response.field_type}', ${response.field_order}, '${response.field_section_id}')`;
  }).join(",");

  const correctResponseValues = CorrectResponseTableInput.map((response) => {
    const escapedResponse = escapeQuotes(response.correct_response_value || "");
    return `('${response.correct_response_id}', '${escapedResponse}', '${response.correct_response_field_id}')`;
  }).join(",");

  const questionResponseValues = FieldTableInput.map((response) => {
    const questionId = uuidv4();
    QuestionId.push(questionId);
    const escapedResponse = escapeQuotes(response.field_name || "");
    return `('${questionId}', '${escapedResponse}', '${response.field_id}', '${questionnaireId}')`;
  }).join(",");

  const questionOptionResponseValues = OptionTableInput.map(
    (response, index) => {
      const escapedResponse = escapeQuotes(response.option_value || "");
      const fieldUuid = QuestionId[Math.floor(index / 4)];
      return `('${escapedResponse}', '${response.option_order}', '${fieldUuid}')`;
    }
  ).join(",");

  const { data, error } = await supabaseClient
    .rpc("create_technical_question", {
      input_data: {
        fieldResponseValues,
        correctResponseValues,
        questionResponseValues,
        questionOptionResponseValues,
      },
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const checkIfQuestionExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    data: TechnicalQuestionFormValues;
    questionnaireId: string;
  }
) => {
  const { data: requestFormValues, questionnaireId } = params;
  const technicalQuestionData = [];
  for (const section of requestFormValues.sections) {
    if (section.field_name.toLowerCase().includes("technical question")) {
      technicalQuestionData.push(String(section.question.trim().toLowerCase()));
    }
  }

  const { data: fieldData, error: fieldError } = await supabaseClient.rpc(
    "check_technical_question",
    {
      input_data: {
        data: technicalQuestionData,
        questionnaireId,
      },
    }
  );

  if (fieldError) throw fieldError;

  return fieldData as boolean;
};

export const createQuestionnaire = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    questionnaireName: string;
    teamId: string;
    team_member_id: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("questionnaire_table")
    .insert({
      questionnaire_name: params.questionnaireName,
      questionnaire_team_id: params.teamId,
      questionnaire_created_by: params.team_member_id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as unknown as TechnicalAssessmentTableRow;
};

export const checkQuestionnaireName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    questionnaireName: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("questionnaire_table")
    .select("*")
    .ilike("questionnaire_name", params.questionnaireName)
    .limit(1);

  if (error) throw error;

  return data;
};

export const insertError = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    errorTableRow: ErrorTableInsert;
  }
) => {
  const { errorTableRow } = params;
  const { error } = await supabaseClient
    .from("error_table")
    .insert(errorTableRow);
  if (error) throw error;
};

export const resendEmail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  }
) => {
  const { email } = params;
  const { error } = await supabaseClient
    .schema("user_schema")
    .from("email_resend_table")
    .insert({
      email_resend_email: email,
    });
  if (error) throw error;
};

export const getQuestionFieldOrder = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    questionnaireId: string;
  }
) => {
  const { questionnaireId } = params;
  const { data, error } = await supabaseClient.rpc("get_question_field_order", {
    input_data: {
      questionnaireId,
    },
  });

  if (error) throw error;

  return data as unknown as number;
};

export const createUserWithSSSID = async (
  supabaseClient: SupabaseClient<Database>,
  params: UserTableInsert & {
    user_employee_number: string;
    sss_number: string;
    sss_front_image_url: string;
    sss_back_image_url: string;
  }
) => {
  const { user_phone_number } = params;

  const { error } = await supabaseClient
    .rpc("create_user_with_sss_id", {
      input_data: {
        ...params,
        user_phone_number: user_phone_number || "",
      },
    })
    .select()
    .single();
  if (error) throw error;
};

export const createSSSID = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sssData: UserSSSTableInsert;
  }
) => {
  const { sssData } = params;

  const { error } = await supabaseClient
    .schema("user_schema")
    .from("user_sss_table")
    .insert(sssData);
  if (error) throw error;
};

export const checkHRISNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    hrisNumber: string;
  }
) => {
  const { hrisNumber } = params;
  let isUnique = false;

  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("scic_employee_table")
    .select("scic_employee_hris_id_number")
    .eq("scic_employee_hris_id_number", hrisNumber)
    .limit(1);
  if (error) throw error;

  if (data.length > 0) {
    isUnique = true;
  }

  return isUnique;
};

export const createNewEmployee = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    employeeData: SCICEmployeeTableInsert;
  }
) => {
  const { employeeData } = params;

  const { error } = await supabaseClient
    .schema("lookup_schema")
    .from("scic_employee_table")
    .insert(employeeData);
  if (error) throw error;
};

export const updateEmployee = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    employeeData: SCICEmployeeTableUpdate;
  }
) => {
  const { employeeData } = params;

  const { error } = await supabaseClient
    .schema("lookup_schema")
    .from("scic_employee_table")
    .update(employeeData)
    .eq("scic_employee_id", employeeData.scic_employee_id as string);
  if (error) throw error;
};

export const createRequesterPrimarySigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    requesterTeamMemberId: string[];
    signerTeamMemberId: string;
    signerAction: string;
  }
) => {
  const { error } = await supabaseClient.rpc(
    "create_requester_primary_signer",
    {
      input_data: params,
    }
  );
  if (error) throw error;
};

export const createPracticalTestForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: CreatePracticalTestFormType & { teamMemberId: string; teamId: string }
) => {
  const {
    practical_test_id,
    practical_test_label,
    practical_test_passing_score,
    practical_test_position_list,
    practical_test_question_list,
    teamMemberId,
    teamId,
  } = params;

  const currentDate = moment(await getCurrentDate(supabaseClient)).format();
  const isEdit = Boolean(practical_test_id);
  const practicalTestId = isEdit ? practical_test_id : uuidv4();

  let practicalTestQuery = "";
  if (isEdit) {
    practicalTestQuery = `
      UPDATE hr_schema.practical_test_table
      SET
        practical_test_date_updated = '${currentDate}',
        practical_test_label = '${practical_test_label.trim()}',
        practical_test_passing_score = ${practical_test_passing_score},
        practical_test_updated_by = '${teamMemberId}'
      WHERE practical_test_id = '${practicalTestId}'
    `;
  } else {
    practicalTestQuery = `
      INSERT INTO hr_schema.practical_test_table
      (
        practical_test_id,
        practical_test_label,
        practical_test_passing_score,
        practical_test_created_by,
        practical_test_team_id
      )
      VALUES
      (
        '${practicalTestId}',
        '${practical_test_label.trim()}',
        ${practical_test_passing_score},
        '${teamMemberId}',
        '${teamId}'
      )
    `;
  }

  const practicalTestPositionList: string[] = [];
  const positionList: string[] = [];
  practical_test_position_list.forEach((position) => {
    practicalTestPositionList.push(`('${practicalTestId}', '${position}')`);
    positionList.push(`'${position}'`);
  });

  const practicalTestPositionInput = practicalTestPositionList.join(", ");

  const fieldList: string[] = [];
  const practicalTestQuestionList: string[] = [];

  practical_test_question_list.forEach((question, index) => {
    const fieldId = uuidv4();
    fieldList.push(
      `('${fieldId}', '${question.practical_test_question.trim()}', true, 'NUMBER', ${
        index + 1
      }, 'ebda2641-77c2-4d0b-a117-84daadd5eb27')`
    );
    practicalTestQuestionList.push(
      `('${question.practical_test_question.trim()}', ${
        question.practical_test_question_weight
      }, ${index + 1}, '${fieldId}', '${practicalTestId}')`
    );
  });

  const fieldInput = fieldList.join(", ");
  const practicalTestQuestionInput = practicalTestQuestionList.join(", ");

  const { error } = await supabaseClient.rpc("create_practical_test_form", {
    input_data: {
      practicalTestQuery,
      practicalTestPositionInput,
      fieldInput,
      practicalTestQuestionInput,
      practicalTestId: isEdit ? practicalTestId : "",
      positionList: positionList.join(", "),
    },
  });
  if (error) throw error;
};

export const createAssetRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    InventoryFormValues: InventoryFormValues;
    formId: string;
    teamMemberId?: string;
    teamId: string;
    formName: string;
    teamName: string;
  }
) => {
  const { InventoryFormValues, teamMemberId, teamId } = params;
  const { data: tagId, error: tagError } = await supabaseClient
    .schema("inventory_request_schema")
    .from("inventory_request_table")
    .select("inventory_request_tag_id")
    .order("inventory_request_tag_id", { ascending: false })
    .limit(1);

  if (tagError) throw tagError;

  const newTagId = tagId[0].inventory_request_tag_id + 1;
  const requestId = uuidv4();
  const fieldResponse: InventoryRequestResponseInsert[] = [];
  const fieldValue = [];

  for (const section of InventoryFormValues.sections) {
    for (const field of section.section_field) {
      const responseValue = field.field_response;

      if (field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_field_id: field.field_id,
          inventory_response_value: String(responseValue),
          inventory_response_request_id: requestId,
        });
      } else if (!field.field_is_custom_field) {
        const formattedResponse =
          typeof responseValue === "string" || typeof responseValue === "number"
            ? capitalizeFirstWord(String(responseValue))
            : responseValue instanceof Date
              ? responseValue.toISOString()
              : "";

        if (field.field_type === "date" && responseValue) {
          fieldValue.push({
            response:
              responseValue instanceof Date
                ? responseValue.toISOString()
                : new Date(responseValue as string).toISOString(),
          });
        }
        fieldValue.push({
          response: formattedResponse,
        });
      }
    }
  }

  const responseValues = fieldResponse
    .map((response) => {
      const responseValue = capitalizeFirstWord(
        response.inventory_response_value ?? ""
      );
      return `('${responseValue}', '${response.inventory_response_field_id}', '${response.inventory_response_request_id}')`;
    })
    .join(", ");

  const assetResponseValue = `('${requestId}','${teamMemberId}','${teamId}','${newTagId}', ${fieldValue
    .map((response) => `'${capitalizeFirstWord(response.response ?? "")}'`)
    .join(", ")})`;

  const requestData = {
    responseValues,
    assetResponseValue,
    requestId,
  };

  const { data, error } = await supabaseClient
    .rpc("create_asset", {
      input_data: requestData,
    })
    .select()
    .single();

  if (error) throw error;

  return data as InventoryRequestRow;
};

export const updateAssetRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    InventoryFormValues: InventoryFormValues;
    formId: string;
    teamMemberId?: string;
    teamId: string;
    formName: string;
    teamName: string;
    requestId: string;
  }
) => {
  const { InventoryFormValues, teamMemberId, requestId } = params;

  const {
    csi_code,
    description,
    asset_name,
    brand,
    model,
    serial_number,
    equipment_type,
    old_asset_number,
    category,
    sub_category,
    site,
    location,
    department,
    purchase_order,
    purchase_date,
    purchase_form,
    cost,
    si_number,
  } = extractInventoryData(InventoryFormValues);

  const assetId = await getAssetId(supabaseClient, {
    tagId: requestId,
  });

  const fieldResponse: InventoryRequestResponseInsert[] = [];

  for (const section of InventoryFormValues.sections) {
    for (const field of section.section_field) {
      if (field.field_is_sub_category || field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_field_id: field.field_id,
          inventory_response_value: field.field_response as string,
          inventory_response_request_id: assetId,
        });
      }
    }
  }

  const formattedResponseValues = fieldResponse
    .filter((response) => response.inventory_response_value !== null)
    .map((response) => {
      return `('${capitalizeFirstWord(response.inventory_response_value)}', '${response.inventory_response_field_id}', '${response.inventory_response_request_id}')`;
    });

  const responseValues =
    formattedResponseValues.length > 0 ? formattedResponseValues.join(",") : [];

  const requestData = {
    assetId,
    teamMemberId,
    asset_name,
    csi_code,
    description,
    brand,
    model,
    serial_number,
    old_asset_number,
    equipment_type,
    category,
    sub_category,
    site,
    location,
    department,
    purchase_order,
    purchase_date,
    purchase_form,
    cost,
    si_number,
    responseValues,
  };

  const { error } = await supabaseClient
    .rpc("update_asset", {
      input_data: requestData,
    })
    .select()
    .single();

  if (error) throw error;

  return requestId;
};

export const getItemOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_item_option", {
    input_data: params,
  });
  if (error) throw error;

  return data as { item_id: string; value: string }[];
};

export const createDataDrawer = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    type: string;
    InventoryFormValues: InventoryAssetFormValues;
    teamId?: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("create_drawer_data", {
    input_data: params,
  });

  if (error) throw error;

  return data as InventoryResponseValues;
};

export const createAssetLinking = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    linkedAssets: string[];
    assetId: string;
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("create_asset_link", {
    input_data: params,
  });

  if (error) throw error;

  return data;
};

export const updateSecurityGroup = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    securityGroupsFormValues?: securityGroupsFormValues;
    permissionsFormValues?: permissionsFormValues;
    groupId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("update_security_group", {
    input_data: params,
  });

  if (error) throw error;

  return data;
};

export const createCustomFields = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    customFieldFormValues: customFieldFormValues;
    sectionId: string;
  }
) => {
  const { customFieldFormValues, sectionId } = params;
  const fieldId = uuidv4();

  const { data: fieldData, error: fieldError } = await supabaseClient
    .schema("inventory_schema")
    .from("field_table")
    .select("field_order")
    .order("field_order", { ascending: false })
    .eq("field_section_id", sectionId)
    .limit(1);

  if (fieldError) throw new Error();

  const fieldValue = `
  '${fieldId}', '${customFieldFormValues.fieldName}',
  '${customFieldFormValues.fieldIsRequired}', '${customFieldFormValues.fieldType}',
  ${fieldData[0].field_order + 1}, TRUE, '${sectionId}'
`;

  const optionsValues = customFieldFormValues.fieldOption
    ? customFieldFormValues.fieldOption
        .map((option, index) => {
          return `('${option}', ${index + 1}, '${fieldId}')`;
        })
        .join(", ")
    : [];
  const categoriesValues =
    customFieldFormValues.fieldCategory &&
    customFieldFormValues.fieldCategory.length > 0
      ? customFieldFormValues.fieldCategory
          .map((categoryId) => {
            return `('${fieldId}', '${categoryId}')`;
          })
          .join(", ")
      : null;

  const input_data = {
    fieldValue,
    optionsValues,
    categoriesValues,
  };
  const { data, error } = await supabaseClient.rpc("create_custom_field", {
    input_data: input_data,
  });

  if (error) throw error;

  return data as unknown as InventoryFieldRow;
};

export const createCustomEvent = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    createEventFormvalues: createEventFormvalues;
    teamMemberId: string;
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("create_custom_event", {
    input_data: params,
  });

  if (error) throw error;

  return data;
};

export const handleSignatureUpload = async (
  supabaseClient: SupabaseClient<Database>,
  file: File,
  field: string,
  userId: string
) => {
  const fileType = getFileType(field);
  const uploadParams = {
    bucket: "USER_SIGNATURES" as AttachmentBucketType,
    fileType,
    userId,
  };

  const isImage = file.type.split("/")[0] === "image";

  if (isImage) {
    const editedFile = await editImageWithUUID(file);
    const uploadResponse = await uploadImage(supabaseClient, {
      ...uploadParams,
      image: editedFile,
    });
    return uploadResponse.publicUrl;
  } else {
    const uploadResponse = await uploadFile(supabaseClient, {
      ...uploadParams,
      file,
    });
    return uploadResponse.publicUrl;
  }
};

export const handleAssetImageUpload = async (
  supabaseClient: SupabaseClient<Database>,
  file: File,
  field: string,
  userId: string
) => {
  const fileType = getFileType(field);
  const uploadParams = {
    bucket: "ASSET_IMAGE_ATTACHMENTS" as AttachmentBucketType,
    fileType,
    userId,
  };

  const isImage = file.type.split("/")[0] === "image";

  if (isImage) {
    const editedFile = await editImageWithUUID(file);
    const uploadResponse = await uploadImage(supabaseClient, {
      ...uploadParams,
      image: editedFile,
    });
    return uploadResponse.publicUrl;
  } else {
    const uploadResponse = await uploadFile(supabaseClient, {
      ...uploadParams,
      file,
    });
    return uploadResponse.publicUrl;
  }
};

export const createInventoryEmployee = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    EmployeeData: InventoryFormValues;
  }
) => {
  const { EmployeeData } = params;
  const employeeId = uuidv4();
  const employeeResponse = [];
  const fieldResponse: InventoryRequestResponseInsert[] = [];
  let siteName = null;
  let departmentName = null;
  let locationName = null;

  for (const section of EmployeeData.sections) {
    for (const field of section.section_field) {
      const responseValue =
        typeof field.field_response === "string" ||
        typeof field.field_response === "number"
          ? String(field.field_response).trim() || ""
          : "";

      if (field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_request_id: employeeId,
          inventory_response_field_id: field.field_id,
          inventory_response_value: responseValue,
        });
        continue;
      }

      switch (field.field_name) {
        case "Site":
          siteName = responseValue;
          break;
        case "Location":
          locationName = responseValue;
          break;
        case "Department":
          departmentName = responseValue;
          break;
        default:
          employeeResponse.push({
            response: responseValue,
          });
      }
    }
  }

  const responseValues = fieldResponse
    .map(
      (response) =>
        `('${capitalizeFirstWord(
          response.inventory_response_value
        )}', '${response.inventory_response_field_id}', '${response.inventory_response_request_id}')`
    )
    .join(",");

  const employeeResponseValue = `('${employeeId}', ${employeeResponse
    .map((response) => `'${response.response.toUpperCase()}'`)
    .join(", ")})`;

  const inputData = {
    employeeResponseValue,
    responseValues,
    siteName,
    departmentName,
    locationName,
  };

  const { data, error } = await supabaseClient.rpc(
    "create_update_employee_data",
    {
      input_data: inputData,
    }
  );
  if (error) throw error;

  return data;
};

export const uploadCSVFileEmployee = async (
  supabaseClient: SupabaseClient<Database>,
  params: { parsedData: InventoryEmployeeList[] }
) => {
  const { parsedData } = params;
  const { data, error } = await supabaseClient.rpc("import_employee_data", {
    input_data: { employees: parsedData },
  });

  if (error) throw error;

  return data;
};

export const uploadCSVFileCustomer = async (
  supabaseClient: SupabaseClient<Database>,
  params: { parsedData: InventoryCustomerRow[]; teamId: string }
) => {
  const { parsedData, teamId } = params;
  const { data, error } = await supabaseClient.rpc("import_customer_data", {
    input_data: { customer: parsedData, teamId: teamId },
  });

  if (error) throw error;

  return data;
};

export const createInventoryCustomer = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    customerData: InventoryFormValues;
    teamId: string;
  }
) => {
  const { customerData, teamId } = params;
  const customerId = uuidv4();
  const customerResponse = [];
  const fieldResponse: InventoryRequestResponseInsert[] = [];

  for (const section of customerData.sections) {
    for (const field of section.section_field) {
      const responseValue =
        typeof field.field_response === "string" ||
        typeof field.field_response === "number"
          ? String(field.field_response).trim() || ""
          : "";

      if (field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_request_id: customerId,
          inventory_response_field_id: field.field_id,
          inventory_response_value: responseValue,
        });
        continue;
      } else if (!field.field_is_custom_field) {
        customerResponse.push({
          response: responseValue,
        });
        continue;
      }
    }
  }

  const responseValues = fieldResponse
    .map(
      (response) =>
        `('${capitalizeFirstWord(
          response.inventory_response_value
        )}', '${response.inventory_response_field_id}', '${response.inventory_response_request_id}')`
    )
    .join(",");

  const customerResponseValue = `('${customerId}', '${teamId}',${customerResponse
    .map((customer) => `'${customer.response}'`)
    .join(", ")})`;

  const inputData = {
    customerResponseValue,
    responseValues,
  };

  const { data, error } = await supabaseClient.rpc(
    "create_update_customer_data",
    {
      input_data: inputData,
    }
  );
  if (error) throw error;

  return data;
};

export const checkCustomerName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    customerName: string;
  }
) => {
  const { customerName } = params;
  let isUnique = false;

  const { data, error } = await supabaseClient
    .schema("inventory_schema")
    .from("customer_table")
    .select("customer_name")
    .eq("customer_name", customerName)
    .limit(1);
  if (error) throw error;

  if (data.length > 0) {
    isUnique = true;
  }

  return isUnique;
};

export const uploadCSVFileAssetData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    parsedData: InventoryListType[];
    teamId: string;
    teamMemberId: string;
  }
) => {
  const { parsedData, teamId, teamMemberId } = params;

  const inputData = {
    assetData: parsedData,
    teamId,
    teamMemberId,
  };
  const { data, error } = await supabaseClient.rpc("import_asset_data", {
    input_data: inputData,
  });

  if (error) throw error;

  return data;
};

export const createInventoryWarranty = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    warrantyData: InventoryFormValues;
    tagId: string;
    teamMemberId: string;
    selectedRow?: string;
  }
) => {
  const { warrantyData, tagId, teamMemberId, selectedRow } = params;

  const assetId = await getAssetId(supabaseClient, {
    tagId: tagId,
  });

  const warrantyId = selectedRow ? selectedRow : uuidv4();
  const warrantyResponse = [];
  const fieldResponse: InventoryRequestResponseInsert[] = [];

  for (const section of warrantyData.sections) {
    for (const field of section.section_field) {
      const responseValue =
        typeof field.field_response === "string" ||
        (typeof field.field_response === "number" &&
          field.field_response !== null &&
          field.field_response !== undefined)
          ? String(field.field_response || 0).trim()
          : field.field_response instanceof Date
            ? field.field_response.toISOString()
            : "";

      if (field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_request_id: warrantyId,
          inventory_response_field_id: field.field_id,
          inventory_response_value: responseValue,
        });
        continue;
      } else if (!field.field_is_custom_field) {
        warrantyResponse.push({
          response: responseValue,
        });
        continue;
      }
    }
  }

  const warrantyResponseValue = `('${warrantyId}', '${assetId}',${warrantyResponse
    .map((warranty) => `'${warranty.response || ""}'`)
    .join(", ")})`;

  const inputData = {
    warrantyResponseValue,
    requestId: assetId,
    customResponseId: warrantyId,
    fieldResponse,
    teamMemberId,
  };

  const { data, error } = await supabaseClient.rpc(
    "create_update_warranty_data",
    {
      input_data: inputData,
    }
  );
  if (error) throw error;

  return data;
};

export const createInventoryMaitenance = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    maintenanceData: InventoryFormValues;
    tagId?: string;
    teamMemberId: string;
    selectedRow?: string;
  }
) => {
  const { maintenanceData, tagId, teamMemberId, selectedRow } = params;

  const assetId = await getAssetId(supabaseClient, {
    tagId: tagId || "",
  });

  const maintenanceId = selectedRow ? selectedRow : uuidv4();
  const maintenanceResponse = [];
  const fieldResponse: InventoryRequestResponseInsert[] = [];

  for (const section of maintenanceData.sections) {
    for (const field of section.section_field) {
      const responseValue =
        typeof field.field_response === "string" ||
        (typeof field.field_response === "number" &&
          field.field_response !== null &&
          field.field_response !== undefined)
          ? String(field.field_response || 0).trim()
          : field.field_response instanceof Date
            ? field.field_response.toISOString()
            : "";

      if (field.field_is_custom_field) {
        fieldResponse.push({
          inventory_response_request_id: maintenanceId,
          inventory_response_field_id: field.field_id,
          inventory_response_value: responseValue,
        });
        continue;
      } else if (!field.field_is_custom_field) {
        maintenanceResponse.push({
          response: responseValue,
        });
        continue;
      }
    }
  }

  const maintenanceResponseValue = `('${maintenanceId}', '${assetId}',${maintenanceResponse
    .map((maitenance) => `'${maitenance.response || ""}'`)
    .join(", ")})`;

  const inputData = {
    maintenanceResponseValue,
    fieldResponse,
    requestId: assetId,
    customResponseId: maintenanceId,
    teamMemberId,
  };

  const { data, error } = await supabaseClient.rpc(
    "create_update_maintenance_data",
    {
      input_data: inputData,
    }
  );
  if (error) throw error;

  return data;
};
