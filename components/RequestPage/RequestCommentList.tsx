import { getCommentAttachment } from "@/backend/api/get";
import {
  createAttachment,
  createComment,
  createNotification,
} from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { formatDate, formatTime } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CommentAttachmentWithPublicUrl,
  RequestCommentType,
} from "@/utils/types";
import { Divider, Group, Paper, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import RequestComment from "./RequestComment";
import RequestCommentAttachmentList from "./RequestCommentAttachmentList";
import RequestCommentForm, { CommentFormProps } from "./RequestCommentForm";

type Props = {
  requestData: {
    requestId: string;
    requestOwnerId: string;
    teamId: string;
    requestJiraId?: string | null;
  };
  requestCommentList: RequestCommentType[];
  setRequestCommentList: Dispatch<SetStateAction<RequestCommentType[]>>;
};

const RequestCommentList = ({
  requestData,
  requestCommentList,
  setRequestCommentList,
}: Props) => {
  const userProfile = useUserProfile();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const user = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [commentList, setCommentList] = useState(requestCommentList);
  const [commentAttachment, setCommentAttachment] = useState<File[]>([]);

  useEffect(() => {
    const fetchCommentAttachmentList = async () => {
      const commentListWithAttachmentUrl = await Promise.all(
        requestCommentList.map(async (comment) => {
          const commentAttachmentUrlList = await getCommentAttachment(
            supabaseClient,
            { commentId: comment.comment_id }
          );

          return {
            ...comment,
            comment_attachment: commentAttachmentUrlList,
          };
        })
      );
      setCommentList(commentListWithAttachmentUrl);
    };
    fetchCommentAttachmentList();
  }, [requestCommentList, supabaseClient]);

  // create comment
  const addCommentFormMethods = useForm<CommentFormProps>();

  const handleAddComment = async (data: CommentFormProps) => {
    if (!userProfile || !teamMember || !user) return;
    const commenterFullName = `${userProfile.user_first_name} ${userProfile.user_last_name}`;

    try {
      setIsLoading(true);
      const newCommentId = uuidv4();
      // upload attachments
      const commentAttachmentList: CommentAttachmentWithPublicUrl = [];
      if (commentAttachment.length > 0) {
        for (const attachment of commentAttachment) {
          const { data, url } = await createAttachment(supabaseClient, {
            file: attachment,
            attachmentData: {
              attachment_bucket: "COMMENT_ATTACHMENTS",
              attachment_name: attachment.name,
              attachment_value: "",
            },
            fileType: newCommentId,
            userId: user.user_id,
          });
          commentAttachmentList.push({ ...data, attachment_public_url: url });
        }
        setCommentAttachment([]);
      }
      const { data: newComment, error } = await createComment(supabaseClient, {
        comment_request_id: requestData.requestId,
        comment_team_member_id: teamMember.team_member_id,
        comment_type: "REQUEST_COMMENT",
        comment_content: data.comment,
        comment_id: newCommentId,
      });

      if (error) throw error;

      if (requestData.requestJiraId) {
        const newCommentWithAttachment = {
          ...newComment,
          comment_attachment: commentAttachmentList,
          comment_team_member: {
            team_member_user: {
              user_id: teamMember.team_member_user_id,
              user_first_name: userProfile.user_first_name,
              user_last_name: userProfile.user_last_name,
              user_username: userProfile.user_username,
              user_avatar: userProfile.user_avatar,
            },
          },
        };

        await handleAddCommentToJiraTicket(
          requestData.requestJiraId,
          newCommentWithAttachment as RequestCommentType
        );
      }

      if (!error) {
        if (requestData.requestOwnerId !== user?.user_id) {
          // create notification
          await createNotification(supabaseClient, {
            notification_app: "REQUEST",
            notification_type: "COMMENT",
            notification_content: `${commenterFullName} commented on your request`,
            notification_redirect_url: `/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/requests/${router.query.requestId}`,
            notification_user_id: requestData.requestOwnerId,
            notification_team_id: requestData.teamId,
          });
        }
        notifications.show({
          message: "Comment created.",
          color: "green",
        });
        // reset comment form
        setRequestCommentList((prev) => [
          {
            ...newComment,
            comment_attachment: commentAttachmentList,
            comment_team_member: {
              team_member_user: {
                user_id: teamMember.team_member_user_id,
                user_first_name: userProfile.user_first_name,
                user_last_name: userProfile.user_last_name,
                user_username: userProfile.user_username,
                user_avatar: userProfile.user_avatar,
              },
            },
          } as RequestCommentType,
          ...prev,
        ]);
        addCommentFormMethods.reset();
        return;
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCommentToJiraTicket = async (
    jiraTicketKey: string,
    comment: RequestCommentType
  ) => {
    try {
      const commenter = comment.comment_team_member.team_member_user;
      const attachmentContent = comment.comment_attachment.map((attachment) => {
        const attachmentComment = {
          type: "text",
          text: attachment.attachment_name + " \n",
          marks: [
            {
              type: "link",
              attrs: {
                href: attachment.attachment_public_url,
                title: attachment.attachment_name,
              },
            },
          ],
        };
        return attachmentComment;
      });

      const formattedDate = formatTime(new Date(comment.comment_date_created));
      const jiraComment = {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment.comment_content,
              },
            ],
          },
        ],
      };

      if (attachmentContent.length > 0) {
        jiraComment.content.push({
          type: "paragraph",
          content: [...attachmentContent],
        });
      }

      const bodyData = {
        body: {
          version: 1,
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `${commenter.user_first_name} ${
                    commenter.user_last_name
                  } ${formattedDate} ${formatDate(
                    new Date(comment.comment_date_created)
                  )}`,
                  marks: [{ type: "strong" }],
                },
              ],
            },
            jiraComment,
          ],
        },
      };

      await fetch(`/api/jira/add-comment?jiraTicketKey=${jiraTicketKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      <Paper p="xl" shadow="xs" mt="xl">
        <Group position="apart">
          <Title order={4} color="dimmed">
            Comments
          </Title>
          <RequestCommentAttachmentList commentList={commentList} />
        </Group>

        {user && (
          <>
            <Space h="xl" />
            <FormProvider {...addCommentFormMethods}>
              <RequestCommentForm
                onSubmit={handleAddComment}
                textAreaProps={{
                  placeholder: "Enter your comment here",
                  disabled: isLoading,
                }}
                submitButtonProps={{
                  loading: isLoading,
                  children: "Comment",
                }}
                isSubmittingForm={isLoading}
                commentAttachment={commentAttachment}
                setCommentAttachment={setCommentAttachment}
              />
            </FormProvider>
            <Divider my="xl" />
          </>
        )}

        {commentList.map((comment) => (
          <RequestComment
            key={comment.comment_id}
            comment={comment}
            setCommentList={setCommentList}
          />
        ))}
      </Paper>
    </Stack>
  );
};
export default RequestCommentList;
