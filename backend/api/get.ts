import { EditRequestOnLoadProps } from "@/pages/[teamName]/requests/[requestId]/edit";
import { sortFormList } from "@/utils/arrayFunctions/arrayFunctions";
import { FORMSLY_FORM_ORDER } from "@/utils/constant";
import { Database } from "@/utils/database";
import { addAmpersandBetweenWords, regExp, startCase } from "@/utils/string";
import {
  AppType,
  ApproverUnresolvedRequestListType,
  AttachmentBucketType,
  AttachmentTableRow,
  CSICodeTableRow,
  CanvassAdditionalDetailsType,
  CanvassLowestPriceType,
  CanvassType,
  ConnectedRequestItemType,
  CreateTicketPageOnLoad,
  FormStatusType,
  FormType,
  ItemWithDescriptionAndField,
  ItemWithDescriptionType,
  MemoFormatType,
  MemoListItemType,
  MemoType,
  NotificationOnLoad,
  NotificationTableRow,
  OtherExpensesTypeTableRow,
  ReferenceMemoType,
  RequestByFormType,
  RequestDashboardOverviewData,
  RequestListItemType,
  RequestListOnLoad,
  RequestProjectSignerType,
  RequestResponseTableRow,
  RequestWithResponseType,
  SSOTOnLoad,
  ServiceWithScopeAndChoice,
  SignerRequestSLA,
  SignerWithProfile,
  TeamMemberOnLoad,
  TeamMemberType,
  TeamMemberWithUserDetails,
  TeamOnLoad,
  TeamTableRow,
  TicketListOnLoad,
  TicketListType,
  TicketPageOnLoad,
  TicketStatusType,
  TicketType,
  UserIssuedItem,
  UserTableRow,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";
import moment from "moment";
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

// Get all the user's team
export const getAllTeamOfUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  }
) => {
  const { userId } = params;
  const { data, error } = await supabaseClient
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
  const { teamId, app, memberId } = params;

  const { data, error } = await supabaseClient
    .from("form_table")
    .select(
      `
        *, 
        form_team_member:form_team_member_id!inner(
          *
        ),
        form_team_group: form_team_group_table(
          team_group: team_group_id!inner(
            team_group_member: team_group_member_table!inner(
              team_member_id
            )
          )
        )
      `
    )
    .eq("form_team_member.team_member_team_id", teamId)
    .eq("form_is_disabled", false)
    .eq("form_app", app)
    .eq("form_team_group.team_group.team_group_member.team_member_id", memberId)
    .order("form_date_created", { ascending: false });
  if (error) throw error;

  return data;
};

// Get request list
export const getRequestList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    page: number;
    limit: number;
    requestor?: string[];
    approver?: string[];
    status?: FormStatusType[];
    form?: string[];
    sort?: "ascending" | "descending";
    search?: string;
    isApproversView: boolean;
    teamMemberId?: string;
    project?: string[];
    idFilter?: string[];
  }
) => {
  const {
    teamId,
    page,
    limit,
    requestor,
    approver,
    status,
    form,
    sort = "descending",
    search,
    isApproversView,
    teamMemberId,
    project,
    idFilter,
  } = params;

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
    ?.map((value) => `request_view.request_formsly_id_prefix = '${value}'`)
    .join(" OR ");

  const idFilterCondition = idFilter
    ?.map((value) => `request_view.request_${value}_id IS NULL`)
    .join(" AND ");

  const searchCondition =
    search && validate(search)
      ? `request_view.request_id = '${search}'`
      : `request_view.request_formsly_id ILIKE '%' || '${search}' || '%'`;

  const { data, error } = await supabaseClient.rpc("fetch_request_list", {
    input_data: {
      teamId: teamId,
      page: page,
      limit: limit,
      requestor: requestorCondition ? `AND (${requestorCondition})` : "",
      approver: approverCondition ? `AND (${approverCondition})` : "",
      project: projectCondition ? `AND (${projectCondition})` : "",
      form: formCondition ? `AND (${formCondition})` : "",
      idFilter: idFilterCondition ? `AND (${idFilterCondition})` : "",
      status: statusCondition ? `AND (${statusCondition})` : "",
      search: search ? `AND (${searchCondition})` : "",
      sort: sort === "descending" ? "DESC" : "ASC",
      isApproversView,
      teamMemberId,
    },
  });

  if (error) throw error;
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
  const { userId } = params;
  const { data, error } = await supabaseClient
    .from("user_table")
    .select(
      "*, user_signature_attachment: user_signature_attachment_id(*), user_employee_number: user_employee_number_table(user_employee_number, user_employee_number_is_disabled)"
    )
    .eq("user_id", userId)
    .eq("user_employee_number.user_employee_number_is_disabled", false)
    .single();
  if (error) throw error;

  const formattedData = data as unknown as UserTableRow & {
    user_employee_number: { user_employee_number: string }[];
  };

  return {
    ...formattedData,
    user_employee_number:
      formattedData.user_employee_number.length !== 0
        ? formattedData.user_employee_number[0].user_employee_number
        : null,
  };
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
    .from("user_table")
    .select("user_username")
    .eq("user_username", username)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Get specific request
export const getRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;

  const { data, error } = await supabaseClient
    .from("request_table")
    .select(
      `*, 
      request_team_member: request_team_member_id!inner(
        team_member_team_id, 
        team_member_user: team_member_user_id!inner(
          user_id, 
          user_first_name, 
          user_last_name, 
          user_username, 
          user_avatar
        )
      ), 
      request_signer: request_signer_table!inner(
        request_signer_id, 
        request_signer_status, 
        request_signer_signer: request_signer_signer_id!inner(
          signer_id, 
          signer_is_primary_signer, 
          signer_action, 
          signer_order, 
          signer_form_id,
          signer_team_member: signer_team_member_id!inner(
            team_member_id, 
            team_member_user: team_member_user_id!inner(
              user_first_name, 
              user_last_name
            )
          )
        )
      ), 
      request_comment: comment_table(
        comment_id, 
        comment_date_created, 
        comment_content, 
        comment_is_edited,
        comment_last_updated, 
        comment_type, 
        comment_team_member_id, 
        comment_team_member: comment_team_member_id!inner(
          team_member_user: team_member_user_id!inner(
            user_id, 
            user_first_name, 
            user_last_name, 
            user_username, 
            user_avatar
          )
        )
      ), 
      request_form: request_form_id!inner(
        form_id, 
        form_name, 
        form_description, 
        form_is_formsly_form, 
        form_section: section_table!inner(
          *, 
          section_field: field_table!inner(
            *, 
            field_option: option_table(*), 
            field_response: request_response_table(*)
          )
        )
      ),
      request_project: request_project_id(team_project_name)`
    )
    .eq("request_id", requestId)
    .eq("request_is_disabled", false)
    .eq(
      "request_form.form_section.section_field.field_response.request_response_request_id",
      requestId
    )
    .eq("request_comment.comment_is_disabled", false)
    .order("comment_date_created", {
      foreignTable: "comment_table",
      ascending: false,
    })
    .maybeSingle();
  if (error) throw error;

  const formattedRequest = data as unknown as RequestWithResponseType;
  const sortedSection = formattedRequest.request_form.form_section
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

  return {
    ...formattedRequest,
    request_form: {
      ...formattedRequest.request_form,
      form_section: sortedSection,
    },
  };
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
  const {
    teamId,
    app,
    page,
    limit,
    creator,
    status,
    sort = "descending",
    search,
  } = params;

  const start = (page - 1) * limit;
  let query = supabaseClient
    .from("form_table")
    .select(
      "*, form_team_member:form_team_member_id!inner(*, team_member_user: team_member_user_id(user_id, user_first_name, user_last_name, user_avatar))",
      {
        count: "exact",
      }
    )
    .eq("form_team_member.team_member_team_id", teamId)
    .eq("form_is_disabled", false)
    .eq("form_app", app);

  if (creator) {
    let creatorCondition = "";
    creator.forEach((value) => {
      creatorCondition += `form_team_member_id.eq.${value}, `;
    });
    query = query.or(creatorCondition.slice(0, -2));
  }

  if (status) {
    query = query.eq("form_is_hidden", status === "hidden");
  }

  if (search) {
    query = query.ilike("form_name", `%${search}%`);
  }

  query = query
    .order("form_is_formsly_form", {
      ascending: false,
    })
    .order("form_date_created", {
      ascending: sort === "ascending",
    });

  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data: formList, count, error } = await query;
  if (error) throw error;

  const sortedFormList = sortFormList(formList, FORMSLY_FORM_ORDER);

  return { data: sortedFormList, count };
};

// Get all team members
export const getAllTeamMembers = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    search?: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .from("team_member_table")
    .select(
      "team_member_id, team_member_role, team_member_user: team_member_user_id(user_id, user_first_name, user_last_name)"
    )
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false);
  if (error) throw error;

  return data;
};

// Get team's all approver members
export const getTeamApproverList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .from("team_member_table")
    .select(
      "team_member_id, team_member_role, team_member_user: team_member_user_id(user_id, user_first_name, user_last_name)"
    )
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false)
    .or("team_member_role.eq.APPROVER, team_member_role.eq.OWNER");
  if (error) throw error;

  const formattedData = data as unknown as {
    team_member_id: string;
    team_member_role: string;
    team_member_user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
    };
  }[];

  return formattedData.sort((a, b) =>
    `${a.team_member_user.user_first_name}` >
    `${b.team_member_user.user_first_name}`
      ? 1
      : `${b.team_member_user.user_first_name}` >
        `${a.team_member_user.user_first_name}`
      ? -1
      : 0
  );
};

// Get specific form
export const getForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
  }
) => {
  const { formId } = params;
  const { data, error } = await supabaseClient
    .from("form_table")
    .select(
      `form_id, 
      form_name, 
      form_description, 
      form_date_created, 
      form_is_hidden, 
      form_is_formsly_form, 
      form_is_for_every_member, 
      form_type,
      form_sub_type,
      form_team_member: form_team_member_id(
        team_member_id, 
        team_member_user: team_member_user_id(
          user_id, 
          user_first_name, 
          user_last_name, 
          user_avatar, 
          user_username
        )
      ), 
      form_signer: signer_table(
        signer_id, 
        signer_is_primary_signer, 
        signer_action, 
        signer_order,
        signer_is_disabled, 
        signer_team_project_id,
        signer_team_member: signer_team_member_id(
          team_member_id, 
          team_member_user: team_member_user_id(
            user_id, 
            user_first_name, 
            user_last_name, 
            user_avatar
          )
        )
      ), 
      form_section: section_table(
        *, 
        section_field: 
        field_table(
          *, 
          field_option: option_table(*)
        )
      ),
      form_team_group: form_team_group_table(
        team_group: team_group_id(
          team_group_id,
          team_group_name,
          team_group_is_disabled
        )
      )`
    )
    .eq("form_id", formId)
    // .eq("form_is_disabled", false)
    .eq("form_team_group.team_group.team_group_is_disabled", false)
    .eq("form_signer.signer_is_disabled", false)
    .is("form_signer.signer_team_project_id", null)
    .single();
  if (error) throw error;

  const formattedForm = data as unknown as FormType;
  const sortedSection = formattedForm.form_section
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

  return {
    ...formattedForm,
    form_section: sortedSection,
  };
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
  params: { teamId: string; limit: number; page: number; search?: string }
) => {
  const { teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("item_table")
    .select(
      "*, item_division_table(*), item_description: item_description_table(*)",
      {
        count: "exact",
      }
    )
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_description.item_description_is_disabled", false);

  if (search) {
    query = query.ilike("item_general_name", `%${search}%`);
  }

  query.order("item_general_name", { ascending: true });
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
  })[];

  return {
    data: formattedData.map((data) => {
      return {
        ...data,
        item_division_id_list: data.item_division_table.map(
          (division) => division.item_division_value
        ),
      };
    }),
    count,
  };
};

// Get all items
export const getAllItems = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string }
) => {
  const { teamId } = params;
  const { data, error } = await supabaseClient
    .from("item_table")
    .select("item_general_name")
    .eq("item_team_id", teamId)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .order("item_general_name", { ascending: true });

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
    data,
    count,
  };
};

// get item
export const getItem = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; itemName: string }
) => {
  const { teamId, itemName } = params;

  const { data, error } = await supabaseClient
    .from("item_table")
    .select(
      "*, item_division_table(*), item_description: item_description_table(*, item_description_field: item_description_field_table(*, item_description_field_uom: item_description_field_uom_table(item_description_field_uom)), item_field: item_description_field_id(*))"
    )
    .eq("item_team_id", teamId)
    .eq("item_general_name", itemName)
    .eq("item_is_disabled", false)
    .eq("item_is_available", true)
    .eq("item_description.item_description_is_disabled", false)
    .eq("item_description.item_description_is_available", true)
    .eq(
      "item_description.item_description_field.item_description_field_is_disabled",
      false
    )
    .eq(
      "item_description.item_description_field.item_description_field_is_available",
      true
    )
    .single();
  if (error) throw error;
  const formattedData = data as unknown as ItemWithDescriptionAndField & {
    item_division_table: { item_division_value: string }[];
  };

  return {
    ...formattedData,
    item_division_id_list: formattedData.item_division_table.map(
      (division) => division.item_division_value
    ),
  } as unknown as ItemWithDescriptionAndField;
};

// check if Requisition form can be activated
export const checkRequisitionFormStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamId: string; formId: string }
) => {
  const { teamId, formId } = params;

  const { data, error } = await supabaseClient
    .rpc("check_requisition_form_status", {
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
  const { teamId, search = "" } = params;

  let query = supabaseClient
    .from("team_member_table")
    .select(
      "team_member_id, team_member_role, team_member_user: team_member_user_id!inner(user_id, user_first_name, user_last_name, user_avatar, user_email)"
    )
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false)
    .eq("team_member_user.user_is_disabled", false);

  if (search) {
    query = query.or(
      `user_first_name.ilike.%${search}%, user_last_name.ilike.%${search}%, user_email.ilike.%${search}%`,
      { foreignTable: "team_member_user_id" }
    );
  }

  const { data, error } = await query;
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
  const { invitationId, userEmail } = params;
  const { data, error } = await supabaseClient
    .from("invitation_table")
    .select(
      "*, invitation_from_team_member: invitation_from_team_member_id(*, team_member_team: team_member_team_id(*))"
    )
    .eq("invitation_id", invitationId)
    .eq("invitation_to_email", userEmail)
    .eq("invitation_is_disabled", false)
    .maybeSingle();

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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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
  supabaseClient: SupabaseClient<Database>,
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

// Get request by formId
export const getRequestListByForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    formId?: string;
  }
) => {
  const { formId, teamId } = params;
  let query = supabaseClient
    .from("request_table")
    .select(
      "request_id, request_date_created, request_status, request_team_member: request_team_member_id!inner(team_member_id, team_member_user: team_member_user_id(user_id, user_first_name, user_last_name, user_avatar)), request_form: request_form_id!inner(form_id, form_name, form_description, form_is_formsly_form, form_section: section_table(*, section_field: field_table(*, field_option: option_table(*), field_response: request_response_table!inner(request_response_field_id, request_response_id, request_response, request_response_duplicatable_section_id, request_response_request_id))))",
      { count: "exact" }
    )
    .eq("request_team_member.team_member_team_id", teamId)
    .eq("request_is_disabled", false)
    .eq("request_form.form_is_disabled", false);

  if (formId) {
    const formCondition = `request_form_id.eq.${formId}`;
    query = query.or(formCondition);
  }
  const { data, error, count } = await query;
  if (error) throw error;

  const requestList = data as unknown as RequestByFormType[];

  return { data: requestList, count };
};

export const getDashboardOverViewData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    formId?: string;
  }
) => {
  const { formId, teamId } = params;
  let query = supabaseClient
    .from("request_table")
    .select(
      "request_id, request_date_created, request_status, request_team_member: request_team_member_id!inner(team_member_id, team_member_user: team_member_user_id(user_id, user_first_name, user_last_name, user_avatar)), request_signer: request_signer_table(request_signer_id, request_signer_status, request_signer_signer: request_signer_signer_id(signer_id, signer_is_primary_signer, signer_action, signer_order, signer_team_member: signer_team_member_id(team_member_id, team_member_user: team_member_user_id(user_first_name, user_last_name, user_avatar)))), request_form: request_form_id!inner(form_id, form_name, form_description, form_is_formsly_form)))",
      { count: "exact" }
    )
    .eq("request_team_member.team_member_team_id", teamId)
    .eq("request_is_disabled", false)
    .eq("request_form.form_is_disabled", false);

  if (formId) {
    const formCondition = `request_form_id.eq.${formId}`;
    query = query.or(formCondition);
  }
  const { data, error, count } = await query;
  if (error) throw error;

  const requestList = data as unknown as RequestDashboardOverviewData[];

  return { data: requestList, count };
};

// Get specific formsly form by name and team id
export const getFormslyForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formName: string;
    teamId: string;
    memberId: string;
  }
) => {
  const { formName, teamId, memberId } = params;

  const { data, error } = await supabaseClient
    .from("form_table")
    .select(
      `
        form_id, 
        form_is_for_every_member, 
        form_team_member: form_team_member_id!inner(
          team_member_team_id
        ),
        form_team_group: form_team_group_table(
          team_group: team_group_id!inner(
            team_group_member: team_group_member_table!inner(
              team_member_id
            )
          )
        ) 
      `
    )
    .eq("form_name", formName)
    .eq("form_team_member.team_member_team_id", teamId)
    .eq("form_team_group.team_group.team_group_member.team_member_id", memberId)
    .eq("form_is_formsly_form", true)
    .maybeSingle();
  if (error) throw error;

  const formattedData = data as unknown as {
    form_id: string;
    form_is_for_every_member: string;
    form_team_group: {
      team_group_id: {
        team_group: {
          team_group_member: {
            team_member_id: string;
          };
        };
      };
    }[];
  };

  return {
    form_id: formattedData.form_id,
    form_is_for_every_member: formattedData.form_is_for_every_member,
    form_is_member: Boolean(formattedData.form_team_group.length),
  };
};

// Get specific Requisition form id by name and team id
export const getFormIDForRequsition = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
    memberId: string;
  }
) => {
  const { teamId, memberId } = params;
  const { data, error } = await supabaseClient
    .from("form_table")
    .select(
      `
        form_id, 
        form_name, 
        form_is_for_every_member, 
        form_team_member: form_team_member_id!inner(
          team_member_team_id
        ), 
        form_team_group: form_team_group_table(
          team_group: team_group_id!inner(
            team_group_member: team_group_member_table!inner(
              team_member_id
            )
          )
        ) 
      `
    )
    .or("form_name.eq.Quotation, form_name.eq.Sourced Item")
    .eq("form_team_member.team_member_team_id", teamId)
    .eq("form_team_group.team_group.team_group_member.team_member_id", memberId)
    .eq("form_is_formsly_form", true);

  if (error) throw error;

  const formattedData = data as unknown as {
    form_id: string;
    form_name: string;
    form_is_for_every_member: string;
    form_team_group: {
      team_group_id: {
        team_group: {
          team_group_member: {
            team_member_id: string;
          };
        };
      };
    }[];
  }[];

  return formattedData.map((form) => {
    return {
      form_id: form.form_id,
      form_name: form.form_name,
      form_is_for_every_member: form.form_is_for_every_member,
      form_is_member: Boolean(form.form_team_group.length),
    };
  });
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
    requisitionId: string;
  }
) => {
  const { requisitionId } = params;

  const { count, error } = await supabaseClient
    .from("request_table")
    .select("*", { count: "exact" })
    .eq("request_id", requisitionId)
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

// Get all formsly forward link form id
export const getFormslyForwardLinkFormId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;

  const { data, error } = await supabaseClient
    .from("request_response_table")
    .select(
      "request_response_request: request_response_request_id!inner(request_id, request_formsly_id, request_status, request_form: request_form_id(form_name))"
    )
    .eq("request_response", `"${requestId}"`)
    .eq("request_response_request.request_status", "APPROVED");
  if (error) throw error;
  const formattedData = data as unknown as {
    request_response_request: {
      request_id: string;
      request_formsly_id: string;
      request_form: {
        form_name: string;
      };
    };
  }[];

  const requestList = {
    Requisition: [] as ConnectedRequestItemType[],
    "Sourced Item": [] as ConnectedRequestItemType[],
    Quotation: [] as ConnectedRequestItemType[],
    "Receiving Inspecting Report": [] as ConnectedRequestItemType[],
    "Release Order": [] as ConnectedRequestItemType[],
    "Transfer Receipt": [] as ConnectedRequestItemType[],
    "Release Quantity": [] as ConnectedRequestItemType[],
  };

  formattedData.forEach((request) => {
    const newFormattedData = {
      request_id: request.request_response_request.request_id,
      request_formsly_id: request.request_response_request.request_formsly_id,
    };
    switch (request.request_response_request.request_form.form_name) {
      case "Requisition":
        requestList["Requisition"].push(newFormattedData);
        break;
      case "Sourced Item":
        requestList["Sourced Item"].push(newFormattedData);
        break;
      case "Quotation":
        requestList["Quotation"].push(newFormattedData);
        break;
      case "Receiving Inspecting Report":
        requestList["Receiving Inspecting Report"].push(newFormattedData);
        break;
      case "Release Order":
        requestList["Release Order"].push(newFormattedData);
        break;
      case "Transfer Receipt":
        requestList["Transfer Receipt"].push(newFormattedData);
        break;
      case "Release Quantity":
        requestList["Release Quantity"].push(newFormattedData);
        break;
    }
  });

  return requestList;
};

// Get item response of an requisition request
export const getItemResponseForQuotation = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { requestId } = params;

  const { data: requestResponseData, error: requestResponseError } =
    await supabaseClient
      .from("request_response_table")
      .select(
        "*, request_response_field: request_response_field_id(field_name, field_order)"
      )
      .eq("request_response_request_id", requestId);

  if (requestResponseError) throw requestResponseError;
  const formattedRequestResponseData =
    requestResponseData as unknown as (RequestResponseTableRow & {
      request_response_field: { field_name: string; field_order: number };
    })[];

  const options: Record<
    string,
    {
      name: string;
      description: string;
      quantity: number;
      unit: string;
    }
  > = {};
  const idForNullDuplicationId = uuidv4();
  formattedRequestResponseData.forEach((response) => {
    if (response.request_response_field) {
      const fieldName = response.request_response_field.field_name;
      const duplicatableSectionId =
        response.request_response_duplicatable_section_id ??
        idForNullDuplicationId;

      if (response.request_response_field.field_order > 4) {
        if (!options[duplicatableSectionId]) {
          options[duplicatableSectionId] = {
            name: "",
            description: "",
            quantity: 0,
            unit: "",
          };
        }

        if (fieldName === "General Name") {
          options[duplicatableSectionId].name = JSON.parse(
            response.request_response
          );
        } else if (fieldName === "Base Unit of Measurement") {
          options[duplicatableSectionId].unit = JSON.parse(
            response.request_response
          );
        } else if (fieldName === "Quantity") {
          options[duplicatableSectionId].quantity = Number(
            response.request_response
          );
        } else if (
          fieldName === "GL Account" ||
          fieldName === "CSI Code" ||
          fieldName === "CSI Code Description" ||
          fieldName === "Division Description" ||
          fieldName === "Level 2 Major Group Description" ||
          fieldName === "Level 2 Minor Group Description"
        ) {
        } else {
          options[duplicatableSectionId].description += `${
            options[duplicatableSectionId].description ? ", " : ""
          }${fieldName}: ${JSON.parse(response.request_response)}`;
        }
      }
    }
  });
  return options;
};

// Get item response of a quotation request
export const getItemResponseForRIR = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { requestId } = params;

  const { data: requestResponseData, error: requestResponseError } =
    await supabaseClient
      .from("request_response_table")
      .select(
        "*, request_response_field: request_response_field_id(field_name, field_order)"
      )
      .eq("request_response_request_id", requestId);

  if (requestResponseError) throw requestResponseError;
  const formattedRequestResponseData =
    requestResponseData as unknown as (RequestResponseTableRow & {
      request_response_field: { field_name: string; field_order: number };
    })[];

  const options: Record<
    string,
    {
      item: string;
      quantity: string;
    }
  > = {};
  const idForNullDuplicationId = uuidv4();
  formattedRequestResponseData.forEach((response) => {
    if (response.request_response_field) {
      const fieldName = response.request_response_field.field_name;
      const duplicatableSectionId =
        response.request_response_duplicatable_section_id ??
        idForNullDuplicationId;

      if (response.request_response_field.field_order > 12) {
        if (!options[duplicatableSectionId]) {
          options[duplicatableSectionId] = {
            item: "",
            quantity: "",
          };
        }

        if (fieldName === "Item") {
          options[duplicatableSectionId].item = JSON.parse(
            response.request_response
          );
        } else if (fieldName === "Quantity") {
          const matches = regExp.exec(options[duplicatableSectionId].item);

          if (matches) {
            const unit = matches[1].replace(/\d+/g, "").trim();

            options[
              duplicatableSectionId
            ].quantity = `${response.request_response} ${unit}`;
          }
        }
      }
    }
  });
  return options;
};

// Get item response of a requisition request
export const getItemResponseForRO = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { requestId } = params;

  const { data: requestResponseData, error: requestResponseError } =
    await supabaseClient
      .from("request_response_table")
      .select(
        "*, request_response_field: request_response_field_id(field_name, field_order)"
      )
      .eq("request_response_request_id", requestId);

  if (requestResponseError) throw requestResponseError;
  const formattedRequestResponseData =
    requestResponseData as unknown as (RequestResponseTableRow & {
      request_response_field: { field_name: string; field_order: number };
    })[];

  const options: Record<
    string,
    {
      item: string;
      quantity: number;
      sourceProject: string;
    }
  > = {};
  const idForNullDuplicationId = uuidv4();
  formattedRequestResponseData.forEach((response) => {
    if (response.request_response_field) {
      const fieldName = response.request_response_field.field_name;
      const duplicatableSectionId =
        response.request_response_duplicatable_section_id ??
        idForNullDuplicationId;

      if (response.request_response_field.field_order > 1) {
        if (!options[duplicatableSectionId]) {
          options[duplicatableSectionId] = {
            item: "",
            quantity: 0,
            sourceProject: "",
          };
        }

        if (fieldName === "Item") {
          options[duplicatableSectionId].item = JSON.parse(
            response.request_response
          );
        } else if (fieldName === "Quantity") {
          options[duplicatableSectionId].quantity = JSON.parse(
            response.request_response
          );
        } else if (fieldName === "Source Project") {
          options[duplicatableSectionId].sourceProject = JSON.parse(
            response.request_response
          );
        }
      }
    }
  });

  return options;
};

// Check if the approving or creating quotation or sourced item quantity are less than the requisition quantity
export const checkRequisitionQuantity = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requisitionID: string;
    itemFieldList: RequestResponseTableRow[];
    quantityFieldList: RequestResponseTableRow[];
  }
) => {
  const { data, error } = await supabaseClient
    .rpc("check_requisition_quantity", { input_data: params })
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

// Get SSOT for spreadsheet view
export const checkIfTeamHaveFormslyForms = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;
  const { count, error } = await supabaseClient
    .from("form_table")
    .select(
      "*, form_team_member: form_team_member_id!inner(team_member_team_id)",
      {
        count: "exact",
        head: true,
      }
    )
    .eq("form_team_member.team_member_team_id", teamId)
    .eq("form_is_formsly_form", true);

  if (error) throw error;

  return Boolean(count);
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
  const { formId, teamId, startDate, endDate } = params;
  const getCount = (status: string) =>
    supabaseClient
      .from("request_table")
      .select(
        `request_team_member: request_team_member_id!inner(team_member_team_id)`,
        { count: "exact", head: true }
      )
      .eq("request_form_id", formId)
      .eq("request_team_member.team_member_team_id", teamId)
      .eq("request_status", status)
      .gte("request_date_created", startDate)
      .lte("request_date_created", endDate);

  const data = await Promise.all(
    REQUEST_STATUS_LIST.map(async (status) => {
      const { count: statusCount } = await getCount(status);

      return {
        label: startCase(status.toLowerCase()),
        value: statusCount || 0,
      };
    })
  );

  const totalCount = data.reduce((total, item) => item.value + total, 0);

  return {
    data,
    totalCount,
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

export const getSignerData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
    teamMemberId: string;
    startDate: string;
    endDate: string;
  }
) => {
  const { formId, teamMemberId, startDate, endDate } = params;
  const getSignedRequestCount = (status: string) =>
    supabaseClient
      .from("request_signer_table")
      .select(
        "request: request_signer_request_id!inner(request_form_id, request_date_created), request_signer: request_signer_signer_id!inner(team_member: signer_team_member_id!inner(team_member_id, team_member_team_id)), request_signer_status",
        { count: "exact", head: true }
      )
      .eq("request.request_form_id", formId)
      .eq("request_signer_status", status)
      .eq("request_signer.team_member.team_member_id", teamMemberId)
      .gte("request.request_date_created", startDate)
      .lte("request.request_date_created", endDate);

  const data = await Promise.all(
    REQUEST_STATUS_LIST.map(async (status) => {
      const { count: statusCount } = await getSignedRequestCount(status);

      return {
        label: startCase(status.toLowerCase()),
        value: statusCount || 0,
      };
    })
  );

  return data;
};

// Get all quotation request for the requisition
export const getRequisitionPendingQuotationRequestList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;

  const { data, error } = await supabaseClient
    .from("request_response_table")
    .select(
      `request_response_request: request_response_request_id!inner(
        request_id, 
        request_formsly_id,
        request_status, 
        request_form: request_form_id!inner(
          form_name
        )
      )`
    )
    .eq("request_response", `"${requestId}"`)
    .eq("request_response_request.request_status", "PENDING")
    .eq("request_response_request.request_form.form_name", "Quotation");

  if (error) throw error;
  const formattedData = data as unknown as {
    request_response_request: {
      request_id: string;
      request_formsly_id: string;
    };
  }[];
  return formattedData.map((request) => request.request_response_request);
};

// Get canvass data
export const getCanvassData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;

  const items = await getItemResponseForQuotation(supabaseClient, {
    requestId,
  });
  const itemOptions = Object.keys(items).map(
    (item) =>
      `${items[item].name} (${items[item].quantity} ${items[item].unit}) (${items[item].description})`
  );

  const canvassRequest = await getRequisitionPendingQuotationRequestList(
    supabaseClient,
    { requestId }
  );

  const additionalChargeFields = [
    "Delivery Fee",
    "Bank Charge",
    "Mobilization Charge",
    "Demobilization Charge",
    "Freight Charge",
    "Hauling Charge",
    "Handling Charge",
    "Packing Charge",
  ];

  const summaryData: CanvassLowestPriceType = {};
  let summaryAdditionalDetails: CanvassAdditionalDetailsType = [];
  const quotationRequestList = await Promise.all(
    canvassRequest.map(async ({ request_id, request_formsly_id }) => {
      const { data: quotationResponseList, error: quotationResponseListError } =
        await supabaseClient
          .from("request_response_table")
          .select(
            "*, request_response_field: request_response_field_id!inner(field_name), request_response_request: request_response_request_id!inner(request_id,request_formsly_id)"
          )
          .eq("request_response_request_id", request_id)
          .in("request_response_field.field_name", [
            "Item",
            "Price per Unit",
            "Quantity",
            "Lead Time",
            "Payment Terms",
            ...additionalChargeFields,
          ]);
      if (quotationResponseListError) throw quotationResponseListError;
      summaryData[request_formsly_id] = 0;
      summaryAdditionalDetails.push({
        quotation_id: request_id,
        formsly_id: request_formsly_id,
        lead_time: 0,
        payment_terms: "",
      });
      return quotationResponseList;
    })
  );

  const formattedQuotationRequestList =
    quotationRequestList as unknown as (RequestResponseTableRow & {
      request_response_field: { field_name: string };
      request_response_request: {
        request_id: string;
        request_formsly_id: string;
      };
    })[][];

  const canvassData: CanvassType = {};
  const lowestPricePerItem: CanvassLowestPriceType = {};
  const requestAdditionalCharge: CanvassLowestPriceType = {};
  let lowestAdditionalCharge = 999999999;

  itemOptions.forEach((item) => {
    canvassData[item] = [];
    lowestPricePerItem[item] = 999999999;
  });

  formattedQuotationRequestList.forEach((request) => {
    let currentItem = "";
    let tempAdditionalCharge = 0;

    request.forEach((response) => {
      if (response.request_response_field.field_name === "Item") {
        currentItem = JSON.parse(response.request_response);
        canvassData[currentItem].push({
          quotationId: response.request_response_request.request_formsly_id,
          price: 0,
          quantity: 0,
        });
      } else if (
        response.request_response_field.field_name === "Price per Unit"
      ) {
        const price = Number(response.request_response);
        canvassData[currentItem][canvassData[currentItem].length - 1].price =
          price;
        if (price < lowestPricePerItem[currentItem]) {
          lowestPricePerItem[currentItem] = price;
        }
        summaryData[response.request_response_request.request_formsly_id] +=
          price;
      } else if (
        response.request_response_field.field_name === "Payment Terms"
      ) {
        summaryAdditionalDetails = summaryAdditionalDetails.map((request) => {
          if (request.quotation_id === response.request_response_request_id)
            return {
              ...request,
              payment_terms: JSON.parse(response.request_response) as string,
            };
          else return request;
        });
      } else if (response.request_response_field.field_name === "Lead Time") {
        summaryAdditionalDetails = summaryAdditionalDetails.map((request) => {
          if (request.quotation_id === response.request_response_request_id)
            return { ...request, lead_time: Number(response.request_response) };
          else return request;
        });
      } else if (response.request_response_field.field_name === "Quantity") {
        canvassData[currentItem][canvassData[currentItem].length - 1].quantity =
          Number(response.request_response);
      } else if (
        additionalChargeFields.includes(
          response.request_response_field.field_name
        )
      ) {
        const price = Number(response.request_response);
        summaryData[response.request_response_request.request_formsly_id] +=
          price;
        tempAdditionalCharge += price;
      }
    });

    requestAdditionalCharge[
      request[0].request_response_request.request_formsly_id
    ] = tempAdditionalCharge;
    if (tempAdditionalCharge < lowestAdditionalCharge) {
      lowestAdditionalCharge = tempAdditionalCharge;
    }
  });

  const sortedQuotation: Record<string, number> = Object.entries(summaryData)
    .sort(([, a], [, b]) => a - b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
  const recommendedQuotationId = Object.keys(sortedQuotation)[0];
  const request_id = canvassRequest.find(
    (request) => request.request_formsly_id === recommendedQuotationId
  )?.request_id;
  return {
    canvassData,
    lowestPricePerItem,
    summaryData,
    summaryAdditionalDetails,
    lowestQuotation: {
      id: recommendedQuotationId,
      request_id: request_id,
      value: sortedQuotation[recommendedQuotationId],
    },
    requestAdditionalCharge,
    lowestAdditionalCharge,
  };
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

  const getMonthlyCount = async (startOfMonth: string, endOfMonth: string) => {
    const getCount = (status: string) =>
      supabaseClient
        .from("request_table")
        .select(
          `request_team_member: request_team_member_id!inner(team_member_team_id)`,
          { count: "exact", head: true }
        )
        .eq("request_is_disabled", false)
        .eq("request_form_id", formId)
        .eq("request_team_member.team_member_team_id", teamId)
        .eq("request_status", status)
        .gte("request_date_created", startOfMonth)
        .lte("request_date_created", endOfMonth);

    const { count: pendingCount } = await getCount("PENDING");
    const { count: approvedCount } = await getCount("APPROVED");
    const { count: rejectedCount } = await getCount("REJECTED");

    const statusData = {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
    };

    return {
      month: startOfMonth,
      ...statusData,
    };
  };

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

  const monthlyData = await Promise.all(
    monthRanges.map(async (range) => {
      return getMonthlyCount(range.start_of_month, range.end_of_month);
    })
  );

  const { count: totalCount } = await supabaseClient
    .from("request_table")
    .select(
      `request_team_member: request_team_member_id!inner(team_member_team_id)`,
      { count: "exact", head: true }
    )
    .eq("request_is_disabled", false)
    .eq("request_form_id", formId)
    .eq("request_team_member.team_member_team_id", teamId)
    .gte("request_date_created", startDate)
    .lte("request_date_created", endDate);

  return {
    data: monthlyData,
    totalCount: totalCount,
  };
};

// Get supplier
export const getSupplier = async (
  supabaseClient: SupabaseClient<Database>,
  params: { supplier: string; teamId: string; fieldId: string }
) => {
  const { supplier, teamId, fieldId } = params;
  const { data, error } = await supabaseClient
    .from("supplier_table")
    .select("supplier")
    .eq("supplier_team_id", teamId)
    .ilike("supplier", `%${supplier}%`)
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

// Get team member
export const getTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string }
) => {
  const { teamMemberId } = params;
  const { data, error } = await supabaseClient
    .from("team_member_table")
    .select("*, team_member_user: team_member_user_id(*)")
    .eq("team_member_id", teamMemberId)
    .single();
  if (error) throw error;

  return data;
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
    .from("team_group_table")
    .select("*", { count: "exact" })
    .eq("team_group_team_id", teamId)
    .eq("team_group_is_disabled", false);

  if (search) {
    query = query.ilike("team_group_name", `%${search}%`);
  }

  query = query.order("team_group_date_created", { ascending: false });
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
  const { teamId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("team_project_table")
    .select("*", { count: "exact" })
    .eq("team_project_team_id", teamId)
    .eq("team_project_is_disabled", false);

  if (search) {
    query = query.ilike("team_project_name", `%${search}%`);
  }

  query = query.order("team_project_name", { ascending: true });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  return { data, count };
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
  const { groupId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("team_group_member_table")
    .select(
      `
        team_group_member_id,
        team_member: team_member_id!inner(
          team_member_id,
          team_member_date_created, 
          team_member_user: team_member_user_id!inner(
            user_id, 
            user_first_name, 
            user_last_name,
            user_avatar, 
            user_email
          ),
          team_member_project: team_project_member_table(
            team_project: team_project_id!inner(team_project_name)
          )
        )
      `,
      { count: "exact" }
    )
    .eq("team_group_id", groupId)
    .eq("team_member.team_member_is_disabled", false)
    .eq(
      "team_member.team_member_project.team_project.team_project_is_disabled",
      false
    );

  if (search) {
    query = query.or(
      `user_first_name.ilike.%${search}%, user_last_name.ilike.%${search}%, user_email.ilike.%${search}%`,
      { foreignTable: "team_member.team_member_user" }
    );
  }

  query = query.order("team_member_date_created", {
    ascending: false,
    foreignTable: "team_member",
  });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const formattedData = data as unknown as {
    team_group_member_id: string;
    team_member: {
      team_member_id: string;
      team_member_date_created: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
        user_email: string;
      };
      team_member_project: {
        team_project: {
          team_project_name: string;
        };
      }[];
    };
  }[];

  return {
    data: formattedData.map((data) => {
      return {
        ...data,
        team_member: {
          ...data.team_member,
          team_member_project_list: data.team_member.team_member_project.map(
            (project) => project.team_project.team_project_name
          ),
        },
      };
    }),
    count,
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
  const { projectId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("team_project_member_table")
    .select(
      `
        team_project_member_id,
        team_member: team_member_id!inner(
          team_member_id,
          team_member_date_created, 
          team_member_role,
          team_member_user: team_member_user_id!inner(
            user_id, 
            user_first_name, 
            user_last_name,
            user_avatar, 
            user_email
          ),
          team_member_group: team_group_member_table(
            team_group: team_group_id(team_group_name)
          )
        )
      `,
      { count: "exact" }
    )
    .eq("team_project_id", projectId)
    .eq("team_member.team_member_is_disabled", false);

  if (search) {
    query = query.or(
      `user_first_name.ilike.%${search}%, user_last_name.ilike.%${search}%, user_email.ilike.%${search}%`,
      { foreignTable: "team_member.team_member_user" }
    );
  }

  query = query.order("team_member_date_created", {
    ascending: false,
    foreignTable: "team_member",
  });
  query.limit(limit);
  query.range(start, start + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const formattedData = data as unknown as {
    team_group_member_id: string;
    team_member: {
      team_member_id: string;
      team_member_date_created: string;
      team_member_user: {
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        user_avatar: string;
        user_email: string;
      };
      team_member_group: {
        team_group: {
          team_group_name: string;
        };
      }[];
    };
  }[];

  return {
    data: formattedData.map((data) => {
      return {
        ...data,
        team_member: {
          ...data.team_member,
          team_member_group_list: data.team_member.team_member_group.map(
            (group) => group.team_group.team_group_name
          ),
        },
      };
    }),
    count,
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
  }
) => {
  const { teamId, status } = params;
  const { data, error } = await supabaseClient
    .from("invitation_table")
    .select(
      "invitation_id, invitation_to_email, invitation_date_created, team_member: invitation_from_team_member_id!inner(team_member_team_id)"
    )
    .eq("team_member.team_member_team_id", teamId)
    .eq("invitation_status", status)
    .eq("invitation_is_disabled", false);

  if (error) throw error;

  return { data, error: null };
};

export const getRequestFormslyId = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;
  const { data, error } = await supabaseClient
    .from("request_view")
    .select("request_formsly_id")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  const requestFormslyId = data ? data.request_formsly_id : null;

  return requestFormslyId;
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
    .from("signer_table")
    .select("*")
    .eq("signer_team_project_id", projectId)
    .eq("signer_form_id", formId)
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
  }
) => {
  const { projectId, formId } = params;
  const { data, error } = await supabaseClient
    .from("signer_table")
    .select(
      `signer_id, 
      signer_is_primary_signer, 
      signer_action, 
      signer_order,
      signer_is_disabled, 
      signer_team_project_id,
      signer_team_member: signer_team_member_id(
        team_member_id, 
        team_member_user: team_member_user_id(
          user_id, 
          user_first_name, 
          user_last_name, 
          user_avatar
        )
      )`
    )
    .eq("signer_team_project_id", projectId)
    .eq("signer_form_id", formId)
    .eq("signer_is_disabled", false);

  if (error) throw error;

  return data as FormType["form_signer"];
};

// Fetch request project id
export const getRequestProjectIdAndName = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
  }
) => {
  const { requestId } = params;
  const { data, error } = await supabaseClient
    .from("request_table")
    .select(
      "request_project: request_project_id(team_project_id, team_project_name)"
    )
    .eq("request_id", requestId)
    .single();
  if (error) throw error;

  return data.request_project;
};

// Fetch multiple request signer with team member based on project site
export const getMultipleProjectSignerWithTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    projectName: string[];
    formId: string;
  }
) => {
  const { projectName, formId } = params;
  const { data, error } = await supabaseClient
    .from("signer_table")
    .select(
      `signer_id, 
      signer_is_primary_signer, 
      signer_action, 
      signer_order,
      signer_is_disabled, 
      signer_team_project: signer_team_project_id!inner(
        team_project_name
      ),
      signer_team_member: signer_team_member_id(
        team_member_id, 
        team_member_user: team_member_user_id(
          user_id, 
          user_first_name, 
          user_last_name, 
          user_avatar
        )
      )`
    )
    .in("signer_team_project.team_project_name", projectName)
    .eq("signer_form_id", formId)
    .eq("signer_is_disabled", false);

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

// Fetch request project signer
export const getRequestProjectSigner = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    teamId: string;
  }
) => {
  const { requestId, teamId } = params;
  let requestProjectSigner = [];
  const { data: projectList, error: projectListError } = await supabaseClient
    .from("team_project_table")
    .select("*")
    .eq("team_project_team_id", teamId);
  if (projectListError) throw projectListError;

  const { data: noProjectSigner, error: noProjectSignerError } =
    await supabaseClient
      .from("request_signer_table")
      .select(
        "*, request_signer: request_signer_signer_id!inner(*, signer_team_project_id)"
      )
      .eq("request_signer_request_id", requestId)
      .eq("request_signer.signer_is_disabled", false)
      .is("request_signer.signer_team_project_id", null);

  if (noProjectSignerError) throw noProjectSignerError;

  if (noProjectSigner.length > 0) {
    const signer = noProjectSigner[0];
    const data = projectList.map((project) => ({
      ...signer,
      request_signer: {
        ...signer.request_signer,
        signer_team_project: {
          team_project_name: project.team_project_name,
        },
      },
    }));

    requestProjectSigner = data as unknown as RequestProjectSignerType;
  } else {
    const { data: signerData, error } = await supabaseClient
      .from("request_signer_table")
      .select(
        "*, request_signer: request_signer_signer_id!inner(*, signer_team_project: signer_team_project_id!inner(team_project_name))"
      )
      .eq("request_signer_request_id", requestId)
      .eq("request_signer.signer_is_disabled", false);
    if (error) throw error;

    const signers = signerData as unknown as RequestProjectSignerType;

    const projectsWithSigner = signers.map(
      (signer) => signer.request_signer.signer_team_project.team_project_name
    );
    const projectsWithoutSigner = projectList
      .map((project) => project.team_project_name)
      .filter((project) => projectsWithSigner.includes(project));

    const newSigners = projectsWithoutSigner.map((project) => ({
      ...signers[0],
      request_signer: {
        ...signers[0].request_signer,
        signer_team_project: {
          team_project_name: project,
        },
      },
    }));
    requestProjectSigner = [...signers, ...newSigners];
  }

  return requestProjectSigner;
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
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_level_three_description", csiCode)
    .single();
  if (error) throw error;

  return data as CSICodeTableRow;
};

// Fetch all itemm division option
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
  const { teamId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("team_member_table")
    .select(
      `
        team_member_id,
        team_member_date_created, 
        team_member_user: team_member_user_id!inner(
          user_id, 
          user_first_name, 
          user_last_name,
          user_avatar, 
          user_email
        )
      `,
      { count: "exact" }
    )
    .eq("team_member_role", "APPROVER")
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false);

  if (search) {
    let orQuery = "";
    search.split(" ").map((search) => {
      orQuery += `user_first_name.ilike.%${search}%, user_last_name.ilike.%${search}%, user_email.ilike.%${search}%`;
    });
    query = query.or(orQuery, { foreignTable: "team_member_user" });
  }

  query = query.order("team_member_user(user_first_name)", {
    ascending: true,
    foreignTable: "",
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
  const { teamId, search = "", page, limit } = params;
  const start = (page - 1) * limit;

  let query = supabaseClient
    .from("team_member_table")
    .select(
      `
        team_member_id,
        team_member_date_created, 
        team_member_user: team_member_user_id!inner(
          user_id, 
          user_first_name, 
          user_last_name,
          user_avatar, 
          user_email
        )
      `,
      { count: "exact" }
    )
    .eq("team_member_role", "ADMIN")
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false);

  if (search) {
    let orQuery = "";
    search.split(" ").map((search) => {
      orQuery += `user_first_name.ilike.%${search}%, user_last_name.ilike.%${search}%, user_email.ilike.%${search}%`;
    });
    query = query.or(orQuery, { foreignTable: "team_member_user" });
  }

  query = query.order("team_member_user(user_first_name)", {
    ascending: true,
    foreignTable: "",
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

// Get all team members with "MEMBER" role
export const getTeamMembersWithMemberRole = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamId: string;
  }
) => {
  const { teamId } = params;

  const { data, error } = await supabaseClient
    .from("team_member_table")
    .select(
      `
      team_member_id,
      team_member_date_created, 
      team_member_user: team_member_user_id!inner(
        user_id, 
        user_first_name, 
        user_last_name,
        user_avatar, 
        user_email
      )
    `
    )
    .eq("team_member_team_id", teamId)
    .eq("team_member_is_disabled", false)
    .eq("team_member_role", "MEMBER");
  if (error) throw error;
  return data;
};

export const getMemberUserData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { data } = await supabaseClient
    .from("team_member_table")
    .select(
      `team_member_user: team_member_user_id!inner(
        user_id, 
        user_first_name, 
        user_last_name, 
        user_username, 
        user_avatar
      )`
    )
    .eq("team_member_id", params.teamMemberId)
    .limit(1);

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
  const { teamId, userEmail } = params;

  const { data, error } = await supabaseClient
    .from("invitation_table")
    .select(
      `
      invitation_id,
      team_member: invitation_from_team_member_id!inner(
        team_member_team_id
      )
    `
    )
    .eq("team_member.team_member_team_id", teamId)
    .eq("invitation_is_disabled", false)
    .eq("invitation_to_email", userEmail)
    .eq("invitation_status", "PENDING")
    .maybeSingle();

  if (error) throw error;

  return data ? data.invitation_id : null;
};

export const getUserPendingInvitation = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userEmail: string;
  }
) => {
  const { userEmail } = params;

  const { data, error } = await supabaseClient
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

// Get ticket member user data
export const getTicketMemberUserData = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { data } = await supabaseClient
    .from("team_member_table")
    .select(
      `team_member_user: team_member_user_id!inner(
        user_id, 
        user_first_name, 
        user_last_name, 
        user_username, 
        user_avatar
      )`
    )
    .eq("team_member_id", params.teamMemberId)
    .limit(1);

  if (data) {
    const commentTeamMember = data[0];
    return commentTeamMember as unknown as TicketType["ticket_comment"][0]["ticket_comment_team_member"];
  } else {
    return null;
  }
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
    ?.map((value) => `ticket_table.ticket_category = '${value}'`)
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

// Get ticket list on load
export const getUnresolvedRequestListPerApprover = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamMemberId: string;
  }
) => {
  const { teamMemberId } = params;
  const { data, error } = await supabaseClient
    .from("request_signer_table")
    .select(
      "request_signer_status, request_signer: request_signer_signer_id!inner(signer_team_member_id), request: request_signer_request_id!inner(request_id, request_jira_id, request_status)"
    )
    .eq("request_signer.signer_team_member_id", teamMemberId)
    .in("request_signer_status", ["APPROVED", "PENDING"]);

  if (error) throw error;

  return data as unknown as ApproverUnresolvedRequestListType[];
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

  return data as unknown as EditRequestOnLoadProps;
};

// Get all group of team member
export const getAllGroupOfTeamMember = async (
  supabaseClient: SupabaseClient<Database>,
  params: { teamMemberId: string }
) => {
  const { teamMemberId } = params;

  const { data, error } = await supabaseClient
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
    .from("team_table")
    .select("*", { count: "exact" })
    .ilike("team_name", teamName);

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
  const { requestId } = params;

  const { data, error } = await supabaseClient
    .from("request_table")
    .select(
      `request_team_member: request_team_member_id!inner(team_member_team_id)`
    )
    .eq("request_id", requestId)
    .eq("request_is_disabled", false)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const requestData = data as unknown as {
      request_team_member: {
        team_member_team_id: string;
      };
    };
    return requestData.request_team_member.team_member_team_id;
  } else {
    return null;
  }
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
    .from("csi_code_table")
    .select("*")
    .eq("csi_code_division_id", divisionId)
    .order("csi_code_level_three_description", { ascending: true });
  if (error) throw error;
  return data;
};

// Get lookup list
export const getLookupList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    lookup: string;
    teamId: string;
    limit: number;
    page: number;
    search?: string;
  }
) => {
  const { lookup, teamId, search, limit, page } = params;

  const start = (page - 1) * limit;

  let query = supabaseClient
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
  supabaseClient: SupabaseClient<Database>,
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
  const { data, error } = await supabaseClient
    .from("team_member_table")
    .select(
      `team_member_id,
       team_member_user: team_member_user_id(
          user_id,
          user_first_name,
          user_last_name,
          user_job_title,
          user_avatar,
          user_signature_attachment: user_signature_attachment_id(*)
        )
      `
    )
    .eq("team_member_team_id", params.teamId);

  if (error) throw error;

  return data;
};

// Get memo
export const getMemo = async (
  supabaseClient: SupabaseClient<Database>,
  params: { memo_id: string; current_user_id: string }
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
    .from("memo_format_table")
    .select("*")
    .maybeSingle();

  if (error || !data) throw Error;

  const formatData: MemoFormatType = {
    memo_format_id: data.memo_format_id,
    header: {
      top: Number(data.memo_format_header_margin_top),
      right: Number(data.memo_format_header_margin_right),
      bottom: Number(data.memo_format_header_margin_bottom),
      left: Number(data.memo_format_header_margin_left),
      logoPosition: data.memo_format_header_logo_position,
    },
    body: {
      top: Number(data.memo_format_body_margin_top),
      right: Number(data.memo_format_body_margin_right),
      bottom: Number(data.memo_format_body_margin_bottom),
      left: Number(data.memo_format_body_margin_left),
    },
    footer: {
      top: Number(data.memo_format_footer_margin_top),
      right: Number(data.memo_format_footer_margin_right),
      bottom: Number(data.memo_format_footer_margin_bottom),
      left: Number(data.memo_format_footer_margin_left),
    },
  };

  return formatData;
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
    .from("other_expenses_type_table")
    .select("*")
    .eq("other_expenses_type_category_id", categoryId)
    .eq("other_expenses_type_is_available", true)
    .eq("other_expenses_type_is_disabled", false)
    .order("other_expenses_type", { ascending: true });
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
    .from("user_valid_id_table")
    .select("*, user_valid_id_user_id(*), user_valid_id_approver(*)")
    .eq("user_valid_id_id", params.validId)
    .single();
  if (error) throw error;

  return data;
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
  const { data, error } = await supabaseClient.from("query_table").select("*");
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
  const { formId, projectId } = params;
  const query = supabaseClient
    .from("signer_table")
    .select(
      "*, signer_team_member: team_member_table(*, team_member_user: user_table(*))"
    )
    .eq("signer_form_id", formId);

  if (projectId.length > 0) {
    query.eq("signer_team_project_id", projectId);
  } else {
    query.is("signer_team_project_id", null);
  }
  const { data, error } = await query;
  if (error) throw error;

  return data as SignerWithProfile[];
};
