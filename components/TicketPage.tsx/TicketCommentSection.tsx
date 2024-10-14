import {
  createAttachment,
  createNotification,
  createTicketComment,
} from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  getFileType,
  getFileTypeColor,
  shortenFileName,
} from "@/utils/styling";
import { CommentAttachmentWithPublicUrl, TicketType } from "@/utils/types";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  FileButton,
  Flex,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconX } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import TicketComment from "./TicketComment";

export type TicketCommentType = {
  ticket_comment_id: string;
  ticket_comment_content: string;
  ticket_comment_is_edited: boolean;
  ticket_comment_is_disabled: boolean;
  ticket_comment_date_created: string;
  ticket_comment_type?: string;
  ticket_comment_team_member: {
    team_member_id: string;
    user: {
      user_id: string;
      user_first_name: string;
      user_last_name: string;
      user_avatar: string;
    };
  };
};

type Props = {
  ticket: TicketType;
  commentList: TicketType["ticket_comment"];
  setRequestCommentList: Dispatch<SetStateAction<TicketType["ticket_comment"]>>;
};

const TicketCommentSection = ({
  ticket,
  commentList,
  setRequestCommentList,
}: Props) => {
  const userProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const attachmentMaxFileSize = 5242880;
  const currentUser = useUserProfile();
  const [commentAttachment, setCommentAttachment] = useState<File[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isAttachmentOverSize, setIsAttachmentOverSize] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<{ comment: string }>();

  const handleAddComment = async (data: { comment: string }) => {
    try {
      if (!userProfile || !teamMember) return;

      setIsSubmittingForm(true);
      const newCommentId = uuidv4();
      const commentAttachmentList: CommentAttachmentWithPublicUrl = [];
      // upload attachments
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
            userId: userProfile.user_id,
          });
          commentAttachmentList.push({ ...data, attachment_public_url: url });
        }
        setCommentAttachment([]);
      }
      const { data: commentData, error } = await createTicketComment(
        supabaseClient,
        {
          ticket_comment_id: newCommentId,
          ticket_comment_content: data.comment,
          ticket_comment_type: "ACTION_COMMENT",
          ticket_comment_team_member_id: teamMember?.team_member_id,
          ticket_comment_ticket_id: ticket.ticket_id,
        }
      );
      if (error) throw error;

      if (!error) {
        if (
          ticket.ticket_requester_team_member_id !== teamMember.team_member_id
        ) {
          // create notification
          await createNotification(supabaseClient, {
            notification_app: "REQUEST",
            notification_type: "COMMENT",
            notification_content: `${`${userProfile.user_first_name} ${userProfile.user_last_name}`} commented on your request`,
            notification_redirect_url: `/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/tickets/${ticket.ticket_id}`,
            notification_user_id:
              ticket.ticket_requester.team_member_user.user_id,
            notification_team_id: teamMember.team_member_team_id,
          });
        }
        notifications.show({
          message: "Comment created.",
          color: "green",
        });

        setRequestCommentList((prev) => [
          {
            ...commentData,
            ticket_comment_attachment: commentAttachmentList,
            ticket_comment_team_member: {
              team_member_user: {
                user_id: `${currentUser?.user_id}`,
                user_first_name: currentUser ? currentUser.user_first_name : "",
                user_last_name: currentUser ? currentUser.user_last_name : "",
                user_username: currentUser ? currentUser.user_username : "",
                user_avatar: currentUser ? currentUser.user_avatar : "",
              },
            },
          },
          ...prev,
        ]);
        // reset comment form
        reset();
        return;
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleAddAttachment = (attachmentList: File[]) => {
    if (setCommentAttachment) {
      const updatedAttachmentList = [
        ...attachmentList,
        ...(commentAttachment as File[]),
      ];
      setCommentAttachment(updatedAttachmentList);
    }
  };

  const handleRemoveAttachment = (attachmentName: string) => {
    if (setCommentAttachment) {
      const prevCommentAttachment = commentAttachment || [];
      const updatedAttachmentList = prevCommentAttachment.filter(
        (attachment) => attachment.name !== attachmentName
      );

      setCommentAttachment(updatedAttachmentList);
    }
  };

  const convertBytesToReadableValue = (bytes: number) => {
    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return mb.toFixed(2) + " MB";
    } else {
      const kb = bytes / 1024;
      return kb.toFixed(2) + " KB";
    }
  };

  const renderCommentFormAttachments = () =>
    commentAttachment &&
    commentAttachment.length > 0 && (
      <Stack spacing="xs">
        <Text size="sm" mt="sm">
          Selected attachments:
        </Text>

        {commentAttachment.map((attachment, index) => {
          const isOverSize = attachment.size > attachmentMaxFileSize;
          return (
            <Card key={index} withBorder bg={isOverSize ? "red.3" : "white"}>
              <Flex align="center" gap="sm">
                <Group sx={{ flex: 1 }}>
                  <Avatar size="sm" color={getFileTypeColor(attachment.name)}>
                    {getFileType(attachment.name)}
                  </Avatar>
                  <Text>{shortenFileName(attachment.name, 60)}</Text>
                  <Text size="xs" c="dimmed">
                    {convertBytesToReadableValue(attachment.size)}
                  </Text>
                </Group>
                <ActionIcon
                  color="red"
                  onClick={() => handleRemoveAttachment(attachment.name)}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Flex>
            </Card>
          );
        })}
      </Stack>
    );

  useEffect(() => {
    const currentCommentAttachment = commentAttachment || [];

    const isOverSize = currentCommentAttachment.some(
      (file) => file.size > attachmentMaxFileSize
    );
    if (isOverSize) {
      setError("root", {
        type: "custom",
        message:
          "One of your attachments exceeds the size limit. Please review and ensure that each attachment is under 5 MB.",
      });
      setIsAttachmentOverSize(true);
    } else {
      clearErrors();
      setIsAttachmentOverSize(false);
    }
  }, [commentAttachment, clearErrors, setError]);

  return (
    <Stack>
      <Title order={4} color="dimmed">
        Comments
      </Title>
      {currentUser && (
        <Box mt="xl">
          <form onSubmit={handleSubmit(handleAddComment)}>
            <Textarea
              placeholder="Enter your comment here"
              disabled={isSubmittingForm}
              error={errors.comment?.message}
              {...register("comment", {
                required: "Comment must not be empty.",
              })}
            />
            {renderCommentFormAttachments()}
            <Group mt="sm" position="right">
              <FileButton onChange={handleAddAttachment} multiple>
                {(props) => (
                  <Button
                    variant="default"
                    {...props}
                    disabled={isSubmittingForm}
                  >
                    Add attachment
                  </Button>
                )}
              </FileButton>
              <Button type="submit" disabled={isAttachmentOverSize}>
                Comment
              </Button>
            </Group>
          </form>
        </Box>
      )}

      {commentList.length > 0 && (
        <Stack spacing={36}>
          {commentList.map((comment) => (
            <TicketComment key={comment.ticket_comment_id} comment={comment} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default TicketCommentSection;
