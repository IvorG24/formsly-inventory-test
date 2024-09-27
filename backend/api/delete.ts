import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

// Delete form
export const deleteForm = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    formId: string;
  }
) => {
  const { formId } = params;
  const { error } = await supabaseClient
    .schema("form_schema")
    .from("form_table")
    .update({ form_is_disabled: true })
    .eq("form_id", formId);
  if (error) throw error;
};

// Delete request
export const deleteRequest = async (
  supabaseClient: SupabaseClient<Database>,
  params: { requestId: string }
) => {
  const { requestId } = params;
  const { error } = await supabaseClient
    .schema("request_schema")
    .from("request_table")
    .update({ request_is_disabled: true })
    .eq("request_id", requestId);
  if (error) throw error;
};

// Delete comment
export const deleteComment = async (
  supabaseClient: SupabaseClient<Database>,
  params: { commentId: string }
) => {
  const { commentId } = params;
  const { error: deleteCommentError } = await supabaseClient
    .schema("request_schema")
    .from("comment_table")
    .update({ comment_is_disabled: true })
    .eq("comment_id", commentId);
  if (deleteCommentError) throw deleteCommentError;

  const { error: deleteAttachmentError } = await supabaseClient
    .from("attachment_table")
    .update({ attachment_is_disabled: true })
    .like("attachment_value", `%${commentId}%`);
  if (deleteAttachmentError) throw deleteAttachmentError;
};

// Delete row
export const deleteRow = async (
  supabaseClient: SupabaseClient,
  params: {
    rowId: string[];
    table: string;
    schema: string;
  }
) => {
  const { rowId, table, schema } = params;

  let condition = "";
  rowId.forEach((id) => {
    condition += `${table}_id.eq.${id}, `;
  });

  const { error } = await supabaseClient
    .schema(schema)
    .from(`${table}_table`)
    .update({ [`${table}_is_disabled`]: true })
    .or(condition.slice(0, -2))
    .select("*");

  if (error) throw error;
};

// Remove member from group
export const removeMemberFromGroup = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamGroupMemberIdList: string[];
  }
) => {
  const { teamGroupMemberIdList } = params;

  const condition = teamGroupMemberIdList
    .map((id) => {
      return `team_group_member_id.eq.${id}`;
    })
    .join(",");

  const { error } = await supabaseClient
    .schema("team_schema")
    .from("team_group_member_table")
    .delete()
    .or(condition);

  if (error) throw error;
};

// Remove member from project
export const removeMemberFromProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    teamProjectMemberIdList: string[];
  }
) => {
  const { teamProjectMemberIdList } = params;

  const condition = teamProjectMemberIdList
    .map((id) => {
      return `team_project_member_id.eq.${id}`;
    })
    .join(",");

  const { error } = await supabaseClient
    .schema("team_schema")
    .from("team_project_member_table")
    .delete()
    .or(condition);

  if (error) throw error;
};

// Remove jira user from project
export const removeJiraUserFromProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    jiraProjectUserId: string;
  }
) => {
  const { jiraProjectUserId } = params;

  const { error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_user_table")
    .delete()
    .eq("jira_project_user_id", jiraProjectUserId);

  if (error) throw error;
};

export const deleteJiraUser = async (
  supabaseClient: SupabaseClient<Database>,
  jiraUserAccountId: string
) => {
  const { error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_user_account_table")
    .delete()
    .eq("jira_user_account_id", jiraUserAccountId);

  if (error) throw error;
};

export const deleteJiraProject = async (
  supabaseClient: SupabaseClient<Database>,
  jira_project_id: string
) => {
  const { error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_project_table")
    .delete()
    .eq("jira_project_id", jira_project_id);

  if (error) throw error;
};

export const deleteJiraOrganization = async (
  supabaseClient: SupabaseClient<Database>,
  jira_organization_id: string
) => {
  const { error } = await supabaseClient
    .schema("jira_schema")
    .from("jira_organization_table")
    .delete()
    .eq("jira_organization_id", jira_organization_id);

  if (error) throw error;
};

export const deleteJobTittle = async (
  supabaseClient: SupabaseClient<Database>,
  jira_job_id: string
) => {
  const { error } = await supabaseClient
    .schema("lookup_schema")
    .from("employee_job_title_table")
    .delete()
    .eq("employee_job_title_id", jira_job_id);

  if (error) throw error;
};

export const deleteInterviewOnlineMeeting = async (
  supabaseClient: SupabaseClient<Database>,
  interviewMeetingId: string
) => {
  const { error } = await supabaseClient
    .schema("hr_schema")
    .from("interview_online_meeting_table")
    .delete()
    .eq("interview_meeting_id", interviewMeetingId);

  if (error) throw error;
};
