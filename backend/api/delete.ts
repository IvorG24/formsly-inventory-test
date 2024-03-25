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
  supabaseClient: SupabaseClient<Database>,
  params: {
    rowId: string[];
    table: string;
  }
) => {
  const { rowId, table } = params;

  let condition = "";
  rowId.forEach((id) => {
    condition += `${table}_id.eq.${id}, `;
  });

  const { error } = await supabaseClient
    .from(`${table}_table`)
    .update({ [`${table}_is_disabled`]: true })
    .or(condition.slice(0, -2));

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
    .from("team_group_member_table")
    .delete()
    .or(condition);

  if (error) throw error;
};

// Remove jira user from project
export const removeJiraUserFromProject = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    jiraTeamProjectAssignedUserId: string;
  }
) => {
  const { jiraTeamProjectAssignedUserId } = params;

  const { error } = await supabaseClient
    .from("jira_team_project_assigned_user_table")
    .delete()
    .eq("jira_team_project_assigned_user_id", jiraTeamProjectAssignedUserId);

  if (error) throw error;
};
