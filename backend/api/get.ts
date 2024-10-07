import { FilterChartValues } from "@/components/AnalyticsPage/ResponseAnalytics";
import { InventoryFormValues } from "@/components/AssetInventory/CreateAssetPage/CreateAssetPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import { ItemOrderType } from "@/components/ItemFormPage/ItemList/ItemList";
import { MemoFormatFormValues } from "@/components/MemoFormatEditor/MemoFormatEditor";
import { TeamAdminType } from "@/components/TeamPage/TeamGroup/AdminGroup";
import { TeamApproverType } from "@/components/TeamPage/TeamGroup/ApproverGroup";
import { sortFormList } from "@/utils/arrayFunctions/arrayFunctions";
import {
  APP_SOURCE_ID,
  FETCH_OPTION_LIMIT,
  formatDate,
  FORMSLY_FORM_ORDER,
  IT_ASSET_FIELD_ID_LIST,
  ITEM_FIELD_ID_LIST,
  PED_ITEM_FIELD_ID_LIST,
  SELECT_OPTION_LIMIT,
  TECHNICAL_ASSESSMENT_FIELD_LIST,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import {
  addAmpersandBetweenWords,
  escapeQuotes,
  escapeQuotesForObject,
  parseJSONIfValid,
  startCase,
} from "@/utils/string";
import {
  AddressTableRow,
  ApplicationInformationFilterFormValues,
  ApplicationInformationSpreadsheetData,
  ApproverUnresolvedRequestCountType,
  AppType,
  AttachmentBucketType,
  AttachmentTableRow,
  BackgroundCheckFilterFormValues,
  BackgroundCheckSpreadsheetData,
  CategoryTableRow,
  CreateTicketFormValues,
  CreateTicketPageOnLoad,
  CSICodeTableRow,
  Dataset,
  DirectorInterviewFilterFormValues,
  DirectorInterviewSpreadsheetData,
  EquipmentDescriptionTableRow,
  EquipmentPartTableInsert,
  EquipmentPartType,
  EquipmentTableRow,
  FetchRequestListParams,
  FetchUserRequestListParams,
  FieldTableRow,
  FormTableRow,
  FormType,
  HRAnalyticsData,
  HRPhoneInterviewFilterFormValues,
  HRPhoneInterviewSpreadsheetData,
  HRProjectType,
  InitialFormType,
  InterviewOnlineMeetingTableRow,
  InventoryFormType,
  InventoryListType,
  ItemCategoryType,
  ItemCategoryWithSigner,
  ItemDescriptionFieldWithUoM,
  ItemDescriptionTableRow,
  ItemWithDescriptionAndField,
  ItemWithDescriptionType,
  JiraFormslyItemCategoryWithUserDataType,
  JiraFormslyProjectType,
  JiraItemCategoryDataType,
  JiraOrganizationTableRow,
  JiraProjectDataType,
  JobOfferFilterFormValues,
  JobOfferHistoryType,
  JobOfferSpreadsheetData,
  LocationTableRow,
  LRFSpreadsheetData,
  MemoListItemType,
  MemoType,
  NotificationOnLoad,
  NotificationTableRow,
  OptionTableRow,
  OtherExpensesTypeTableRow,
  PendingInviteType,
  QuestionnaireData,
  ReferenceMemoType,
  RequestListItemType,
  RequestListOnLoad,
  RequestResponseTableRow,
  RequestTableRow,
  RequestWithResponseType,
  SectionWithFieldType,
  ServiceWithScopeAndChoice,
  SignatureHistoryTableRow,
  SignerRequestSLA,
  SignerWithProfile,
  SiteTableRow,
  SSOTOnLoad,
  SubCategoryData,
  TeamMemberOnLoad,
  TeamMemberType,
  TeamMemberWithUser,
  TeamMemberWithUserDetails,
  TeamOnLoad,
  TeamProjectTableRow,
  TeamTableRow,
  TechnicalAssessmentTableRow,
  TechnicalInterviewFilterFormValues,
  TechnicalInterviewSpreadsheetData,
  TicketListOnLoad,
  TicketListType,
  TicketPageOnLoad,
  TicketStatusType,
  TradeTestFilterFormValues,
  TradeTestSpreadsheetData,
  TransactionTableRow,
  UserIssuedItem,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";
import moment from "moment";
import {
  getBarangay,
  getCity,
  getProvince,
  getRegion,
  getTransactionList,
  Database as OneOfficeDatabase,
} from "oneoffice-api";
import { v4 as uuidv4, validate } from "uuid";

const REQUEST_STATUS_LIST = ["PENDING", "APPROVED", "REJECTED"];

// Get file url
export async function getFileUrl(
  supabaseClient: SupabaseClient<Database>,
  params: { path: string; bucket: AttachmentBucketType }
) {
  const { path, bucket } = params;
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .download(`${path}?id=${uuidv4()}`);
  if (error) throw error;

  const url = URL.createObjectURL(data);
  return url;
}

// Get server's current date
export const getCurrentDate = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .rpc("get_current_date")
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw error;

  return new Date(data);
};

// Get server's current date string
export const getCurrentDateString = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .rpc("get_current_date")
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw error;
  return formatDate(data);
};

// Get all the user's team
export const getAllTeamOfUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { userId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .select("*, team:team_table(*)")
    .eq("team_member_is_disabled", false)
    .eq("team_member_user_id", userId);
  if (error) throw error;
  const teamList = data
    .map((teamMember) => {
      return teamMember.team as TeamTableRow;
    })
    .sort((a, b) => {
      return Date.parse(b.team_date_created) - Date.parse(a.team_date_created);
    });

  return teamList;
};

// Get user
export const getUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { userId } = params;
  const { data, error } = await supabaseClient
    .schema("user_schema")
    .from("user_table")
    .select("*")
    .eq("user_is_disabled", false)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
};

// Get form list
export const getFormList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    app: string;
    memberId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_form_list", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

// Get request list
export const getRequestList = async (
  supabaseClient: SupabaseClient<Database>,
  params: FetchRequestListParams
) => {
  const {
    teamId,
    page,
    limit,
    requestor,
    approver,
    status,
    form,
    isAscendingSort,
    search,
    isApproversView,
    teamMemberId,
    project,
    columnAccessor = "request_date_created",
  } = params;

  const sort = isAscendingSort ? "ASC" : "DESC";

  const requestorCondition = requestor
    ?.map((value) => `request_view.request_team_member_id = '${value}'`)
    .join(" OR ");
  const approverCondition = approver
    ?.map((value) => `signer_table.signer_team_member_id = '${value}'`)
    .join(" OR ");
  const statusCondition = status
    ?.map((value) => `request_view.request_status = '${value}'`)
    .join(" OR ");
  const formCondition = form
    ?.map((value) => `request_view.request_form_id = '${value}'`)
    .join(" OR ");
  const projectCondition = project
    ?.map(
      (value) =>
        `request_view.request_formsly_id_prefix ILIKE '${value}' || '%'`
    )
    .join(" OR ");

  const searchCondition =
    search && validate(search)
      ? `request_view.request_id = '${search}'`
      : `request_view.request_formsly_id ILIKE '%' || '${search}' || '%'`;

  const { data: data, error } = await supabaseClient.rpc("fetch_request_list", {
    input_data: {
      teamId: teamId,
      page: page,
      limit: limit,
      requestor: requestorCondition ? `AND (${requestorCondition})` : "",
      approver: approverCondition ? `AND (${approverCondition})` : "",
      project: projectCondition ? `AND (${projectCondition})` : "",
      form: formCondition ? `AND (${formCondition})` : "",
      status: statusCondition ? `AND (${statusCondition})` : "",
      search: search ? `AND (${searchCondition})` : "",
      sort,
      isApproversView,
      teamMemberId,
      columnAccessor,
    },
  });

  if (error || !data) throw error;
  const dataFormat = data as unknown as {
    data: RequestListItemType[];
    count: number;
  };

  return { data: dataFormat.data, count: dataFormat.count };
};

// Get user's active team id
export const getUserActiveTeamId = async (
  supabaseClient: SupabaseClient<Database>,
  params: { userId: string }
) => {
  const { userId } = params;

  const { data: activeTeamId, error } = await supabaseClient
    .rpc("get_user_active_team_id", { user_id: userId })
    .select("*")
    .single();
  if (error) throw error;

  return activeTeamId;
};

// Get user with signature attachment
export const getUserWithSignature = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_user_with_signature", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

// Check username if it already exists
export const checkUsername = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    username: string;
  }
) => {
  const { username } = params;
  const { data, error } = await supabaseClient
    .schema("user_schema")
    .from("user_table")
    .select("user_username")
    .eq("user_username", username)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Get specific team
export const getTeam = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_table")
    .select("*")
    .eq("team_id", teamId)
    .eq("team_is_disabled", false)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Get user's team member id
export const getUserTeamMemberData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    teamId: string;
  }
) => {
  const { userId, teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .select("*")
    .eq("team_member_user_id", userId)
    .eq("team_member_team_id", teamId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Get form list with filter
export const getFormListWithFilter = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    app: string;
    page: number;
    limit: number;
    creator?: string[];
    status?: "hidden" | "visible";
    sort?: "ascending" | "descending";
    search?: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_form_list_with_filter", { input_data: params })
    .select("*");
  if (error) throw error;
  const formattedData = data as unknown as {
    data: FormTableRow[];
    count: number;
  };
  const sortedFormList = sortFormList(formattedData.data, FORMSLY_FORM_ORDER);

  return { data: sortedFormList, count: formattedData.count };
};

// Get specific form
export const getForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_form", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as InitialFormType;
};

// Get notification
export const getAllNotification = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    app: AppType;
    page: number;
    limit: number;
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_all_notification", { input_data: params })
    .select("*")
    .single();

  if (error) throw error;

  return data as { data: NotificationTableRow[]; count: number };
};

// Get item list
export const getItemList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    limit: number;
    page: number;
    generalName: string;
    description: string;
    unitOfMeasurement: string;
    glAccount: string;
    division: string;
    status: string;
    sortColumn?: ItemOrderType;
    sortOrder?: string;
    isPedItem?: boolean;
    isITAsset?: boolean;
  }
) => {
  const {
    teamId,
    limit,
    page,
    generalName,
    description,
    unitOfMeasurement,
    glAccount,
    division,
    status,
    sortColumn,
    sortOrder,
    isPedItem,
    isITAsset,
  } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select(
      `
        *,
        item_division_table!inner(*),
        item_description: item_description_table!inner(*),
        item_level_three_description: item_level_three_description_table(*)
      `,
      {
        count: "exact",
      }
    )
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_description.item_description_is_disabled", false);

  if (generalName) {
    query = query.ilike("item_general_name", `%${generalName}%`);
  }
  if (description) {
    query = query.ilike(
      "item_description.item_description_label",
      `${description}%`
    );
  }
  if (unitOfMeasurement) {
    query = query.eq("item_unit", `${unitOfMeasurement}`);
  }
  if (glAccount) {
    query = query.eq("item_gl_account", `${glAccount}`);
  }
  if (division) {
    query = query.eq("item_division_table.item_division_value", `${division}`);
  }
  if (status) {
    switch (status) {
      case "active":
        query = query.eq("item_is_available", true);
        break;
      case "inactive":
        query = query.eq("item_is_available", false);
        break;
    }
  }
  if (isPedItem !== undefined) {
    query = query.eq("item_is_ped_item ", isPedItem);
  }

  if (isITAsset !== undefined) {
    query = query.eq("item_is_it_asset_item ", isITAsset);
  }

  if (sortColumn) {
    query.order(sortColumn, {
      ascending: sortOrder === "asc",
    });
  } else {
    query.order("item_general_name", {
      ascending: true,
    });
  }

  query.order("item_description_order", {
    foreignTable: "item_description",
    ascending: true,
  });
  query.order("item_division_value", {
    foreignTable: "item_division_table",
    ascending: true,
  });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  const formattedData = data as unknown as (ItemWithDescriptionType & {
    item_division_table: { item_division_value: string }[];
    item_level_three_description: { item_level_three_description: string }[];
  })[];

  return {
    data: formattedData.map((data) => {
      return {
        ...data,
        item_division_id_list: data.item_division_table.map(
          (division: { item_division_value: string }) =>
            division.item_division_value
        ),
        item_level_three_description:
          data.item_level_three_description.length !== 0
            ? data.item_level_three_description[0].item_level_three_description
            : "",
      };
    }),
    count,
  };
};

// Get all items
export const getAllItems = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; search?: string }
) => {
  const { teamId, search } = params;
  let query = supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .order("item_general_name", { ascending: true });

  if (search) {
    query = query.ilike("item_general_name", `${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
};

// Get item description list
export const getItemDescriptionList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { itemId: string; limit: number; page: number; search?: string }
) => {
  const { itemId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("item_schema")
    .from("item_description_table")
    .select("*", {
      count: "exact",
    })
    .eq("item_description_item_id", itemId)
    .eq("item_is_disabled", false);

  if (search) {
    query = query.ilike("item_description_label", `%${search}%`);
  }

  query.order("item_description_date_created", { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get item description field list
export const getItemDescriptionFieldList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    descriptionId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { descriptionId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("item_schema")
    .from("item_description_field_table")
    .select(
      "*, item_description_field_uom: item_description_field_uom_table(item_description_field_uom)",
      {
        count: "exact",
      }
    )
    .eq("item_description_field_item_description_id", descriptionId)
    .eq("item_description_field_is_disabled", false);

  if (search) {
    query = query.ilike("item_description_field_value", `%${search}%`);
  }

  query.order("item_description_field_value", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data as ItemDescriptionFieldWithUoM[],
    count,
  };
};

// get item
export const getItem = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; itemName: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_item", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as ItemWithDescriptionAndField;
};

// check if Item form can be activated
export const checkItemFormStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; formId: string }
) => {
  const { teamId, formId } = params;

  const { data, error } = await supabaseClient
    .rpc("check_item_form_status", {
      form_id: formId,
      team_id: teamId,
    })
    .select("*")
    .single();
  if (error) throw error;

  return data === "true" ? true : (data as string);
};

// check if Subcon form can be activated
export const checkSubconFormStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; formId: string }
) => {
  const { teamId, formId } = params;

  const { data, error } = await supabaseClient
    .rpc("check_subcon_form_status", {
      form_id: formId,
      team_id: teamId,
    })
    .select("*")
    .single();
  if (error) throw error;

  return data === "true" ? true : (data as string);
};

// check if item name already exists
export const checkItemName = async (
  supabaseClient: SupabaseClient<Database>,
  params: { itemName: string; teamId: string }
) => {
  const { itemName, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("*", { count: "exact", head: true })
    .eq("item_general_name", itemName)
    .eq("item_is_disabled", false)
    .eq("item_team_id", teamId);
  if (error) throw error;

  return Boolean(count);
};

// check if item description already exists
export const checkItemDescription = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemDescription: string;
    itemDescriptionUom: string;
    descriptionId: string;
  }
) => {
  const { itemDescription, itemDescriptionUom, descriptionId } = params;

  let query = supabaseClient
    .schema("item_schema")
    .from("item_description_field_table")
    .select(
      `*${
        itemDescriptionUom
          ? ",item_description_field_uom: item_description_field_uom_table!inner(item_description_field_uom) "
          : ""
      }`,
      {
        count: "exact",
        head: true,
      }
    )
    .eq("item_description_field_value", itemDescription)
    .eq("item_description_field_is_disabled", false)
    .eq("item_description_field_item_description_id", descriptionId);

  if (itemDescriptionUom) {
    query = query.eq(
      "item_description_field_uom.item_description_field_uom",
      itemDescriptionUom
    );
  }

  const { count, error } = await query;
  if (error) throw error;

  return Boolean(count);
};

// Get team member list
export const getTeamMemberList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_member_list", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as TeamMemberType[];
};

// Get invitation
export const getInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    invitationId: string;
    userEmail: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_invitation", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

// Get notification list
export const getNotificationList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    app: AppType;
    page: number;
    limit: number;
    unreadOnly: boolean;
    teamId: string | null;
  }
) => {
  const { userId, app, page, limit, teamId, unreadOnly } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("notification_table")
    .select("*", {
      count: "exact",
    })
    .eq("notification_user_id", userId)
    .or(`notification_app.eq.GENERAL, notification_app.eq.${app}`);

  if (teamId) {
    query = query.or(
      `notification_team_id.eq.${teamId}, notification_team_id.is.${null}`
    );
  } else {
    query = query.is("notification_team_id", null);
  }

  if (unreadOnly) {
    query = query.eq("notification_is_read", false);
  }

  query = query.order("notification_date_created", { ascending: false });
  query = query.limit(limit);
  query = query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return { data, count };
};

// Get list of db that only have name column
export const getNameList = async (
  supabaseClient: SupabaseClient,
  params: {
    table: string;
    teamId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { table, teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .from(`${table}_table`)
    .select("*", {
      count: "exact",
    })
    .eq(`${table}_team_id`, teamId)
    .eq(`${table}_is_disabled`, false);

  if (search) {
    query = query.ilike(`${table}_name`, `%${search}%`);
  }

  query.order(`${table}_date_created`, { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get all db that only have name column
export const getAllNames = async (
  supabaseClient: SupabaseClient,
  params: { table: string; teamId: string }
) => {
  const { table, teamId } = params;
  const { data, error } = await supabaseClient
    .from(`${table}_table`)
    .select("*")
    .eq(`${table}_team_id`, teamId)
    .eq(`${table}_is_disabled`, false)
    .eq(`${table}_is_available`, true)
    .order(`${table}_name`, { ascending: true });

  if (error) throw error;

  return data;
};

// check if db that only have name column's name already exists
export const checkName = async (
  supabaseClient: SupabaseClient,
  params: { table: string; name: string; teamId: string }
) => {
  const { table, name, teamId } = params;

  const { count, error } = await supabaseClient
    .from(`${table}_table`)
    .select("*", { count: "exact", head: true })
    .eq(`${table}_name`, name)
    .eq(`${table}_is_disabled`, false)
    .eq(`${table}_team_id`, teamId);
  if (error) throw error;

  return Boolean(count);
};

// Get processor list
export const getProcessorList = async (
  supabaseClient: SupabaseClient,
  params: {
    processor: string;
    teamId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { processor, teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .from(`${processor}_processor_table`)
    .select(`*`, {
      count: `exact`,
    })
    .eq(`${processor}_processor_team_id`, teamId)
    .eq(`${processor}_processor_is_disabled`, false);

  if (search) {
    query = query.or(
      `${processor}_processor_first_name.ilike.%${search}%, ${processor}_processor_last_name.ilike.%${search}%, ${processor}_processor_employee_number.ilike.%${search}%`
    );
  }

  query.order(`${processor}_processor_date_created`, { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get processors
export const getAllProcessors = async (
  supabaseClient: SupabaseClient,
  params: { processor: string; teamId: string }
) => {
  const { processor, teamId } = params;
  const { data, error } = await supabaseClient
    .from(`${processor}_processor_table`)
    .select(`*`)
    .eq(`${processor}_processor_team_id`, teamId)
    .eq(`${processor}_processor_is_disabled`, false)
    .eq(`${processor}_processor_is_available`, true)
    .order(`${processor}_processor_first_name`, { ascending: true });

  if (error) throw error;

  return data;
};

// check if procesor already exists
export const checkProcessor = async (
  supabaseClient: SupabaseClient,
  params: {
    processor: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    teamId: string;
  }
) => {
  const { processor, firstName, lastName, employeeNumber, teamId } = params;

  const { count, error } = await supabaseClient
    .from(`${processor}_processor_table`)
    .select(`*`, { count: `exact`, head: true })
    .eq(`${processor}_processor_first_name`, firstName)
    .eq(`${processor}_processor_last_name`, lastName)
    .eq(`${processor}_processor_employee_number`, employeeNumber)
    .eq(`${processor}_processor_is_disabled`, false)
    .eq(`${processor}_processor_team_id`, teamId);
  if (error) throw error;

  return Boolean(count);
};

// Get receiver list
export const getReceiverList = async (
  supabaseClient: SupabaseClient,
  params: {
    receiver: string;
    teamId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { receiver, teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .from(`${receiver}_receiver_table`)
    .select(`*`, {
      count: `exact`,
    })
    .eq(`${receiver}_receiver_team_id`, teamId)
    .eq(`${receiver}_receiver_is_disabled`, false);

  if (search) {
    query = query.or(
      `${receiver}_receiver_first_name.ilike.%${search}%, ${receiver}_receiver_last_name.ilike.%${search}%, ${receiver}_receiver_employee_number.ilike.%${search}%`
    );
  }

  query.order(`${receiver}_receiver_date_created`, { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get receivers
export const getAllReceivers = async (
  supabaseClient: SupabaseClient,
  params: { receiver: string; teamId: string }
) => {
  const { receiver, teamId } = params;
  const { data, error } = await supabaseClient
    .from(`${receiver}_receiver_table`)
    .select(`*`)
    .eq(`${receiver}_receiver_team_id`, teamId)
    .eq(`${receiver}_receiver_is_disabled`, false)
    .eq(`${receiver}_receiver_is_available`, true)
    .order(`${receiver}_receiver_first_name`, { ascending: true });

  if (error) throw error;

  return data;
};

// check if receiver already exists
export const checkReceiver = async (
  supabaseClient: SupabaseClient,
  params: {
    receiver: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    teamId: string;
  }
) => {
  const { receiver, firstName, lastName, employeeNumber, teamId } = params;

  const { count, error } = await supabaseClient
    .from(`${receiver}_receiver_table`)
    .select(`*`, { count: `exact`, head: true })
    .eq(`${receiver}_receiver_first_name`, firstName)
    .eq(`${receiver}_receiver_last_name`, lastName)
    .eq(`${receiver}_receiver_employee_number`, employeeNumber)
    .eq(`${receiver}_receiver_is_disabled`, false)
    .eq(`${receiver}_receiver_team_id`, teamId);
  if (error) throw error;

  return Boolean(count);
};

// Check if the request id exists and already approved
export const checkRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string[];
  }
) => {
  const { requestId } = params;

  let requestCondition = "";
  requestId.forEach((id) => {
    requestCondition += `request_id.eq.${id}, `;
  });

  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", { count: "exact" })
    .or(requestCondition.slice(0, -2))
    .eq("request_status", "APPROVED")
    .eq("request_is_disabled", false);

  if (error) throw error;
  return count === requestId.length;
};

// Check if the request is pending
export const checkRequsitionRequestForReleaseOrder = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemId: string;
  }
) => {
  const { itemId } = params;

  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", { count: "exact" })
    .eq("request_id", itemId)
    .eq("request_status", "PENDING")
    .eq("request_is_disabled", false);

  if (error) throw error;
  return Boolean(count);
};

// Check if request is pending
export const checkIfRequestIsEditable = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;

  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_signer_table")
    .select("request_signer_status")
    .eq("request_signer_request_id", requestId);
  if (error) throw error;

  const statusList = data as { request_signer_status: string }[];
  const isPending = !statusList.some(
    (status) => status.request_signer_status.toUpperCase() !== "PENDING"
  );
  return isPending;
};

// Get response data by keyword
export const getResponseDataByKeyword = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    keyword: string;
    formId: string;
  }
) => {
  const { keyword, formId } = params;
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select(
      "*, response_field: request_response_field_id!inner(*), request_form: request_response_request_id!inner(request_id, request_form_id)"
    )
    .eq("request_form.request_form_id", formId)
    .in("response_field.field_type", ["TEXT", "TEXTAREA"])
    .ilike("request_response", `%${keyword}%`);

  if (error) throw error;

  return data;
};

// Check user if owner or approver
export const checkIfOwnerOrAdmin = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    teamId: string;
  }
) => {
  const { userId, teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .select("team_member_role")
    .eq("team_member_user_id", userId)
    .eq("team_member_team_id", teamId)
    .maybeSingle();
  if (error) throw error;
  const role = data?.team_member_role;
  if (role === null) return false;
  return role === "ADMIN" || role === "OWNER";
};

// Check if the approving or creating quotation or sourced item quantity are less than the item quantity
export const checkItemQuantity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    itemID: string;
    itemFieldList: RequestResponseTableRow[];
    quantityFieldList: RequestResponseTableRow[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_item_quantity", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as string[];
};

// Check if the approving or creating rir item quantity are less than the quotation quantity
export const checkRIRItemQuantity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    quotationId: string;
    itemFieldId: string;
    quantityFieldId: string;
    itemFieldList: RequestResponseTableRow[];
    quantityFieldList: RequestResponseTableRow[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_rir_item_quantity", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as string[];
};

// Check if the approving or creating release order item quantity are less than the quotation quantity
export const checkROItemQuantity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sourcedItemId: string;
    itemFieldId: string;
    quantityFieldId: string;
    itemFieldList: RequestResponseTableRow[];
    quantityFieldList: RequestResponseTableRow[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_ro_item_quantity", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as string[];
};

// Check if the approving or creating transfer receipt item quantity are less than the release order quantity
export const checkTransferReceiptItemQuantity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    releaseOrderItemId: string;
    itemFieldId: string;
    quantityFieldId: string;
    itemFieldList: RequestResponseTableRow[];
    quantityFieldList: RequestResponseTableRow[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_tranfer_receipt_item_quantity", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as string[];
};

// Get request per status count
export const getRequestStatusCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    teamId: string;
    startDate: string;
    endDate: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_request_status_count", {
      input_data: { ...params, requestStatusList: REQUEST_STATUS_LIST },
    })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: { label: string; value: number }[];
    totalCount: number;
  };

  return {
    requestStatusCountData: formattedData.data,
    totalCount: formattedData.totalCount,
  };
};

export const getRequestorData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    teamMemberId: string;
    startDate: string;
    endDate: string;
  }
) => {
  const { formId, teamMemberId, startDate, endDate } = params;

  const getRequestCount = (status: string) =>
    supabaseClient
      .schema("request_schema")
      .from("request_table")
      .select("*", { count: "exact", head: true })
      .eq("request_form_id", formId)
      .eq("request_status", status)
      .eq("request_team_member_id", teamMemberId)
      .gte("request_date_created", startDate)
      .lte("request_date_created", endDate);

  const data = await Promise.all(
    REQUEST_STATUS_LIST.map(async (status) => {
      const { count: statusCount } = await getRequestCount(status);

      return {
        label: startCase(status.toLowerCase()),
        value: statusCount || 0,
      };
    })
  );

  return data;
};

export const getRequestStatusMonthlyCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    teamId: string;
    startDate: string;
    endDate: string;
  }
) => {
  const { formId, teamId, startDate, endDate } = params;

  // Generate the list of month ranges within the specified date range
  // Generate the list of month ranges within the specified date range
  const startDateObj = moment(startDate);
  const endDateObj = moment(endDate).endOf("month");

  const monthRanges = [];
  while (startDateObj.isSameOrBefore(endDateObj, "month")) {
    const startOfMonth = startDateObj.clone().startOf("month");
    const endOfMonth = startDateObj.clone().endOf("month");

    monthRanges.push({
      start_of_month: startOfMonth.format(),
      end_of_month: endOfMonth.isSameOrBefore(endDateObj)
        ? endOfMonth.format()
        : endDateObj.format(),
    });

    startDateObj.add(1, "month");
  }

  const { data: monthlyData, error: monthlyError } = await supabaseClient
    .rpc("get_request_status_monthly_count", {
      input_data: {
        formId,
        teamId,
        monthRanges,
      },
    })
    .select("*");
  if (monthlyError) throw monthlyError;

  const { data: totalCount, error: totalError } = await supabaseClient
    .rpc("get_request_total_count", {
      input_data: {
        formId,
        teamId,
        startDate,
        endDate,
      },
    })
    .select("*");
  if (totalError) throw totalError;

  return {
    data: monthlyData as unknown as {
      month: string;
      pending: number;
      approved: number;
      rejected: number;
    }[],
    totalCount: Number(totalCount),
  };
};

// Get supplier
export const getSupplier = async (
  supabaseClient: SupabaseClient<Database>,
  params: { supplier: string; teamId: string; fieldId: string }
) => {
  const { supplier, teamId, fieldId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("supplier_table")
    .select("supplier")
    .eq("supplier_team_id", teamId)
    .ilike("supplier", `${supplier}%`)
    .order("supplier", { ascending: true })
    .limit(100);
  if (error) throw error;

  const supplierList = data.map((supplier, index) => {
    return {
      option_field_id: fieldId,
      option_id: uuidv4(),
      option_order: index + 1,
      option_value: supplier.supplier,
    };
  });

  return supplierList;
};

// Get CSI
export const getCSI = async (
  supabaseClient: SupabaseClient<Database>,
  params: { csi: string; fieldId: string; divisionIdList: string[] }
) => {
  const { csi, fieldId, divisionIdList } = params;

  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_level_three_description")
    .ilike("csi_code_level_three_description", `${csi}%`)
    .order("csi_code_level_three_description", { ascending: true })
    .in("csi_code_division_id", divisionIdList)
    .limit(100);
  if (error) throw error;

  const csiList = data.map((csi, index) => {
    return {
      option_field_id: fieldId,
      option_id: uuidv4(),
      option_order: index + 1,
      option_value: csi.csi_code_level_three_description,
    };
  });

  return csiList;
};

// Get team member on load
export const getTeamMemberOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_member_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as TeamMemberOnLoad;
};

// Get team group list
export const getTeamGroupList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { teamId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("team_schema")
    .from("team_group_table")
    .select("*", { count: "exact" })
    .eq("team_group_team_id", teamId)
    .eq("team_group_is_disabled", false);

  if (search) {
    query = query.ilike("team_group_name", `%${search}%`);
  }

  query = query.order("team_group_name", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return { data, count };
};

// Get team project list
export const getTeamProjectList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_project_list", { input_data: params })
    .select("*");

  if (error) throw error;

  const formattedData = data as unknown as {
    data: (TeamProjectTableRow & {
      team_project_address: AddressTableRow;
    } & {
      team_project_site_map_attachment: { attachment_value: string | null };
    } & {
      team_project_boq_attachment: { attachment_value: string | null };
    })[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Check if team group exists
export const checkIfTeamGroupExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    groupName: string;
    teamId: string;
  }
) => {
  const { groupName, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_table")
    .select("*", { count: "exact", head: true })
    .eq("team_group_name", groupName)
    .eq("team_group_team_id", teamId)
    .eq("team_group_is_disabled", false);
  if (error) throw error;

  return Boolean(count);
};

// Check if team project exists
export const checkIfTeamProjectExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectName: string;
    teamId: string;
  }
) => {
  const { projectName, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_table")
    .select("*", { count: "exact", head: true })
    .eq("team_project_name", projectName)
    .eq("team_project_team_id", teamId)
    .eq("team_project_is_disabled", false);
  if (error) throw error;

  return Boolean(count);
};

// Get team group member list
export const getTeamGroupMemberList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    groupId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_group_member_list", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: TeamMemberType[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Get all team members without existing member of the group
export const getAllTeamMembersWithoutGroupMembers = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    groupId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_all_team_members_without_group_members", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as TeamMemberWithUserDetails;
};

// Get team project member list
export const getTeamProjectMemberList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_project_member_list", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: TeamMemberType[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Get all team members without existing member of the project
export const getAllTeamMembersWithoutProjectMembers = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    projectId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_all_team_members_without_project_members", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as TeamMemberWithUserDetails;
};

// Get team member project list
export const getTeamMemberProjectList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string; search?: string; page: number; limit: number }
) => {
  const { teamMemberId, search, page, limit } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("team_schema")
    .from("team_project_member_table")
    .select("team_project_member_id, team_project: team_project_id!inner(*)", {
      count: "exact",
    })
    .eq("team_member_id", teamMemberId);

  if (search) {
    query = query.ilike("team_project.team_project_name", `%${search}%`);
  }

  query = query.order("team_project_name", {
    ascending: true,
    foreignTable: "team_project",
  });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get team member group list
export const getTeamMemberGroupList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string; search?: string; page: number; limit: number }
) => {
  const { teamMemberId, search, page, limit } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("team_schema")
    .from("team_group_member_table")
    .select("team_group_member_id, team_group: team_group_id!inner(*)", {
      count: "exact",
    })
    .eq("team_member_id", teamMemberId);

  if (search) {
    query = query.ilike("team_group.team_group_name", `%${search}%`);
  }

  query = query.order("team_group_name", {
    ascending: true,
    foreignTable: "team_group",
  });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// Get all team groups
export const getAllTeamGroups = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { teamId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_table")
    .select("*")
    .eq("team_group_team_id", teamId)
    .eq("team_group_is_disabled", false);
  if (error) throw error;

  return data;
};

// Check if a team member is a member of a group
export const checkIfTeamGroupMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string; groupId: string[] }
) => {
  const { teamMemberId, groupId } = params;

  const { count, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_member_table")
    .select("*", { count: "exact", head: true })
    .in("team_group_id", groupId)
    .eq("team_member_id", teamMemberId);
  if (error) throw error;

  return Boolean(count);
};

// Get all team projects
export const getAllTeamMemberProjects = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; memberId: string }
) => {
  const { teamId, memberId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_table")
    .select(
      "*, team_project_member: team_project_member_table!inner(team_member_id)"
    )
    .eq("team_project_team_id", teamId)
    .eq("team_project_member.team_member_id", memberId)
    .eq("team_project_is_disabled", false);
  if (error) throw error;

  return data;
};

// Get all team projects
export const getAllTeamProjects = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { teamId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_table")
    .select("*")
    .eq("team_project_team_id", teamId)
    .eq("team_project_is_disabled", false);
  if (error) throw error;

  return data;
};

// Get all invitations sent by a team
export const getTeamInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    status: string;
    page: number;
    limit: number;
    search?: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_invitation", { input_data: params })
    .select("*");
  if (error) throw error;
  const formattedData = data as unknown as {
    data: PendingInviteType[];
    count: number;
  };

  return { data: formattedData.data, count: formattedData.count };
};

export const getRequestFormslyId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const isUUID = validate(params.requestId);
  let query = supabaseClient.from("request_view").select("request_formsly_id");

  if (isUUID) {
    query = query.eq("request_id", params.requestId);
  } else {
    query.eq("request_formsly_id", params.requestId);
  }
  query.limit(1);

  const { data, error } = await query;

  if (error) throw error;

  return data[0] ? data[0].request_formsly_id : null;
};

// Fetch request signer based on Source Project
export const getProjectSigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    formId: string;
  }
) => {
  const { projectId, formId } = params;
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .select("*")
    .eq("signer_team_project_id", projectId)
    .eq("signer_form_id", formId)
    .is("signer_team_department_id", null)
    .eq("signer_is_disabled", false);

  if (error) throw error;

  return data;
};

// Fetch request signer with team member based on Source Project
export const getProjectSignerWithTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    formId: string;
    departmentId?: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_project_signer_with_team_member", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as FormType["form_signer"];
};

// Fetch multiple request signer with team member based on project site
export const getMultipleProjectSignerWithTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectName: string[];
    formId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_multiple_project_signer_with_team_member", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

// Fetch request signer based on formId and projectId
export const getFormSigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    formId: string;
  }
) => {
  const { projectId, formId } = params;
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .select("signer_id")
    .eq("signer_form_id", formId)
    .or(
      `signer_team_project_id.eq.${projectId}, signer_team_project_id.is.null`
    )
    .eq("signer_is_disabled", false);
  if (error) throw error;

  return data;
};

// Fetch all CSI Code based on division id
export const getCSICodeOptionsForItems = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    divisionIdList: string[];
  }
) => {
  const { divisionIdList } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("*")
    .in("csi_code_division_id", divisionIdList);
  if (error) throw error;

  return data as CSICodeTableRow[];
};

// Fetch all CSI Code
export const getCSICode = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    csiCode: string;
  }
) => {
  const { csiCode } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_level_three_description", csiCode);
  if (error) throw error;

  return data[0] as CSICodeTableRow;
};

// Fetch all item division option
export const getItemDivisionOption = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .from("distinct_division_view")
    .select("csi_code_division_id, csi_code_division_description")
    .order("csi_code_division_id", { ascending: true });
  if (error) throw error;

  return data;
};

// Fetch all item unit of measurement option
export const getItemUnitOfMeasurementOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("unit_of_measurement_schema")
    .from("item_unit_of_measurement_table")
    .select("item_unit_of_measurement_id, item_unit_of_measurement")
    .eq("item_unit_of_measurement_is_available", true)
    .eq("item_unit_of_measurement_is_disabled", false)
    .eq("item_unit_of_measurement_team_id", teamId)
    .order("item_unit_of_measurement", { ascending: true });
  if (error) throw error;

  return data;
};

// Get team approver list with filter
export const getTeamApproverListWithFilter = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_approver_list_with_filter", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: TeamApproverType[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Get team admin list with filter
export const getTeamAdminListWithFilter = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_admin_list_with_filter", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: TeamAdminType[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Get all team members with "MEMBER" role
export const getTeamMembersWithMemberRole = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_members_with_member_role", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

export const getMemberUserData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_member_user_data", { input_data: params })
    .select("*");
  if (error) throw error;

  if (data) {
    const commentTeamMember = data[0];
    return commentTeamMember as unknown as RequestWithResponseType["request_comment"][0]["comment_team_member"];
  } else {
    return null;
  }
};

// Get Team on load
export const getTeamOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: { userId: string; teamMemberLimit: number }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as TeamOnLoad;
};

// Get notification on load
export const getNotificationOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    app: AppType;
    page: number;
    limit: number;
    unreadOnly: boolean;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_notification_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as NotificationOnLoad;
};

// Get notification on load
export const getSSOTOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_ssot_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as SSOTOnLoad;
};

// Get request list on load
export const getRequestListOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_request_list_on_load", { input_data: params })
    .select("*");

  if (error) throw error;

  return data as unknown as RequestListOnLoad;
};

export const getInvitationId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    userEmail: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_invitation_id", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

export const getUserPendingInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userEmail: string;
  }
) => {
  const { userEmail } = params;

  const { data, error } = await supabaseClient
    .schema("user_schema")
    .from("invitation_table")
    .select("*")
    .eq("invitation_is_disabled", false)
    .eq("invitation_to_email", userEmail)
    .eq("invitation_status", "PENDING")
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getCommentAttachment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    commentId: string;
  }
) => {
  const { commentId } = params;

  const { data, error } = await supabaseClient
    .from("attachment_table")
    .select("*")
    .like("attachment_value", `%${commentId}%`)
    .eq("attachment_is_disabled", false);

  if (error) throw error;

  const getAttachmentUrls = async (data: AttachmentTableRow[]) => {
    const attachmentUrls = await Promise.all(
      data.map(async (attachment) => {
        const attachment_public_url = supabaseClient.storage
          .from(attachment.attachment_bucket)
          .getPublicUrl(`${attachment.attachment_value}`).data.publicUrl;

        return { ...attachment, attachment_public_url };
      })
    );

    return attachmentUrls;
  };

  if (data) {
    const attachmentUrl = await getAttachmentUrls(data);
    return attachmentUrl;
  } else {
    return [];
  }
};

// Get service list
export const getServiceList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; limit: number; page: number; search?: string }
) => {
  const { teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("service_schema")
    .from("service_table")
    .select("*, service_scope: service_scope_table(*)", {
      count: "exact",
    })
    .eq("service_team_id", teamId)
    .eq("service_is_disabled", false);

  if (search) {
    query = query.ilike("service_name", `%${search}%`);
  }

  query.order("service_date_created", { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// check if service scope already exists
export const checkServiceScope = async (
  supabaseClient: SupabaseClient<Database>,
  params: { serviceScope: string; scopeId: string }
) => {
  const { serviceScope, scopeId } = params;

  const { count, error } = await supabaseClient
    .schema("service_schema")
    .from("service_scope_choice_table")
    .select("*", { count: "exact", head: true })
    .eq("service_scope_choice_name", serviceScope)
    .eq("service_scope_choice_is_disabled", false)
    .eq("service_scope_choice_service_scope_id", scopeId);
  if (error) throw error;

  return Boolean(count);
};

// Get service scope field list
export const getServiceScopeChoiceList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    scopeId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { scopeId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("service_schema")
    .from("service_scope_choice_table")
    .select("*", {
      count: "exact",
    })
    .eq("service_scope_choice_service_scope_id", scopeId)
    .eq("service_scope_choice_is_disabled", false);

  if (search) {
    query = query.ilike("service_scope_choice_name", `%${search}%`);
  }

  query.order("service_scope_choice_date_created", { ascending: false });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// check if service name already exists
export const checkServiceName = async (
  supabaseClient: SupabaseClient<Database>,
  params: { serviceName: string; teamId: string }
) => {
  const { serviceName, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("service_schema")
    .from("service_table")
    .select("*", { count: "exact", head: true })
    .eq("service_name", serviceName)
    .eq("service_is_disabled", false)
    .eq("service_team_id", teamId);
  if (error) throw error;

  return Boolean(count);
};

// Check if jira id is unique
export const checkIfJiraIDIsUnique = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    value: string;
  }
) => {
  const { value } = params;

  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", {
      count: "exact",
    })
    .eq("request_status", "APPROVED")
    .eq("request_jira_id", value);

  if (error) throw error;

  return Boolean(count);
};

// Check if jira link is unique
export const checkIfJiraLinkIsUnique = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    value: string;
  }
) => {
  const { value } = params;

  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", {
      count: "exact",
    })
    .eq("request_status", "APPROVED")
    .eq("request_jira_link", value);

  if (error) throw error;

  return Boolean(count);
};

// Check if otp id is unique
export const checkIfOtpIdIsUnique = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    value: string;
  }
) => {
  const { value } = params;

  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", {
      count: "exact",
    })
    .eq("request_status", "APPROVED")
    .eq("request_otp_id", value);

  if (error) throw error;

  return Boolean(count);
};

// get service
export const getService = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; serviceName: string }
) => {
  const { teamId, serviceName } = params;

  const { data, error } = await supabaseClient
    .schema("service_schema")
    .from("service_table")
    .select(
      "*, service_scope: service_scope_table(*, service_scope_choice: service_scope_choice_table(*), service_field: service_scope_field_id(*))"
    )
    .eq("service_team_id", teamId)
    .eq("service_name", serviceName)
    .eq("service_is_disabled", false)
    .eq("service_is_available", true)
    .eq("service_scope.service_scope_is_disabled", false)
    .eq("service_scope.service_scope_is_available", true)
    .eq(
      "service_scope.service_scope_choice.service_scope_choice_is_disabled",
      false
    )
    .eq(
      "service_scope.service_scope_choice.service_scope_choice_is_available",
      true
    )
    .single();
  if (error) throw error;

  return data as unknown as ServiceWithScopeAndChoice;
};

// Get create ticket on load
export const getCreateTicketOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_create_ticket_on_load", {
      input_data: params,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CreateTicketPageOnLoad;
};

// Get ticket on load
export const getTicketOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    ticketId: string;
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_ticket_on_load", {
      input_data: params,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TicketPageOnLoad;
};

// Get ticket list
export const getTicketList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    page: number;
    limit: number;
    requester?: string[];
    approver?: string[];
    status?: TicketStatusType[];
    category?: string[];
    sort?: "ascending" | "descending";
    search?: string;
    columnAccessor?: string;
  }
) => {
  const {
    teamId,
    page,
    limit,
    requester,
    approver,
    status,
    category,
    sort = "descending",
    search = "",
    columnAccessor = "ticket_date_created",
  } = params;

  const requesterCondition = requester
    ?.map(
      (value) => `ticket_table.ticket_requester_team_member_id = '${value}'`
    )
    .join(" OR ");
  const approverCondition = approver
    ?.map((value) => `ticket_table.ticket_approver_team_member_id = '${value}'`)
    .join(" OR ");
  const statusCondition = status
    ?.map((value) => `ticket_table.ticket_status = '${value}'`)
    .join(" OR ");
  const categoryCondition = category
    ?.map((value) => `ticket_table.ticket_category_id = '${value}'`)
    .join(" OR ");

  const searchCondition =
    search && search?.length > 0 && validate(search)
      ? `ticket_table.ticket_id = '${search}'`
      : `ticket_table.ticket_id::text LIKE '${search}%'`;

  const { data, error } = await supabaseClient.rpc("fetch_ticket_list", {
    input_data: {
      teamId: teamId,
      page: page,
      limit: limit,
      requester: requesterCondition ? `AND (${requesterCondition})` : "",
      approver: approverCondition ? `AND (${approverCondition})` : "",
      category: categoryCondition ? `AND (${categoryCondition})` : "",
      status: statusCondition ? `AND (${statusCondition})` : "",
      search: searchCondition ? `AND (${searchCondition})` : "",
      sort: sort === "descending" ? "DESC" : "ASC",
      columnAccessor,
    },
  });

  if (error) throw error;
  const dataFormat = data as unknown as {
    data: TicketListType;
    count: number;
  };

  return { data: dataFormat.data, count: dataFormat.count };
};

// Get ticket list on load
export const getTicketListOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_ticket_list_on_load", { input_data: params })
    .select("*");
  if (error) throw error;
  return data as unknown as TicketListOnLoad;
};

// Get approver request count
export const getApproverRequestCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
    status: string;
    withJiraId?: boolean;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_approver_request_count",
    { input_data: params }
  );
  if (error) throw error;

  return Number(data);
};

// Get approver unresolved request count
export const getApproverUnresolvedRequestCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { teamMemberId } = params;
  const { data, error } = await supabaseClient.rpc(
    "get_approver_unresolved_request_count",
    { input_data: { teamMemberId } }
  );
  if (error) throw error;
  return data as ApproverUnresolvedRequestCountType;
};

// Get edit request on load
export const getEditRequestOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    requestId: string;
    referenceOnly: boolean;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_edit_request_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

// Get all group of team member
export const getAllGroupOfTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string }
) => {
  const { teamMemberId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_member_table")
    .select(
      "team_group: team_group_id(team_group_name, team_group_is_disabled)"
    )
    .eq("team_member_id", teamMemberId)
    .eq("team_group.team_group_is_disabled", false);

  if (error) throw error;
  const formattedData = data as unknown as {
    team_group: { team_group_name: string };
  }[];

  return formattedData.map((group) => group.team_group.team_group_name);
};

// Check if team name already exists
export const checkIfTeamNameExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamName: string }
) => {
  const { teamName } = params;

  const { count, error } = await supabaseClient
    .schema("team_schema")
    .from("team_table")
    .select("*", { count: "exact" })
    .ilike("team_name", teamName);

  if (error) throw error;

  return Boolean(count);
};

// Get equipment list
export const getEquipmentList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; limit: number; page: number; search?: string }
) => {
  const { teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("equipment_schema")
    .from("equipment_table")
    .select(
      "*, equipment_category: equipment_equipment_category_id(equipment_category)",
      {
        count: "exact",
      }
    )
    .eq("equipment_team_id", teamId)
    .eq("equipment_is_disabled", false);

  if (search) {
    query = query.ilike("equipment_name", `%${search}%`);
  }

  query.order("equipment_name", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  const formattedData = data as unknown as EquipmentTableRow &
    { equipment_category: { equipment_category: string } }[];

  return {
    data: formattedData.map((equipment) => {
      return {
        ...equipment,
        equipment_category: equipment.equipment_category.equipment_category,
      };
    }),
    count,
  };
};

// check if equipment name already exists
export const checkEquipmentName = async (
  supabaseClient: SupabaseClient<Database>,
  params: { equipmentName: string; teamId: string }
) => {
  const { equipmentName, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_table")
    .select("*", { count: "exact", head: true })
    .eq("equipment_name", equipmentName)
    .eq("equipment_is_disabled", false)
    .eq("equipment_team_id", teamId);
  if (error) throw error;

  return Boolean(count);
};

// Fetch all equipment category option
export const getEquipmentCategoryOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_category_table")
    .select("*")
    .eq("equipment_category_team_id", teamId)
    .eq("equipment_category_is_available", true)
    .eq("equipment_category_is_disabled", false)
    .order("equipment_category", { ascending: true });
  if (error) throw error;

  return data;
};

// Get equipment description list
export const getEquipmentDescriptionList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { equipmentId: string; limit: number; page: number; search?: string }
) => {
  const { equipmentId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select(
      `
        *,
        equipment_description_brand: equipment_description_brand_id(equipment_brand),
        equipment_description_model: equipment_description_model_id(equipment_model)
      `,
      {
        count: "exact",
      }
    )
    .eq("equipment_description_equipment_id", equipmentId)
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_brand.equipment_brand_is_disabled", false)
    .eq("equipment_description_model.equipment_model_is_disabled", false);

  if (search) {
    query = query.or(
      `equipment_description_property_number_with_prefix.ilike.%${search}%, equipment_description_serial_number.ilike.%${search}%`
    );
  }

  query.order("equipment_description_property_number_with_prefix", {
    ascending: true,
  });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;

  if (error) throw error;

  const formattedData = data as unknown as (ItemDescriptionTableRow & {
    equipment_description_brand: { equipment_brand: string };
    equipment_description_model: { equipment_model: string };
  })[];

  return {
    data: formattedData.map((description) => {
      return {
        ...description,
        equipment_description_brand: description.equipment_description_brand
          ? description.equipment_description_brand.equipment_brand
          : "",
        equipment_description_model: description.equipment_description_model
          ? description.equipment_description_model.equipment_model
          : "",
      };
    }),
    count,
  };
};

// Fetch all equipment description brand and model option
export const getEquipmentBrandAndModelOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data: brandList, error: brandError } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_brand_table")
    .select("*")
    .eq("equipment_brand_team_id", teamId)
    .eq("equipment_brand_is_disabled", false)
    .eq("equipment_brand_is_available", true)
    .order("equipment_brand", { ascending: true });
  if (brandError) throw brandError;

  const { data: modelList, error: modelError } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_model_table")
    .select("*")
    .eq("equipment_model_team_id", teamId)
    .eq("equipment_model_is_disabled", false)
    .eq("equipment_model_is_available", true)
    .order("equipment_model", { ascending: true });
  if (modelError) throw modelError;

  return {
    brandList,
    modelList,
  };
};

// Fetch all equipment name option
export const getEquipmentNameOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    teamId: string;
  }
) => {
  const { index, teamId } = params;
  const { data: nameList, error: nameError } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_general_name_table")
    .select("*")
    .eq("equipment_general_name_team_id", teamId)
    .eq("equipment_general_name_is_disabled", false)
    .eq("equipment_general_name_is_available", true)
    .range(index, index + 1000)
    .order("equipment_general_name", { ascending: true });
  if (nameError) throw nameError;

  return {
    nameList,
  };
};

// check if propert number already exists
export const checkPropertyNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: { propertyNumber: string; teamId: string }
) => {
  const { propertyNumber, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select(
      "*, equipment_description_equipment: equipment_description_equipment_id(*)",
      { count: "exact", head: true }
    )
    .in("equipment_description_property_number_with_prefix", [
      propertyNumber,
      `REN-${propertyNumber}`,
    ])
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_equipment.equipment_team_id", teamId);
  if (error) throw error;

  return Boolean(count);
};

// check if serial number already exists
export const checkSerialNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: { serialNumber: string; teamId: string }
) => {
  const { serialNumber, teamId } = params;

  const { count, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_table")
    .select(
      "*, equipment_description_equipment: equipment_description_equipment_id(*)",
      { count: "exact", head: true }
    )
    .eq("equipment_description_serial_number", serialNumber)
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_equipment.equipment_team_id", teamId);
  if (error) throw error;

  return Boolean(count);
};

// Get equipment part list
export const getEquipmentPartList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { equipmentId: string; limit: number; page: number; search?: string }
) => {
  const { data, error } = await supabaseClient.rpc("get_equipment_part_list", {
    input_data: params,
  });

  if (error) throw error;

  const formattedData = data as {
    data: EquipmentPartType[];
    count: number;
  };
  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Fetch all equipment uom option
export const getEquipmentUOMAndCategoryOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data: uomList, error: uomListError } = await supabaseClient
    .schema("unit_of_measurement_schema")
    .from("equipment_unit_of_measurement_table")
    .select("*")
    .eq("equipment_unit_of_measurement_team_id", teamId)
    .eq("equipment_unit_of_measurement_is_available", true)
    .eq("equipment_unit_of_measurement_is_disabled", false)
    .order("equipment_unit_of_measurement", { ascending: true });
  if (uomListError) throw uomListError;

  const { data: categoryList, error: categoryError } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_component_category_table")
    .select("*")
    .eq("equipment_component_category_team_id", teamId)
    .eq("equipment_component_category_is_available", true)
    .eq("equipment_component_category_is_disabled", false)
    .order("equipment_component_category", { ascending: true });
  if (categoryError) throw categoryError;

  return {
    uomList,
    categoryList,
  };
};

// Check PED part if already exists
export const checkPEDPart = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentPartData: EquipmentPartTableInsert;
  }
) => {
  const { equipmentPartData } = params;
  const { data, error } = await supabaseClient
    .rpc("check_ped_part", { input_data: equipmentPartData })
    .select("*");
  if (error) throw error;
  return data;
};

// Get equipment category list
export const getEquipmentCategoryList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; limit: number; page: number; search?: string }
) => {
  const { teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("equipment_schema")
    .from("equipment_category_table")
    .select("*", { count: "exact" })
    .eq("equipment_category_team_id", teamId)
    .eq("equipment_category_is_disabled", false);

  if (search) {
    query = query.ilike("equipment_category", `%${search}%`);
  }

  query.order("equipment_category", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data,
    count,
  };
};

// check if equipment lookup table value already exists
export const checkEquipmentLookupTable = async (
  supabaseClient: SupabaseClient,
  params: { lookupTableName: string; value: string; teamId: string }
) => {
  const { lookupTableName, value, teamId } = params;
  const { count, error } = await supabaseClient
    .from(`${lookupTableName}_table`)
    .select("*", { count: "exact", head: true })
    .eq(`${lookupTableName}`, value)
    .eq(`${lookupTableName}_is_disabled`, false)
    .eq(`${lookupTableName}_team_id`, teamId);
  if (error) throw error;

  return Boolean(count);
};

// check if email list are onboarded
export const checkIfEmailsOnboarded = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    emailList: string[];
  }
) => {
  const { emailList } = params;
  const { data, error } = await supabaseClient
    .schema("user_schema")
    .from("user_table")
    .select("user_email")
    .in("user_email", emailList);
  if (error) throw error;

  return emailList.map((email) => ({
    email: email,
    onboarded: data.map((userData) => userData.user_email).includes(email),
  }));
};

// get request team id
export const getRequestTeamId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_request_team_id", { input_data: params })
    .select("*");
  if (error) throw error;

  return data.length ? (data as unknown as string) : null;
};

// Fetch all CSI Code
export const getCSIDescriptionOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    divisionId: string;
  }
) => {
  const { divisionId } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_division_id", divisionId)
    .order("csi_code_level_three_description", { ascending: true });
  if (error) throw error;
  return data;
};

// Get lookup list
export const getLookupList = async (
  supabaseClient: SupabaseClient,
  params: {
    lookup: string;
    teamId: string;
    limit: number;
    page: number;
    search?: string;
    schema: string;
  }
) => {
  const { lookup, teamId, search, limit, page, schema } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema(schema)
    .from(`${lookup}_table`)
    .select("*", { count: "exact" })
    .eq(`${lookup}_team_id`, teamId)
    .eq(`${lookup}_is_disabled`, false);

  if (search) {
    query = query.ilike(`${lookup}`, `%${search}%`);
  }

  query.order(`${lookup}`, { ascending: true, foreignTable: "" });
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  const id = `${lookup}_id`;
  const value = lookup;
  const status = `${lookup}_is_available`;

  const formattedData = data as unknown as {
    [key: string]: string;
  }[];

  return {
    data: formattedData.map((lookupData) => {
      return {
        id: lookupData[id],
        status: Boolean(lookupData[status]),
        value: lookupData[value],
      };
    }),
    count,
  };
};

// check if lookup table value already exists
export const checkLookupTable = async (
  supabaseClient: SupabaseClient,
  params: { lookupTableName: string; value: string; teamId: string }
) => {
  const { lookupTableName, value, teamId } = params;
  const { count, error } = await supabaseClient
    .from(`${lookupTableName}_table`)
    .select("*", { count: "exact", head: true })
    .eq(`${lookupTableName}`, value)
    .eq(`${lookupTableName}_is_disabled`, false)
    .eq(`${lookupTableName}_team_id`, teamId);
  if (error) throw error;

  return Boolean(count);
};

// Fetch all CSI Code based on division description
export const getCSICodeOptionsForServices = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    description: string;
  }
) => {
  const { description } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_division_description", description);
  if (error) throw error;

  return data as CSICodeTableRow[];
};

// Get user issued item list
export const getUserIssuedItemList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
    startDate: string;
    endDate: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("analyze_user_issued_item", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as { data: UserIssuedItem[]; raw: UserIssuedItem[] };
};

// Get team memo total count
export const getTeamMemoCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { count, error } = await supabaseClient
    .schema("memo_schema")
    .from("memo_table")
    .select("*", { count: "exact" })
    .eq("memo_team_id", params.teamId);

  if (error) throw error;

  return Number(count);
};

// Get team memo signers
export const getTeamMemoSignerList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_memo_signer_list", {
    input_data: params,
  });
  if (error) throw error;

  const dataWithType = data as unknown as {
    team_member_id: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string | null;
      user_job_title: string | null;
      user_avatar: string;
      signature_list: SignatureHistoryTableRow[];
    };
  }[];

  const formattedData = dataWithType.map((signer) => {
    const signatureList = signer.team_member_user.signature_list ?? [];
    const defaultSignature = signatureList[signatureList.length - 1];

    return {
      ...signer,
      signer_signature_public_url: defaultSignature
        ? defaultSignature.signature_history_value
        : "",
    };
  });
  return formattedData;
};

// Get memo
export const getMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: { memo_id: string; current_user_id: string; team_id: string }
) => {
  const { data, error } = await supabaseClient.rpc("get_memo_on_load", {
    input_data: params,
  });

  if (error || !data) throw Error;

  return data as MemoType;
};

// Get memo list
export const getMemoList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    page: number;
    limit: number;
    authorFilter?: string[];
    approverFilter?: string[];
    status?: string[];
    sort?: "ascending" | "descending";
    searchFilter?: string;
    columnAccessor?: string;
  }
) => {
  const {
    teamId,
    page,
    limit,
    authorFilter,
    approverFilter,
    status,
    sort = "descending",
    searchFilter,
    columnAccessor = "memo_table.memo_date_created",
  } = params;

  const authorFilterCondition = authorFilter
    ?.map(
      (authorUserId) => `memo_table.memo_author_user_id = '${authorUserId}'`
    )
    .join(" OR ");

  const approverFilterCondition = approverFilter
    ?.map(
      (approverTeamMemberId) =>
        `memo_signer_table.memo_signer_team_member_id = '${approverTeamMemberId}'`
    )
    .join(" OR ");

  const statusCondition = status
    ?.map((status) => `memo_status = '${status}'`)
    .join(" OR ");

  const { data, error } = await supabaseClient.rpc("get_memo_list", {
    input_data: {
      teamId,
      page,
      limit,
      sort: sort === "descending" ? "DESC" : "ASC",
      authorFilter: authorFilterCondition
        ? `AND (${authorFilterCondition})`
        : "",
      approverFilter: approverFilterCondition
        ? `AND (${approverFilterCondition})`
        : "",
      status: statusCondition ? `AND (${statusCondition})` : "",
      searchFilter: searchFilter ? addAmpersandBetweenWords(searchFilter) : "",
      columnAccessor,
    },
  });

  if (error) throw Error;

  return data as { data: MemoListItemType[]; count: number };
};

// Get memo
export const getReferenceMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: { memo_id: string; current_user_id: string }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_memo_reference_on_load",
    {
      input_data: params,
    }
  );
  if (error || !data) throw Error;

  return data as unknown as ReferenceMemoType;
};

// get memo format
export const getMemoFormat = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("memo_schema")
    .from("memo_format_section_table")
    .select(
      "*, format_subsection: memo_format_subsection_table(*, subsection_attachment: memo_format_attachment_table(*))"
    );
  if (error || !data) throw Error;

  const sectionOrderList = ["header", "body", "footer"];
  const sortedData = data.sort((a, b) => {
    const aIndex = sectionOrderList.findIndex(
      (section) => section === a.memo_format_section_name
    );
    const bIndex = sectionOrderList.findIndex(
      (section) => section === b.memo_format_section_name
    );

    return aIndex - bIndex;
  });

  const sortedDataWithType =
    sortedData as MemoFormatFormValues["formatSection"];

  const sortedDataWithAttachmentFile = await Promise.all(
    sortedDataWithType.map(async (section) => {
      const updatedSubsectionList = await Promise.all(
        section.format_subsection.map(async (subsection) => {
          const updatedAttachmentList = await Promise.all(
            subsection.subsection_attachment.map(async (attachment) => {
              try {
                const attachmentFileResponse = await fetch(
                  `${attachment.memo_format_attachment_url}`
                );

                if (!attachmentFileResponse.ok) {
                  throw new Error(
                    `Failed to fetch attachment for ${attachment.memo_format_attachment_name}`
                  );
                }

                const blob = await attachmentFileResponse.blob();
                const newAttachmentFile = new File(
                  [blob],
                  attachment.memo_format_attachment_name,
                  { type: blob.type }
                );

                return {
                  ...attachment,
                  memo_format_attachment_file: newAttachmentFile,
                };
              } catch (e) {
                return attachment;
              }
            })
          );

          return {
            ...subsection,
            subsection_attachment: updatedAttachmentList,
          };
        })
      );

      return {
        ...section,
        format_subsection: updatedSubsectionList,
      };
    })
  );
  return sortedDataWithAttachmentFile;
};

// Get type list
export const getTypeList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("other_expenses_schema")
    .from(`other_expenses_type_table`)
    .select(
      `
        *,
        other_expenses_type_category: other_expenses_type_category_id!inner(
          other_expenses_category
        )
      `,
      { count: "exact" }
    )
    .eq("other_expenses_type_category.other_expenses_category_team_id", teamId)
    .eq(
      "other_expenses_type_category.other_expenses_category_is_disabled",
      false
    )
    .eq("other_expenses_type_is_disabled", false);

  if (search) {
    query = query.ilike("other_expenses_type", `%${search}%`);
  }

  query.order("other_expenses_type");
  query.limit(limit);
  query.range(start, start + limit - 1);
  query.maybeSingle;

  const { data, error, count } = await query;
  if (error) throw error;

  const formattedData = data as unknown as (OtherExpensesTypeTableRow & {
    other_expenses_type_category: { other_expenses_category: string };
  })[];

  return {
    data: formattedData.map((type) => {
      return {
        ...type,
        other_expenses_category:
          type.other_expenses_type_category.other_expenses_category,
      };
    }),
    count,
  };
};

// check if other expenses table value already exists
export const checkOtherExpenesesTypeTable = async (
  supabaseClient: SupabaseClient<Database>,
  params: { value: string; categoryId: string }
) => {
  const { value, categoryId } = params;
  const { count, error } = await supabaseClient
    .schema("other_expenses_schema")
    .from("other_expenses_type_table")
    .select("*", { count: "exact", head: true })
    .eq("other_expenses_type", value)
    .eq("other_expenses_type_is_disabled", false)
    .eq("other_expenses_type_category_id", categoryId);
  if (error) throw error;

  return Boolean(count);
};

// Fetch other expenses category options
export const getOtherExpensesCategoryOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("other_expenses_schema")
    .from("other_expenses_category_table")
    .select("*")
    .eq("other_expenses_category_team_id", teamId)
    .eq("other_expenses_category_is_disabled", false)
    .eq("other_expenses_category_is_available", true)
    .order("other_expenses_category", { ascending: true });
  if (error) throw error;
  return data;
};

// Get type list
export const getTypeOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    categoryId: string;
  }
) => {
  const { categoryId } = params;
  const { data, error } = await supabaseClient
    .schema("other_expenses_schema")
    .from("other_expenses_type_table")
    .select("*")
    .eq("other_expenses_type_category_id", categoryId)
    .eq("other_expenses_type_is_available", true)
    .eq("other_expenses_type_is_disabled", false)
    .order("other_expenses_type", { ascending: true });
  if (error) throw error;
  return data;
};

// Get user signature list
export const getUserSignatureList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { userId } = params;
  const { data, error } = await supabaseClient
    .schema("history_schema")
    .from("signature_history_table")
    .select("*")
    .eq("signature_history_user_id", userId);

  if (error) throw error;
  return data;
};

// Get user valid id
export const getUserValidID = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    validId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_user_valid_id", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

// Fetch csi code description based on division id
export const getCSIDescriptionOptionBasedOnDivisionId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    divisionId: string[];
  }
) => {
  const { divisionId } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_level_three_description, csi_code_division_id")
    .in("csi_code_division_id", divisionId)
    .order("csi_code_level_three_description", { ascending: true });
  if (error) throw error;
  return data;
};

// Fetch CSI Code based on level three description
export const getLevelThreeDescription = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    levelThreeDescription: string;
  }
) => {
  const { levelThreeDescription } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_level_three_description", levelThreeDescription)
    .single();
  if (error) throw error;

  return [data] as CSICodeTableRow[];
};

// Fetch section in edit request
export const getSectionInEditRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    supplierOptions: OptionTableRow[];
    requestId: string;
    teamId: string;
    itemOptions: OptionTableRow[];
    preferredSupplierField: FieldTableRow;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_edit_request_section", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    sectionData: RequestWithResponseType["request_form"]["form_section"];
    itemDivisionIdList: string[][];
    itemCategorySignerList: (ItemCategoryType["item_category"] | null)[];
  };

  return formattedData;
};

// Get query data
export const getQueryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    queryId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_query_data", { input_data: params })
    .select("*");
  if (error) throw error;

  const queryFetchedData = data as unknown as { queryData: string };
  return queryFetchedData.queryData;
};

// Get query table
export const getQueryList = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("query_table")
    .select("*");
  if (error) throw error;
  return data;
};

// Get signer sla
export const getSignerSLA = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    formId: string;
    projectId: string;
    singerId: string;
    status: string;
    page: number;
    limit: number;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_signer_sla", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as {
    signerRequestSLA: SignerRequestSLA[];
    slaHours: number;
    signerRequestSLACount: number;
  };
};

// Get form sla
export const getFormSLA = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    teamId: string;
  }
) => {
  const { formId, teamId } = params;

  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("form_sla_table")
    .select("*")
    .eq("form_sla_form_id", formId)
    .eq("form_sla_team_id", teamId)
    .single();
  if (error) throw error;
  return data;
};

// Get form sla table
export const getTeamFormSLAList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { teamId, page, limit, search } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .schema("form_schema")
    .from("form_sla_table")
    .select("*, form_table!inner(*)", { count: "exact" })
    .eq("form_sla_team_id", teamId);

  if (search) {
    query = query.ilike("form_table.form_name", `%${search}%`);
  }

  query.order("form_sla_date_updated", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data, count };
};

// Fetch project id based on formId
export const getFormProjectIDs = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
  }
) => {
  const { formId } = params;
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .select("signer_team_project_id")
    .eq("signer_form_id", formId)
    .eq("signer_is_disabled", false);
  if (error) throw error;

  const stringArray = data.map((signer) => signer.signer_team_project_id);
  const filteredData = stringArray.filter(Boolean);
  return filteredData as string[];
};

// Fetch project by project id
export const getProjectByID = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectIdList: string[];
  }
) => {
  const { projectIdList } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_table")
    .select("*")
    .in("team_project_id", projectIdList);
  if (error) throw error;

  return data;
};

export const getSignerWithProfile = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    projectId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_signer_with_profile", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as SignerWithProfile[];
};

// Get ticket category list
export const getTicketCategoryList = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("ticket_schema")
    .from("ticket_category_table")
    .select("*")
    .eq("ticket_category_is_disabled", false)
    .eq("ticket_category_is_active", true);
  if (error) throw error;

  return data;
};

// Get ticket form
export const getTicketForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    category: string;
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_ticket_form", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as CreateTicketFormValues;
};

// Check CSI Code Description if it already exists
export const checkCSICodeDescriptionExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    csiCodeDescription: string;
  }
) => {
  const { csiCodeDescription } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_level_three_description")
    .ilike("csi_code_level_three_description", csiCodeDescription)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Check CSI Code if it already exists for item
export const checkCSICodeItemExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    divisionId: string;
    itemId: string;
  }
) => {
  const { divisionId, itemId } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_division_table")
    .select("*")
    .eq("item_division_value", divisionId)
    .eq("item_division_item_id", itemId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Get team member with user
export const getMemberUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_member_user", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as TeamMemberWithUser;
};

// Get incident report
export const getIncidentReport = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    reporteeId: string;
    interval: string;
    year: string;
    month: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_incident_report", { input_data: params })
    .select("*");
  if (error) throw error;
  const returnData = data as unknown as {
    interval: string;
    year: string;
    month: string;
    data: string;
  };

  return {
    interval: returnData.interval,
    month: returnData.month,
    year: returnData.year,
    data: parseJSONIfValid(returnData.data) as {
      date: string;
      report_count: number;
    }[],
  };
};

// Check Custom CSI Code if valid
export const checkCustomCSICodeValidity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    csiCode: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_custom_csi_validity", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as {
    csiCodeDivisionIdExists: boolean;
    csiCodeLevelTwoMajorGroupIdExists: boolean;
    csiCodeLevelTwoMinorGroupIdExists: boolean;
    csiCodeLevelThreeIdExists: boolean;
  };
};

// Fetch equipment name based on equipment category
export const getEquipmentName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    category: string;
  }
) => {
  const { category } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_table")
    .select("*")
    .eq("equipment_is_disabled", false)
    .eq("equipment_is_available", true)
    .eq("equipment_equipment_category_id", category);
  if (error) throw error;

  return data;
};

// Fetch equipment property number based on equipment id
export const getEquipmentPropertyNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentId: string;
  }
) => {
  const { equipmentId } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select("*")
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_is_available", true)
    .eq("equipment_description_equipment_id", equipmentId);
  if (error) throw error;

  return data;
};

// Fetch equipment description based on property number
export const getEquipmentDescription = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    propertyNumber: string;
  }
) => {
  const { propertyNumber } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select(
      "*, equipment_description_brand: equipment_description_brand_id(equipment_brand), equipment_description_model: equipment_description_model_id(equipment_model)"
    )
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_is_available", true)
    .eq("equipment_description_brand.equipment_brand_is_disabled", false)
    .eq("equipment_description_model.equipment_model_is_disabled", false)
    .eq("equipment_description_property_number_with_prefix", propertyNumber)
    .single();
  if (error) throw error;

  type ReturnDataType = EquipmentDescriptionTableRow & {
    equipment_description_brand: { equipment_brand: string };
  } & {
    equipment_description_model: { equipment_model: string };
  };

  const formattedData = data as unknown as ReturnDataType;

  return {
    ...data,
    equipment_description_brand: {
      equipment_brand: formattedData.equipment_description_brand
        ? formattedData.equipment_description_brand.equipment_brand
        : "",
    },
    equipment_description_model: {
      equipment_model: formattedData.equipment_description_model
        ? formattedData.equipment_description_model.equipment_model
        : "",
    },
  } as unknown as ReturnDataType;
};

// Fetch item section choices based on given parameters
export const getItemSectionChoices = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentId?: string;
    generalName?: string;
    componentCategory?: string;
    brand?: string;
    model?: string;
  }
) => {
  const { equipmentId, generalName, componentCategory, brand, model } = params;

  let index = 0;
  const optionList: JSON[] = [];
  while (1) {
    const { data, error } = await supabaseClient.rpc(
      "get_item_section_choices",
      {
        input_data: {
          equipmentId: equipmentId
            ? `${safeParse(escapeQuotes(equipmentId))}`
            : undefined,
          generalName: generalName
            ? `${safeParse(escapeQuotes(generalName))}`
            : undefined,
          componentCategory: componentCategory
            ? `${safeParse(escapeQuotes(componentCategory))}`
            : undefined,
          brand: brand ? `${safeParse(escapeQuotes(brand))}` : undefined,
          model: model ? `${safeParse(escapeQuotes(model))}` : undefined,
          index,
          limit: FETCH_OPTION_LIMIT,
        },
      }
    );
    if (error) throw error;
    const formattedData = data as unknown as JSON[];
    optionList.push(...formattedData);
    if (formattedData.length < FETCH_OPTION_LIMIT) break;
    index += FETCH_OPTION_LIMIT;
  }

  return optionList;
};

// Fetch item unit of measurement based on given parameters
export const getItemUnitOfMeasurement = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    generalName: string;
    componentCategory: string;
    brand: string;
    model: string;
    partNumber: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_item_unit_of_measurement", {
      input_data: escapeQuotesForObject(params),
    })
    .select("*");
  if (error) throw error;

  return data;
};

// Fetch equipment section choices based on given parameters
export const getEquipmentSectionChoices = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    category: string;
    equipmentName: string;
    brand?: string;
  }
) => {
  const { category, equipmentName, brand } = params;
  let query = supabaseClient
    .schema("equipment_schema")
    .from("equipment_table")
    .select(
      `
        equipment_id,
        equipment_equipment_category: equipment_equipment_category_id!inner(equipment_category),
        equipment_name,
        equipment_description:
          equipment_description_table!inner(
            equipment_description_brand: equipment_description_brand_id(
              equipment_brand
            )
            ${
              brand
                ? `, equipment_description_model: equipment_description_model_id(
                equipment_model
              )`
                : ""
            }
          )
      `
    )
    .eq("equipment_is_disabled", false)
    .eq("equipment_is_available", true)
    .eq("equipment_equipment_category.equipment_category", category)
    .eq("equipment_name", equipmentName);

  if (brand) {
    query = query.eq(
      "equipment_description.equipment_description_brand.equipment_brand_is_disabled",
      false
    );
    query = query.eq(
      "equipment_description.equipment_description_brand.equipment_brand_is_available",
      true
    );
    query = query.eq(
      "equipment_description.equipment_description_brand.equipment_brand",
      brand
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const tempList: string[] = [];
  if (!brand) {
    const formattedData = data[0] as unknown as {
      equipment_id: string;
      equipment_description?: {
        equipment_description_brand: {
          equipment_brand: string;
        };
      }[];
      equipment_name: string;
    };
    if (!formattedData?.equipment_description) return [];

    return formattedData.equipment_description.filter((value) => {
      if (
        !tempList.includes(value.equipment_description_brand.equipment_brand)
      ) {
        tempList.push(value.equipment_description_brand.equipment_brand);
        return value;
      }
    });
  } else {
    const formattedData = data[0] as unknown as {
      equipment_id: string;
      equipment_description?: {
        equipment_description_model: {
          equipment_model: string;
        };
      }[];
      equipment_name: string;
    };
    if (!formattedData?.equipment_description) return [];

    return formattedData.equipment_description.filter((value) => {
      if (
        !tempList.includes(value.equipment_description_model.equipment_model)
      ) {
        tempList.push(value.equipment_description_model.equipment_model);
        return value;
      }
    });
  }
};

// Check if ped part already exists
export const pedPartCheck = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    equipmentName: string;
    partName: string;
    partNumber: string;
    brand: string;
    model: string;
    unitOfMeasure: string;
    category: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("ped_part_check", {
    input_data: escapeQuotesForObject(params),
  });
  if (error) throw error;
  return data;
};

// Get region
export const fetchRegion = async (
  supabaseClient: SupabaseClient<OneOfficeDatabase["address_schema"]>
) => {
  const { data, error } = await getRegion({ supabaseClient: supabaseClient });
  if (error) throw error;
  return data;
};

// Get province
export const fetchProvince = async (
  supabaseClient: SupabaseClient<OneOfficeDatabase["address_schema"]>,
  params: { regionId: string }
) => {
  const { regionId } = params;

  const { data, error } = await getProvince({
    supabaseClient,
    regionId,
  });
  if (error) throw error;
  return data;
};

// Get city
export const fetchCity = async (
  supabaseClient: SupabaseClient<OneOfficeDatabase["address_schema"]>,
  params: { provinceId: string }
) => {
  const { provinceId } = params;

  const { data, error } = await getCity({
    supabaseClient: supabaseClient,
    provinceId,
  });
  if (error) throw error;
  return data;
};

// Get barangay
export const fetchBarangay = async (
  supabaseClient: SupabaseClient<OneOfficeDatabase["address_schema"]>,
  params: { cityId: string }
) => {
  const { cityId } = params;

  const { data, error } = await getBarangay({
    supabaseClient: supabaseClient,
    cityId,
  });
  if (error) throw error;
  return data;
};

// Fetch section in request page
export const getSectionInRequestPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    requestId: string;
    sectionId: string;
    fieldData?: RequestWithResponseType["request_form"]["form_section"][0]["section_field"];
    duplicatableSectionIdCondition: string;
    withOption?: boolean;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_request_page_section", { input_data: params })
    .select("*");
  if (error) throw error;
  return data as RequestWithResponseType["request_form"]["form_section"][0]["section_field"];
};

// Fetch request comment
export const getRequestComment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    request_id: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_request_comment", { request_id: params.request_id })
    .select("*");
  if (error) throw error;
  return data;
};

// Fetch item options
export const getItemOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("item_id, item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .order("item_general_name")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch supplier options
export const getSupplierOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("supplier_table")
    .select("supplier_id, supplier")
    .eq("supplier_team_id", teamId)
    .order("supplier")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch csi code options
export const getCSICodeOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
    divisionIdList: string[];
  }
) => {
  const { index, limit, divisionIdList } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_id, csi_code_level_three_description")
    .order("csi_code_level_three_description")
    .in("csi_code_division_id", divisionIdList)
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch ped item options
export const getPedItemOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("item_id, item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .eq("item_is_ped_item", true)
    .order("item_general_name")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch property number options
export const getPropertyNumberOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
    equipmentId?: string;
    isWithAcquisitionDate?: boolean;
  }
) => {
  const { teamId, index, limit, equipmentId, isWithAcquisitionDate } = params;
  let query = supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select(
      `
        equipment_description_id,
        equipment_description_property_number_with_prefix,
        equipment_description_equipment: equipment_description_equipment_id!inner(
          equipment_team_id
        )
      `
    )
    .eq("equipment_description_equipment.equipment_team_id", teamId)
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_is_available", true)
    .order("equipment_description_property_number_with_prefix");

  if (equipmentId) {
    query.eq("equipment_description_equipment_id", equipmentId);
  }
  if (isWithAcquisitionDate) {
    query.not("equipment_description_acquisition_date", "is", null);
  }

  query = query.limit(limit);
  query = query.range(index, index + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  return data as unknown as {
    equipment_description_id: string;
    equipment_description_property_number_with_prefix: string;
  }[];
};

// Get all projects
export const getAllProjects = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_table")
    .select("team_project_id, team_project_name")
    .eq("team_project_is_disabled", false)
    .eq("team_project_team_id", teamId);
  if (error) throw error;

  return data;
};

// Get all groups
export const getAllGroups = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_table")
    .select("team_group_id, team_group_name")
    .eq("team_group_is_disabled", false)
    .eq("team_group_team_id", teamId);
  if (error) throw error;

  return data;
};

// Fetch jira project list
export const getJiraProjectList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
  }
) => {
  const { from, to, search } = params;
  let query = supabaseClient
    .schema("jira_schema")
    .from("jira_project_table")
    .select("*", { count: "exact" })
    .order("jira_project_jira_label")
    .range(from, to);

  if (search) {
    query = query.ilike("jira_project_jira_label", `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { data, count: Number(count) };
};

export const getJiraFormslyProjectList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    page: number;
    limit: number;
    search?: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_jira_formsly_project_list",
    {
      input_data: params,
    }
  );
  if (error) throw error;

  const formattedData = data as unknown as {
    data: JiraFormslyProjectType[];
    count: number;
  };

  return { data: formattedData.data, count: Number(formattedData.count) };
};

export const getJiraUserAccountList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
  }
) => {
  const { from, to, search } = params;
  let query = supabaseClient
    .schema("jira_schema")
    .from("jira_user_account_table")
    .select("*", {
      count: "exact",
    })
    .order("jira_user_account_display_name")
    .range(from, to);

  if (search) {
    query = query.ilike("jira_user_account_display_name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data,
    count: Number(count),
  };
};

export const getProjectJiraUserAccountList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
    teamProjectId: string;
  }
) => {
  const { from, to, search, teamProjectId } = params;
  let query = supabaseClient
    .schema("jira_schema")
    .from("jira_project_user_table")
    .select("*", { count: "exact" })
    .eq("jira_project_user_team_project_id", teamProjectId)
    .range(from, to);

  if (search) {
    query = query.ilike("team_project_name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data,
    count: Number(count),
  };
};

export const getJiraUserRoleList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
  }
) => {
  const { from, to } = params;
  const query = supabaseClient
    .schema("jira_schema")
    .from("jira_user_role_table")
    .select("*")
    .order("jira_user_role_label")
    .range(from, to);

  const { data, error } = await query;

  if (error) throw error;

  return data;
};

export const getJiraItemCategoryList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
  }
) => {
  const { from, to, search } = params;
  let query = supabaseClient
    .schema("jira_schema")
    .from("jira_item_category_table")
    .select(
      "*, assigned_jira_user: jira_item_user_table(jira_item_user_id, jira_item_user_account_id(jira_user_account_jira_id, jira_user_account_display_name, jira_user_account_id), jira_item_user_role_id(jira_user_role_id, jira_user_role_label))",
      { count: "exact" }
    )
    .order("jira_item_category_formsly_label")
    .range(from, to);

  if (search) {
    query = query.or(
      `jira_item_category_jira_label.ilike.%${search}%, jira_item_category_formsly_label.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) throw error;

  const formattedData = data.map((item) => {
    const assignedUser = item.assigned_jira_user as unknown as {
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

    return {
      ...item,
      assigned_jira_user:
        {
          ...assignedUser[0],
          ...assignedUser[0]?.jira_item_user_account_id,
          ...assignedUser[0]?.jira_item_user_role_id,
        } ?? null,
    };
  });

  return {
    data: formattedData as unknown as JiraFormslyItemCategoryWithUserDataType[],
    count: Number(count),
  };
};

export const getJiraAutomationDataByProjectId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamProjectId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_jira_automation_data", {
    input_data: params,
  });

  if (error) {
    console.warn("Failed to fetch jira automation data");
    return null;
  }

  return data as {
    jiraProjectData: JiraProjectDataType;
    jiraItemCategoryData: JiraItemCategoryDataType[];
    jiraOrganizationData: {
      jira_organization_team_project_project_id: string;
    } & JiraOrganizationTableRow;
  };
};

// Get user current signature
export const getUserCurrentSignature = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_user_current_signature", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    user_signature_attachment: {
      attachment_value: string;
      attachment_bucket: string;
    };
  };

  return formattedData
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${formattedData.user_signature_attachment.attachment_bucket}/${formattedData.user_signature_attachment.attachment_value}`
    : "";
};

// Get non duplicatable section response
export const getNonDuplictableSectionResponse = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    fieldIdList: string[];
    requestId: string;
  }
) => {
  const { fieldIdList, requestId } = params;
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select(
      "request_response_field_id, request_response, request_response_prefix"
    )
    .eq("request_response_request_id", requestId)
    .in("request_response_field_id", fieldIdList);
  if (error) throw error;
  return data;
};

// Fetch item request conditional options
export const getItemRequestConditionalOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sectionList: {
      itemName: string;
      fieldIdList: string[];
    }[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_item_request_conditional_options", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

// Fetch service category options
export const getServiceCategoryOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("service_schema")
    .from("service_category_table")
    .select("service_category_id, service_category")
    .eq("service_category_team_id", teamId)
    .eq("service_category_is_disabled", false)
    .eq("service_category_is_available", true)
    .order("service_category")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch service unit of measurement options
export const getGeneralUnitOfMeasurementOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("unit_of_measurement_schema")
    .from("general_unit_of_measurement_table")
    .select("general_unit_of_measurement_id, general_unit_of_measurement")
    .eq("general_unit_of_measurement_team_id", teamId)
    .eq("general_unit_of_measurement_is_disabled", false)
    .eq("general_unit_of_measurement_is_available", true)
    .order("general_unit_of_measurement")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch service unit of measurement options
export const getServiceCSIDivisionOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .from("distinct_division_view")
    .select("csi_code_division_id, csi_code_division_description")
    .order("csi_code_division_description")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch service request conditional options
export const getServiceRequestConditionalOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sectionList: {
      csiDivision: string;
      fieldIdList: string[];
    }[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_service_request_conditional_options", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

// Fetch other expenses category options
export const getOtherExpensesCategoryOptionsWithLimit = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("other_expenses_schema")
    .from("other_expenses_category_table")
    .select("other_expenses_category_id, other_expenses_category")
    .eq("other_expenses_category_team_id", teamId)
    .eq("other_expenses_category_is_disabled", false)
    .eq("other_expenses_category_is_available", true)
    .order("other_expenses_category")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch other expenses csi description options
export const getOtherExpensesCSIDescriptionOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_id, csi_code_level_three_description")
    .eq("csi_code_division_id", "01")
    .order("csi_code_level_three_description")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch other expenses request conditional options
export const getOtherExpensesRequestConditionalOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sectionList: {
      category: string;
      fieldIdList: string[];
    }[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_other_expenses_request_conditional_options", {
      input_data: params,
    })
    .select("*");
  if (error) throw error;
  return data;
};

// Fetch ped equipment category options
export const getPEDEquipmentCategoryOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_category_table")
    .select("equipment_category_id, equipment_category")
    .eq("equipment_category_team_id", teamId)
    .eq("equipment_category_is_disabled", false)
    .eq("equipment_category_is_available", true)
    .order("equipment_category")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch capacity unit of measurement options
export const getCapacityUnitOfMeasurementOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("unit_of_measurement_schema")
    .from("capacity_unit_of_measurement_table")
    .select("capacity_unit_of_measurement_id, capacity_unit_of_measurement")
    .eq("capacity_unit_of_measurement_team_id", teamId)
    .eq("capacity_unit_of_measurement_is_disabled", false)
    .eq("capacity_unit_of_measurement_is_available", true)
    .order("capacity_unit_of_measurement")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch ped equipment request conditional options
export const getPEDEquipmentRequestConditionalOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sectionList: {
      category: string;
      equipmentName: string;
      brand: string;
      fieldIdList: string[];
    }[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_ped_equipment_request_conditional_options", {
      input_data: params,
    })
    .select("*");
  if (error) throw error;
  return data;
};

// Fetch ped item general name options
export const getPedItemGeneralNameOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("item_id, item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .eq("item_is_ped_item", true)
    .order("item_general_name")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch all item category option
export const getItemCategoryOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_item_category_option", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as unknown as {
    item_category: string;
    item_category_id: string;
  }[];
};

// Fetch all item form approver
export const getItemFormApprover = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_item_form_approver", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

// check if item category already exists
export const checkItemCategory = async (
  supabaseClient: SupabaseClient<Database>,
  params: { category: string }
) => {
  const { category } = params;

  const { count, error } = await supabaseClient
    .schema("item_schema")
    .from("item_category_table")
    .select("*", { count: "exact", head: true })
    .eq("item_category", category)
    .eq("item_category_is_disabled", false);
  if (error) throw error;

  return Boolean(count);
};

// Get item category list
export const getItemCategoryList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_item_category_list", { input_data: params })
    .select("*");
  if (error) throw error;

  const formattedData = data as unknown as {
    data: ItemCategoryWithSigner[];
    count: number;
  };

  return {
    data: formattedData.data,
    count: formattedData.count,
  };
};

// Get form section
export const getFormSection = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    formName: string;
  }
) => {
  const { formId, formName } = params;
  let query = supabaseClient
    .schema("form_schema")
    .from("section_table")
    .select(
      `
        *,
        section_field:
        field_table(
          *,
          field_option: option_table(*)
        )
      `
    )
    .eq("section_form_id", formId);

  switch (formName) {
    case "Item":
      query = query.in("field_table.field_id", ITEM_FIELD_ID_LIST);
      break;
    case "PED Item":
      query = query.in("field_table.field_id", PED_ITEM_FIELD_ID_LIST);
      break;
    case "IT Asset":
      query = query.in("field_table.field_id", IT_ASSET_FIELD_ID_LIST);
      break;
    case "Technical Assessment":
      query = query.in("field_table.field_id", TECHNICAL_ASSESSMENT_FIELD_LIST);
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  const formattedSection = data as unknown as FormType["form_section"];
  const sortedSection = formattedSection
    .sort((a, b) => {
      return a.section_order - b.section_order;
    })
    .map((section) => {
      const sortedFields = section.section_field
        .sort((a, b) => {
          return a.field_order - b.field_order;
        })
        .map((field) => {
          let sortedOption = field.field_option;
          if (field.field_option) {
            sortedOption = field.field_option.sort((a, b) => {
              return a.option_order - b.option_order;
            });
          }
          return {
            ...field,
            field_option: sortedOption,
          };
        });
      return {
        ...section,
        section_field: sortedFields,
      };
    });

  return sortedSection;
};

// Fetch it asset item options
export const getITAssetItemOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("item_schema")
    .from("item_table")
    .select("item_id, item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .eq("item_is_it_asset_item", true)
    .order("item_general_name")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

export const getJiraOrganizationList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
  }
) => {
  const { from, to, search } = params;
  let query = supabaseClient
    .schema("jira_schema")
    .from("jira_organization_table")
    .select("*", {
      count: "exact",
    })
    .order("jira_organization_jira_label")
    .range(from, to);

  if (search) {
    query = query.ilike("jira_organization_jira_label", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data,
    count: Number(count),
  };
};

export const getFieldResponseByRequestId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    fieldId: string;
  }
) => {
  const { requestId, fieldId } = params;

  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select("request_response")
    .eq("request_response_request_id", requestId)
    .eq("request_response_field_id", fieldId);

  if (error) throw error;

  return data;
};

export const getRequestTypeFieldResponse = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    fieldId: string;
  }
) => {
  const { requestId, fieldId } = params;

  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select("request_response")
    .eq("request_response_request_id", requestId)
    .eq("request_response_field_id", fieldId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Get team admin list
export const getTeamAdminList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_admin_list", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

export const getAdminTicketAnalytics = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    adminTeamMemberId: string;
    intervalList: { startDate: string; endDate: string }[];
    ticketCategoryIdList: string[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_admin_ticket_analytics", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

export const getTicket = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    ticketId: string;
  }
) => {
  const { data } = await supabaseClient
    .schema("ticket_schema")
    .from("ticket_table")
    .select("*")
    .eq("ticket_id", params.ticketId)
    .maybeSingle();

  return data;
};

// Fetch formsly invoice history list
export const fetchFormslyInvoiceHistoryList = async (
  supabaseClient: SupabaseClient<OneOfficeDatabase["transaction_schema"]>,
  params: {
    userId: string;
    page: number;
    limit: number;
  }
) => {
  const { userId, page, limit } = params;

  const start = (page - 1) * limit;
  const { data, count, error } = await getTransactionList({
    supabaseClient,
    pagination: {
      from: start,
      to: start + limit,
    },
    filter: {
      appSourceUserId: userId,
      appSource: APP_SOURCE_ID,
    },
  });
  if (error) throw error;
  return { data: data as TransactionTableRow[], count };
};

// Fetch formsly invoice history list
export const getCsiTableSpecialFieldOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    fieldId: string;
    search?: string;
  }
) => {
  const { search, fieldId } = params;

  let query = supabaseClient
    .schema("lookup_schema")
    .from("csi_code_table")
    .select("csi_code_id, csi_code_section");

  if (search) {
    query = query.ilike("csi_code_section", `%${search}%`);
  }

  query.limit(SELECT_OPTION_LIMIT);
  const { data, error } = await query;

  if (error || !data) {
    throw new Error("Failed to fetch csi code table");
  }

  const optionData = data.map((item, index) => ({
    option_id: item.csi_code_id,
    option_value: item.csi_code_section,
    option_order: index,
    option_field_id: fieldId,
  }));

  return optionData;
};

// Fetch team latest transaction
export const fetchTeamLatestTransaction = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_transaction_table")
    .select("*")
    .eq("team_transaction_team_id", teamId)
    .order("team_transaction_date_created", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  return data;
};

// Fetch latest formsly price
export const fetchFormslyLatestPrice = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("formsly_price_table")
    .select("formsly_price")
    .order("formsly_price_date_created", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data.formsly_price;
};

// Fetch team department options
export const getTeamDepartmentOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_department_table")
    .select("team_department_id, team_department_name")
    .eq("team_department_is_disabled", false)
    .order("team_department_name")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch equipment code options
export const getEquipmentCodeOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("equipment_schema")
    .from("equipment_description_view")
    .select(
      "equipment_description_id, equipment_description_property_number_with_prefix"
    )
    .eq("equipment_description_is_disabled", false)
    .eq("equipment_description_is_available", true)
    .order("equipment_description_property_number_with_prefix")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch equipment unit options
export const getEquipmentUnitOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("unit_of_measurement_schema")
    .from("equipment_unit_of_measurement_table")
    .select("equipment_unit_of_measurement_id, equipment_unit_of_measurement")
    .eq("equipment_unit_of_measurement_is_disabled", false)
    .order("equipment_unit_of_measurement")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch employee position options
export const getEmployeePositionOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
  }
) => {
  const { index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("employee_job_title_table")
    .select("employee_job_title_id, employee_job_title_label")
    .eq("employee_job_title_is_disabled", false)
    .order("employee_job_title_label")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch employee options
export const getEmployeeOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    limit: number;
    search: string;
  }
) => {
  const { index, limit, search } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("scic_employee_table")
    .select("scic_employee_id, scic_employee_hris_id_number")
    .ilike("scic_employee_hris_id_number", `%${search}%`)
    .order("scic_employee_hris_id_number")
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

// Fetch employee name based on id
export const getEmployeeName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    employeeId: string;
  }
) => {
  const { employeeId } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("scic_employee_table")
    .select("*")
    .eq("scic_employee_hris_id_number", employeeId)
    .maybeSingle();
  if (error) throw error;

  return data;
};

// Fetch section in request page with multiple duplicatable section
export const getSectionInRequestPageWithMultipleDuplicatableSection = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    index: number;
    requestId: string;
    duplicatableSectionIdCondition: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("fetch_form_section_with_multiple_duplicatable_section", {
      input_data: params,
    })
    .select("*");
  if (error) throw error;
  return data;
};

// Get all section
export const getAllSection = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    sectionIdList: string[];
  }
) => {
  const { sectionIdList } = params;

  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("section_table")
    .select("*")
    .in("section_id", sectionIdList)
    .order("section_order");
  if (error) throw error;
  return data;
};

// Fetch employee name based on id
export const checkIfAllPrimaryApprovedTheRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    requestSignerId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_if_all_primary_approver_approved_the_request", {
      input_data: params,
    })
    .select("*");
  if (error) throw error;

  return data as unknown as boolean;
};

export const getJiraProjectByTeamProjectName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamProjectName: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_formsly_project_table")
    .select(
      "jira_project_id!inner(jira_project_jira_id, jira_project_jira_label), formsly_project_id!inner(team_project_name)"
    )
    .eq("formsly_project_id.team_project_name", params.teamProjectName)
    .maybeSingle();
  if (error || !data) throw error;
  const formattedData = data as unknown as {
    jira_project_id: {
      jira_project_jira_id: string;
      jira_project_jira_label: string;
    };
    formsly_project_id: { team_project_name: string };
  };
  return {
    jiraId: formattedData.jira_project_id.jira_project_jira_id,
    jiraLabel: formattedData.jira_project_id.jira_project_jira_label,
  };
};

export const getRequestStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("request_status")
    .eq("request_id", params.requestId)
    .maybeSingle();

  if (error || !data) throw error;

  return data.request_status;
};

export const getJobTitleList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    from: number;
    to: number;
    search?: string;
  }
) => {
  const { from, to, search } = params;
  let query = supabaseClient
    .schema("lookup_schema")
    .from("employee_job_title_table")
    .select("*", { count: "exact" })
    .order("employee_job_title_label")
    .range(from, to);

  if (search) {
    query = query.ilike("employee_job_title_label", `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { data, count: Number(count) };
};

export const getRequestFieldResponse = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    fieldId: string[];
  }
) => {
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select("request_response, request_response_field_id")
    .eq("request_response_request_id", params.requestId)
    .in("request_response_field_id", params.fieldId);

  if (error) throw error;

  return data;
};

export const getExistingConnectedRequest = async (
  supabaseClient: SupabaseClient<Database>,
  parentRequestId: string
) => {
  const { data, error } = await supabaseClient
    .schema("request_schema")
    .from("request_response_table")
    .select("request_response, request: request_response_request_id!inner(*)")
    .eq("request_response", JSON.stringify(parentRequestId))
    .in("request.request_status", ["PENDING", "APPROVED"])
    .maybeSingle();

  if (error) throw error;

  return data
    ? (data.request as unknown as Pick<
        RequestTableRow,
        "request_formsly_id_prefix" | "request_formsly_id_serial"
      >)
    : null;
};

export const getFormDepartmentSigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectId: string;
    formId: string;
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { projectId, formId } = params;
  const { data, count, error } = await supabaseClient
    .schema("form_schema")
    .from("signer_table")
    .select("*", { count: "exact" })
    .eq("signer_team_project_id", projectId)
    .eq("signer_form_id", formId)
    .eq("signer_is_disabled", false)
    .not("signer_team_department_id", "is", null);

  if (error) throw error;

  return { data, count: Number(count) };
};

export const checkIfUserIsRequestOwner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
    requestId: string;
  }
) => {
  const { requestId, teamMemberId } = params;
  const { count, error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .select("*", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("request_team_member_id", teamMemberId);

  if (error) throw error;

  return Number(count) > 0;
};

// Check if user email already exists
export const checkUserEmail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    emailList: string[];
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_user_email", { input_data: params })
    .select("*");
  if (error) throw error;
  return data as string[];
};

export const getLRFSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    limit: number;
    page: number;
    projectFilter?: string;
    startDate?: string;
    endDate?: string;
    sortFilter: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_lrf_summary_table", {
    input_data: params,
  });

  if (error) throw error;

  return data as { data: LRFSpreadsheetData[]; count: number };
};

export const getApplicationInformationPositionOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    index: number;
    limit: number;
  }
) => {
  const { teamId, index, limit } = params;
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("position_table")
    .select("*")
    .eq("position_team_id", teamId)
    .eq("position_is_disabled", false)
    .eq("position_is_available", true)
    .limit(limit)
    .range(index, index + limit - 1);
  if (error) throw error;

  return data;
};

export const getApplicationInformationSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: ApplicationInformationFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    requestFilter: {
      ...params.requestFilter,
      dateCreatedRange: {
        start: params.requestFilter?.dateCreatedRange?.start
          ? new Date(
              params.requestFilter?.dateCreatedRange?.start
            ).toLocaleDateString()
          : undefined,
        end: params.requestFilter?.dateCreatedRange?.end
          ? new Date(
              params.requestFilter?.dateCreatedRange?.end
            ).toLocaleDateString()
          : undefined,
      },
      dateUpdatedRange: {
        start: params.requestFilter?.dateUpdatedRange?.start
          ? new Date(
              params.requestFilter?.dateUpdatedRange?.start
            ).toLocaleDateString()
          : undefined,
        end: params.requestFilter?.dateUpdatedRange?.end
          ? new Date(
              params.requestFilter?.dateUpdatedRange?.end
            ).toLocaleDateString()
          : undefined,
      },
    },
    responseFilter: {
      ...params.responseFilter,
      yearGraduated: {
        start: params.responseFilter?.yearGraduated?.start
          ? moment(params.responseFilter?.yearGraduated?.start)
              .subtract(1, "year")
              .format("MM-DD-YYYY")
          : undefined,
        end: params.responseFilter?.yearGraduated?.end
          ? moment(params.responseFilter?.yearGraduated?.end).format(
              "MM-DD-YYYY"
            )
          : undefined,
      },
      soonestJoiningDate: {
        start: params.responseFilter?.soonestJoiningDate?.start
          ? moment(params.responseFilter?.soonestJoiningDate?.start)
              .subtract(1, "day")
              .format("MM-DD-YYYY")
          : undefined,
        end: params.responseFilter?.soonestJoiningDate?.end
          ? new Date(
              params.responseFilter?.soonestJoiningDate?.end
            ).toLocaleDateString()
          : undefined,
      },
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_application_information_summary_table",
    {
      input_data: updatedParams,
    }
  );

  if (error) throw error;
  return data as ApplicationInformationSpreadsheetData[];
};

export const getFormSectionWithFieldList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    userId: string;
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_form_section_with_field_list",
    {
      input_data: params,
    }
  );
  if (error) throw error;

  return data as unknown as {
    sectionList: SectionWithFieldType[];
    optionList: (OptionTableRow & { field_name: string })[];
  };
};

export const getUserRequestList = async (
  supabaseClient: SupabaseClient<Database>,
  params: FetchUserRequestListParams
) => {
  const {
    page,
    limit,
    status,
    search,
    isAscendingSort,
    columnAccessor = "request_date_created",
    email,
    form,
  } = params;

  const sort = isAscendingSort ? "ASC" : "DESC";

  const statusCondition = status
    ?.map((value) => `a.request_status = '${value}'`)
    .join(" OR ");

  const formCondition = form
    ?.map((value) => `a.request_form_id = '${value}'`)
    .join(" OR ");

  const searchCondition =
    search && validate(search)
      ? `a.request_id = '${search}'`
      : `a.request_formsly_id ILIKE '%' || '${search}' || '%'`;

  const { data: data, error } = await supabaseClient.rpc(
    "fetch_user_request_list",
    {
      input_data: {
        page: page,
        limit: limit,
        status: statusCondition ? `AND (${statusCondition})` : "",
        search: search ? `AND (${searchCondition})` : "",
        sort,
        columnAccessor,
        email,
        form: formCondition ? `AND (${formCondition})` : "",
      },
    }
  );

  if (error || !data) throw error;
  const dataFormat = data as unknown as {
    data: RequestListItemType[];
    count: number;
  };

  return { data: dataFormat.data, count: dataFormat.count };
};

export const getUserIdInApplicationInformation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_user_id_in_application_information",
    {
      input_data: params,
    }
  );
  if (error) throw error;
  return data;
};

export const getUserIdInApplicationInformationV1 = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_user_id_in_application_information_v1",
    {
      input_data: params,
    }
  );
  if (error) throw error;
  return data as string | undefined;
};

export const checkUserIdNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    idNumber: string;
  }
) => {
  const { idNumber } = params;
  const { count, error } = await supabaseClient
    .schema("user_schema")
    .from("user_valid_id_table")
    .select("user_valid_id_number", { count: "exact", head: true })
    .eq("user_valid_id_number", idNumber);

  if (error) throw error;
  return !Boolean(count);
};

export const getPublicFormList = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("form_table")
    .select("*")
    .eq("form_is_public_form", true);
  if (error) throw error;

  return data;
};

export const getPositionClassification = async (
  supabaseClient: SupabaseClient<Database>,
  position: string
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("position_table")
    .select("position_classification")
    .eq("position", position)
    .limit(1);
  if (error) throw error;

  return data[0].position_classification;
};

export const getHRPhoneInterviewSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: HRPhoneInterviewFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    hr_phone_interview_date_created: {
      start: params.hr_phone_interview_date_created?.start
        ? new Date(
            params.hr_phone_interview_date_created?.start
          ).toLocaleDateString()
        : undefined,
      end: params.hr_phone_interview_date_created?.end
        ? moment(params.hr_phone_interview_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
    hr_phone_interview_schedule: {
      start: params.hr_phone_interview_schedule?.start
        ? moment(params.hr_phone_interview_schedule?.start)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
      end: params.hr_phone_interview_schedule?.end
        ? moment(params.hr_phone_interview_schedule?.end)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_hr_phone_interview_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as HRPhoneInterviewSpreadsheetData[];
};

export const getPhoneMeetingSlots = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    startTime: string;
    endTime: string;
    meetingDuration: number;
    breakDuration: number;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_phone_meeting_available",
    {
      input_data: params,
    }
  );

  if (error) throw error;

  return data as {
    slot_start: string;
    slot_end: string;
    isDisabled: boolean;
  }[];
};

export const getTradeTestSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: TradeTestFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    trade_test_date_created: {
      start: params.trade_test_date_created?.start
        ? new Date(params.trade_test_date_created?.start).toLocaleDateString()
        : undefined,
      end: params.trade_test_date_created?.end
        ? moment(params.trade_test_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
    trade_test_schedule: {
      start: params.trade_test_schedule?.start
        ? moment(params.trade_test_schedule?.start)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
      end: params.trade_test_schedule?.end
        ? moment(params.trade_test_schedule?.end)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_trade_test_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as TradeTestSpreadsheetData[];
};

export const getTechnicalInterviewSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: TechnicalInterviewFilterFormValues & {
    userId: string;
    technicalInterviewNumber: number;
  }
) => {
  const updatedParams = {
    ...params,
    technical_interview_date_created: {
      start: params.technical_interview_date_created?.start
        ? new Date(
            params.technical_interview_date_created?.start
          ).toLocaleDateString()
        : undefined,
      end: params.technical_interview_date_created?.end
        ? moment(params.technical_interview_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
    technical_interview_schedule: {
      start: params.technical_interview_schedule?.start
        ? moment(params.technical_interview_schedule?.start)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
      end: params.technical_interview_schedule?.end
        ? moment(params.technical_interview_schedule?.end)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_technical_interview_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as TechnicalInterviewSpreadsheetData[];
};

export const getDirectorInterviewSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: DirectorInterviewFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    director_interview_date_created: {
      start: params.director_interview_date_created?.start
        ? new Date(
            params.director_interview_date_created?.start
          ).toLocaleDateString()
        : undefined,
      end: params.director_interview_date_created?.end
        ? moment(params.director_interview_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
    director_interview_schedule: {
      start: params.director_interview_schedule?.start
        ? moment(params.director_interview_schedule?.start)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
      end: params.director_interview_schedule?.end
        ? moment(params.director_interview_schedule?.end)
            .utc()
            .format("YYYY-MM-DD HH:mm:ssZZ")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_director_interview_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as DirectorInterviewSpreadsheetData[];
};

export const getBackgroundCheckSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: BackgroundCheckFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    background_check_date_created: {
      start: params.background_check_date_created?.start
        ? new Date(
            params.background_check_date_created?.start
          ).toLocaleDateString()
        : undefined,
      end: params.background_check_date_created?.end
        ? moment(params.background_check_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_background_check_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as BackgroundCheckSpreadsheetData[];
};

export const getJobOfferSummaryData = async (
  supabaseClient: SupabaseClient<Database>,
  params: JobOfferFilterFormValues & {
    userId: string;
  }
) => {
  const updatedParams = {
    ...params,
    job_offer_date_created: {
      start: params.job_offer_date_created?.start
        ? new Date(params.job_offer_date_created?.start).toLocaleDateString()
        : undefined,
      end: params.job_offer_date_created?.end
        ? moment(params.job_offer_date_created?.end)
            .add(1, "day")
            .format("MM-DD-YYYY")
        : undefined,
    },
  };

  const { data, error } = await supabaseClient.rpc(
    "get_job_offer_summary_table",
    {
      input_data: updatedParams,
    }
  );
  if (error) throw error;
  return data as JobOfferSpreadsheetData[];
};

export const getJobHistory = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { data, error } = await supabaseClient.rpc("get_job_history", {
    input_data: params,
  });
  if (error) throw error;

  return data as unknown as JobOfferHistoryType[];
};

export const getInterviewOnlineMeeting = async (
  supabaseClient: SupabaseClient<Database>,
  interviewId: string
) => {
  const { data, error } = await supabaseClient
    .schema("hr_schema")
    .from("interview_online_meeting_table")
    .select("*")
    .eq("interview_meeting_interview_id", interviewId)
    .limit(1);

  if (error) throw error;

  return data[0] as InterviewOnlineMeetingTableRow;
};

export const checkIfGroupMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    groupName: string[];
    teamId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("check_if_group_member", {
    input_data: params,
  });

  if (error) throw error;

  return data;
};
export const checkIfOwner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    teamId: string;
  }
) => {
  const { userId, teamId } = params;
  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_member_table")
    .select("team_member_role")
    .eq("team_member_user_id", userId)
    .eq("team_member_team_id", teamId)
    .maybeSingle();
  if (error) throw error;
  const role = data?.team_member_role;
  if (role === null) return false;
  return role === "OWNER";
};

export const validateEnvApiKey = async (
  supabase: SupabaseClient<Database>,
  params: {
    apiKey: string;
    endPoint: string;
  }
) => {
  const { apiKey, endPoint } = params;

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const { data: apiKeyData, error } = await supabase
    .schema("team_schema")
    .from("team_key_table")
    .select("*")
    .eq("team_key_api_key", apiKey)
    .maybeSingle();

  if (error) throw new Error("Error fetching API key data");
  if (!apiKeyData) throw new Error("API key not found");

  if (apiKeyData.team_key_is_disabled) {
    throw new Error("API key is disabled");
  }

  const { error: recordError } = await supabase
    .schema("team_schema")
    .from("team_key_record_table")
    .insert({
      team_key_record_team_key_id: apiKeyData.team_key_id,
      team_key_record_access_api: endPoint,
    });

  if (recordError) throw new Error("Error logging API key access");

  return apiKeyData;
};

export const getRequestRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_request_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};

export const getOtherExpensesRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc(
    "get_other_expenses_raya_api",
    {
      input_data: {
        offset: parsedOffset,
        limit: parsedLimit,
        teamId: teamId,
        startDate: startDate,
        endDate: endDate,
        order: parsedOrder,
      },
    }
  );

  if (error) {
    throw error;
  }
  return data;
};

export const getPedPartRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_ped_part_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};

export const getItemRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_item_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};

export const getItAssetRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_it_asset_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};

export const getPedItemRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_ped_item_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};

export const getServicesRayaApi = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    offset?: string;
    limit?: string;
    order?: string;
    startDate?: string;
    teamId: string;
    endDate?: string;
  }
) => {
  const {
    offset = "0",
    limit = "100",
    order = "asc",
    startDate,
    teamId,
    endDate,
  } = params;

  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = Math.min(parseInt(limit, 10), 1000);
  const parsedOrder = order === "desc" ? "desc" : "asc";

  const { data, error } = await supabaseClient.rpc("get_services_raya_api", {
    input_data: {
      offset: parsedOffset,
      limit: parsedLimit,
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      order: parsedOrder,
    },
  });

  if (error) {
    throw error;
  }
  return data;
};
export const getLatestApiKey = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;

  const { data, error } = await supabaseClient
    .schema("team_schema")
    .from("team_key_table")
    .select("team_key_api_key,team_key_label")
    .eq("team_key_team_id", teamId)
    .order("team_key_date_created", { ascending: false })
    .eq("team_key_is_disabled", false);

  if (error) {
    throw error;
  }
  return data;
};

export const getAdOwnerList = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("ad_owner_table")
    .select("*");
  if (error) throw error;

  return data;
};

export const getInterview = async (
  supabaseClient: SupabaseClient,
  params: {
    interviewId: string;
    table: string;
    interviewNumber?: number;
  }
) => {
  const { interviewId, table, interviewNumber } = params;
  let query = supabaseClient
    .schema("hr_schema")
    .from(`${table}_table`)
    .select()
    .eq(`${table}_id`, interviewId)
    .limit(1);

  if (interviewNumber) {
    query = query.eq(`${table}_number`, interviewNumber);
  }
  const { data, error } = await query;
  if (error) throw error;

  return data[0];
};

export const phoneInterviewValidation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    interview_schedule?: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "phone_interview_validation",
    {
      input_data: params,
    }
  );

  if (error) throw error;

  return data as {
    message: string;
    status: string;
    assigned_hr_team_member_id: string;
    assigned_hr_full_name: string;
    assigned_hr_email: string;
  };
};

export const getHRSpreadsheetViewOnLoad = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_hr_spreadsheet_view_on_load", { input_data: params })
    .select("*");
  if (error) throw error;

  return data;
};

export const checkSpreadsheetRowStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: { table: string; status: string; id: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_spreadsheet_row_status", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

export const checkJobOfferRow = async (
  supabaseClient: SupabaseClient<Database>,
  params: { id: string; status: string; requestId: string }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_job_offer_row", { input_data: params })
    .select("*");
  if (error) throw error;
  return data;
};

export const getHRIndicatorCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_hr_indicator_count", {
    input_data: params,
  });
  if (error) throw error;

  return data;
};

export const getFieldOfStudyOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    value: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_field_of_study_options",
    { input_data: params }
  );
  if (error) throw error;

  return data as string[];
};

export const getDegreeNameOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    degreeType: string;
    fieldOfStudy: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_degree_name_options", {
    input_data: params,
  });
  if (error) throw error;

  return data as string[];
};

export const getHRProjectOptions = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient.rpc("get_hr_project_options");
  if (error) throw error;
  return data as HRProjectType[];
};

export const getQuestionnaireList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    page: number;
    limit: number;
    creator?: string;
    isAscendingSort: boolean;
    search?: string;
  }
) => {
  const { teamId, page, limit, creator, isAscendingSort, search } = params;
  const sortCondition = isAscendingSort ? "asc" : "desc";

  const creatorCondition =
    creator && validate(creator)
      ? `q.questionnaire_created_by = '${creator}'`
      : `q.questionnaire_created_by '%' || '${creator}' || '%'`;

  const searchCondition =
    search && validate(search)
      ? `q.questionnaire_name = '${search}'`
      : `q.questionnaire_name ILIKE '%' || '${search}' || '%'`;

  const { data, error } = await supabaseClient.rpc(
    "get_questionnare_table_on_load",
    {
      input_data: {
        teamId,
        search: search ? `AND (${searchCondition})` : "",
        creator: creator ? `AND (${creatorCondition})` : "",
        page,
        isAscendingSort: sortCondition,
        limit,
      },
    }
  );
  if (error) throw error;

  return data as unknown as {
    data: TechnicalAssessmentTableRow[];
    count: number;
  };
};

export const getQuestionnaireName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    questionnaireId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("questionnaire_table")
    .select("questionnaire_name")
    .eq("questionnaire_id", params.questionnaireId);

  if (error) throw error;

  return data[0] as { questionnaire_name: string };
};

export const getPositionPerQuestionnaire = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    questionnaireId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("position_table")
    .select("position_alias")
    .eq("position_questionnaire_id", params.questionnaireId);

  if (error) throw error;

  const positions = data.map((item) => item.position_alias);

  return positions;
};

export const getOptionsTechnicalQuestion = async (
  supabaseClient: SupabaseClient<Database>,
  params: { fieldId: string }
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("option_table")
    .select("*")
    .eq("option_field_id", params.fieldId)
    .order("option_order", { ascending: true });

  if (error) throw error;
  return data as OptionTableRow[];
};

export const getTechnicalOptionsItem = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    questionnaireId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_technical_options", {
    input_data: params,
  });

  if (error) throw error;

  return data as unknown as QuestionnaireData;
};
export const getPositionTypeOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("position_table")
    .select("*")
    .eq("position_team_id", params.teamId)
    .order("position_alias");

  if (error) throw error;

  const returnData = data.map((item, index) => {
    return {
      option_value: item.position_alias,
      option_id: item.position_id,
      option_field_id: uuidv4(),
      option_order: index,
    };
  });

  return returnData as OptionTableRow[];
};

export const getHRApplicantAnalytics = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    startDate?: string;
    endDate?: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_application_information_analytics",
    { input_data: params }
  );
  if (error) throw error;

  return data as HRAnalyticsData;
};

export const getRequestAdOwner = async (
  supabaseClient: SupabaseClient<Database>,
  requestId: string
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("ad_owner_request_table")
    .select("ad_owner: ad_owner_request_owner_id(ad_owner_name)")
    .eq("ad_owner_request_request_id", requestId)
    .maybeSingle();
  if (error) throw error;

  return data as unknown as { ad_owner: { ad_owner_name: string } };
};

export const getEmailResendTimer = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_email_resend_timer", {
    input_data: params,
  });
  if (error) throw error;

  return data as number;
};

export const checkAssessmentCreateRequestPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    fieldAndResponse: {
      fieldId: string;
      response: string;
    }[];
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "check_assessment_create_request_page",
    {
      input_data: params,
    }
  );
  if (error) throw error;

  return data as boolean;
};

export const getQuestionnaireDetails = async (
  supabaseClient: SupabaseClient<Database>,
  questionnaireId: string
) => {
  const { data, error } = await supabaseClient
    .schema("form_schema")
    .from("questionnaire_table")
    .select("questionnaire_name, questionnaire_date_created")
    .eq("questionnaire_id", questionnaireId)
    .limit(1);
  if (error) throw error;

  return data[0] as unknown as {
    questionnaire_name: string;
    questionnaire_date_created: string;
  };
};

export const getPositionCategory = async (
  supabaseClient: SupabaseClient<Database>,
  position: string
) => {
  const { data, error } = await supabaseClient
    .schema("lookup_schema")
    .from("position_table")
    .select("position_category")
    .eq("position_alias", position)
    .limit(1);
  if (error) throw error;

  return data[0].position_category;
};

export const getHrAnalyticsData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    filterChartValues: FilterChartValues;
  }
) => {
  const { data, error } = await supabaseClient.rpc("hr_response_analytics", {
    input_data: {
      filterChartValues: {
        memberFilter: params.filterChartValues.memberFilter,
        stepFilter: params.filterChartValues.stepFilter,
        frequencyFilter: params.filterChartValues.frequencyFilter,
        startDate: params.filterChartValues.startDate
          ? params.filterChartValues.startDate.toISOString()
          : null,
        endDate: params.filterChartValues.endDate
          ? params.filterChartValues.endDate.toISOString()
          : null,
      },
    },
  });
  if (error) throw error;

  return data as unknown as Dataset;
};

export const getTeamGroupMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    groupId: string;
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("get_team_group_member", { input_data: params })
    .select("*");
  if (error) throw error;

  return data as TeamMemberType[];
};

export const getInventoryFormDetails = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    eventId: string;
    userId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("modal_form_on_load", {
    input_data: params,
  });
  if (error) throw error;

  return data as unknown as InventoryFormType;
};

export const getEventDetails = async (
  supabaseClient: SupabaseClient<Database>,
  teamId: string
) => {
  const { data, error } = await supabaseClient
    .schema("inventory_schema")
    .from("inventory_event_table")
    .select("event_id,event_name")
    .eq("event_team_id", teamId);
  if (error) throw error;

  return data;
};

export const getCategoryOptions = async (
  supabaseClient: SupabaseClient<Database>,
  params: { page?: number; limit?: number; search?: string; teamId: string }
) => {
  const { page, limit, search, teamId } = params;
  let query = supabaseClient
    .schema("inventory_schema")
    .from("category_table")
    .select("*", { count: "exact" })
    .eq("category_is_disabled", false)
    .eq("category_team_id", teamId);

  if (search) {
    query = query.ilike("category_name", `%${search}%`);
  }

  if (limit && limit > 0 && page && page > 0) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return { data: data as CategoryTableRow[], totalCount: count ?? 0 };
};

export const getSubCategoryList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { page: number; limit: number; search?: string }
) => {
  const { data, error } = await supabaseClient.rpc("get_sub_field_options", {
    input_data: params,
  });

  if (error) throw error;

  return data as SubCategoryData;
};

export const getDepartmentList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    search?: string;
    page: number;
    limit: number;
  }
) => {
  const { search, page, limit } = params;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabaseClient
    .schema("team_schema")
    .from("team_department_table")
    .select("*", { count: "exact" })
    .range(start, end);

  if (search) {
    query = query.ilike("team_department_name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data: data as Department[],
    totalCount: count ?? 0,
  };
};

export const getSiteList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    search?: string;
    page?: number;
    limit?: number;
    teamid: string;
  }
) => {
  const { search, page, limit, teamid } = params;

  const start = page && limit ? (page - 1) * limit : undefined;
  const end = start !== undefined && limit ? start + limit - 1 : undefined;

  let query = supabaseClient
    .schema("inventory_schema")
    .from("site_table")
    .select("*", { count: "exact" })
    .eq("site_is_disabled", false)
    .eq("site_team_id", teamid);

  if (start !== undefined && end !== undefined) {
    query = query.range(start, end);
  }

  if (search) {
    query = query.ilike("site_name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return { data: data as SiteTableRow[], totalCount: count ?? 0 };
};

export const getLocationList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    site_id?: string;
    page: number;
    limit: number;
  }
) => {
  const { site_id, page, limit } = params;

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  let query = supabaseClient
    .schema("inventory_schema")
    .from("location_table")
    .select("*", { count: "exact" })
    .eq("location_is_disabled", false)
    .range(start, end);

  if (site_id) {
    query = query.eq("location_site_id", site_id);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data: data as LocationTableRow[],
    totalCount: count ?? 0,
  };
};

export const getSubFieldOrCustomField = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    categoryName: string | null;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_sub_or_custom_field", {
    input_data: params,
  });

  if (error) throw error;

  return data as {
    customFields: InventoryFormValues[];
    subFields: InventoryFormValues[];
  };
};

export const getLocationOption = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    siteName: string | null;
  }
) => {
  const { siteName } = params;

  const { data: siteData, error: siteError } = await supabaseClient
    .schema("inventory_schema")
    .from("site_table")
    .select("site_id")
    .eq("site_is_disabled", false)
    .eq("site_name", siteName ? siteName : "")
    .limit(1);

  if (siteError) throw siteError;

  const { data: locationData, error: locationError } = await supabaseClient
    .schema("inventory_schema")
    .from("location_table")
    .select("*")
    .eq("location_is_disabled", false)
    .eq("location_site_id", siteData[0].site_id);

  if (locationError) throw locationError;

  return locationData as LocationTableRow[];
};

export const getAssetSpreadsheetView = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    limit: number;
    page: number;
    sort: boolean;
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_asset_spreadsheet_view",
    {
      input_data: params,
    }
  );

  if (error) throw error;

  return data as unknown as InventoryListType[];
};

export const getColumnList = async (
  supabaseClient: SupabaseClient<Database>
) => {
  const { data, error } = await supabaseClient.rpc("get_column_fields");

  if (error) throw error;

  return data;
};
