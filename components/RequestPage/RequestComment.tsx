import { deleteComment } from "@/backend/api/delete";
import { getCommentAttachment } from "@/backend/api/get";
import { updateComment } from "@/backend/api/update";
import { useUserTeamMember } from "@/stores/useUserStore";
import { getAvatarColor } from "@/utils/styling";
import {
  CommentAttachmentWithPublicUrl,
  RequestCommentType,
} from "@/utils/types";
import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Card,
  Flex,
  Group,
  Menu,
  Spoiler,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconCheck,
  IconDots,
  IconDownload,
  IconEdit,
  IconFolderCancel,
  IconX,
} from "@tabler/icons-react";
import { capitalize } from "lodash";
import moment from "moment";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import RequestCommentForm, { CommentFormProps } from "./RequestCommentForm";

type RequestCommentProps = {
  comment: RequestCommentType;
  setCommentList: Dispatch<SetStateAction<RequestCommentType[]>>;
};

const RequestComment = ({ comment, setCommentList }: RequestCommentProps) => {
  const supabaseClient = useSupabaseClient();

  const teamMember = useUserTeamMember();

  const [commentContent, setCommentContent] = useState(comment.comment_content);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isCommentEdited, setIsCommentEdited] = useState(
    comment.comment_is_edited
  );
  const [commentAttachmentUrlList, setCommentAttachmentUrlList] =
    useState<CommentAttachmentWithPublicUrl>(comment.comment_attachment);
  const commenter = comment.comment_team_member.team_member_user;

  const isUserOwner =
    comment.comment_team_member_id === teamMember?.team_member_id;

  // edit comment
  const editCommentFormMethods = useForm<CommentFormProps>({
    defaultValues: { comment: comment.comment_content },
  });
  const handleEditComment = async (data: CommentFormProps) => {
    try {
      setIsSubmittingForm(true);
      await updateComment(supabaseClient, {
        commentId: comment.comment_id,
        newComment: data.comment,
      });
      setCommentContent(data.comment);
      setIsCommentEdited(true);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsSubmittingForm(false);
      setIsEditingComment(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await deleteComment(supabaseClient, {
        commentId: comment.comment_id,
      });
      setCommentList((prev) =>
        prev.filter(
          (commentItem) => commentItem.comment_id !== comment.comment_id
        )
      );
      notifications.show({
        message: "Comment deleted.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const openPromptDeleteModal = () =>
    modals.openConfirmModal({
      title: "Are you sure you want to delete this comment?",
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "red" },
      onConfirm: async () => await handleDeleteComment(),
    });

  const actionCommentList = [
    "ACTION_APPROVED",
    "ACTION_REJECTED",
    "ACTION_CANCELED",
  ];

  const actionCommentColor = (type: string) => {
    switch (type) {
      case "ACTION_APPROVED":
        return "green";
      case "ACTION_REJECTED":
        return "red";
      case "ACTION_CANCELED":
        return "gray";
    }
  };

  const actionCommentTitle = (type: string) => {
    switch (type) {
      case "ACTION_APPROVED":
        return "Approved!";
      case "ACTION_REJECTED":
        return "Rejected!";
      case "ACTION_CANCELED":
        return "Canceled!";
    }
  };

  const actionCommentIcon = (type: string) => {
    switch (type) {
      case "ACTION_APPROVED":
        return <IconCheck size={16} />;
      case "ACTION_REJECTED":
        return <IconX size={16} />;
      case "ACTION_CANCELED":
        return <IconFolderCancel size={16} />;
    }
  };

  useEffect(() => {
    setCommentContent(comment.comment_content);
    setIsCommentEdited(comment.comment_is_edited);
  }, [comment.comment_content, comment.comment_is_edited]);

  useEffect(() => {
    const fetchCommentAttachmentList = async () => {
      const commentAttachmentUrlList = await getCommentAttachment(
        supabaseClient,
        { commentId: comment.comment_id }
      );
      setCommentAttachmentUrlList(commentAttachmentUrlList);
    };
    fetchCommentAttachmentList();
  }, [comment.comment_id, supabaseClient]);

  return (
    <Box pos="relative" mt="sm">
      {isEditingComment ? (
        <FormProvider {...editCommentFormMethods}>
          <RequestCommentForm
            onSubmit={handleEditComment}
            textAreaProps={{ disabled: isSubmittingForm }}
            addCancelButton={{
              onClickHandler: () => setIsEditingComment(false),
            }}
            submitButtonProps={{
              loading: isSubmittingForm,
              children: "Save",
            }}
            isEditing={isEditingComment}
          />
        </FormProvider>
      ) : (
        <Stack spacing={8}>
          {actionCommentList.includes(comment.comment_type) ? (
            <Flex align="center" gap="sm" mt="lg">
              <Avatar
                size={40}
                src={commenter.user_avatar}
                color={getAvatarColor(
                  Number(`${commenter.user_id.charCodeAt(0)}`)
                )}
                radius="xl"
              >
                {capitalize(commenter.user_first_name[0])}
                {capitalize(commenter.user_last_name[0])}
              </Avatar>

              <Alert
                w="100%"
                color={actionCommentColor(comment.comment_type)}
                title={actionCommentTitle(comment.comment_type)}
              >
                <Flex align="center" gap="md">
                  <ThemeIcon
                    radius="xl"
                    color={actionCommentColor(comment.comment_type)}
                  >
                    {actionCommentIcon(comment.comment_type)}
                  </ThemeIcon>
                  <Stack m={0} p={0} spacing={0}>
                    <Text>
                      {commentContent} on{" "}
                      {new Date(comment.comment_date_created).toDateString()}
                    </Text>
                    <Text color="dimmed" size={12}>
                      {moment(comment.comment_date_created).fromNow()}
                    </Text>
                  </Stack>
                </Flex>
              </Alert>
            </Flex>
          ) : (
            <>
              <Card p={0} pb="sm">
                <Flex mt="lg">
                  <Avatar
                    size={40}
                    src={commenter.user_avatar}
                    color={getAvatarColor(
                      Number(`${commenter.user_id.charCodeAt(0)}`)
                    )}
                    radius="xl"
                  >
                    {capitalize(commenter.user_first_name[0])}
                    {capitalize(commenter.user_last_name[0])}
                  </Avatar>
                  <Stack spacing={0} ml="md">
                    <Text size={14}>
                      {`${commenter.user_first_name} ${commenter.user_last_name}`}
                    </Text>
                    <Text color="dimmed" size={12}>
                      {commenter.user_username}
                    </Text>
                  </Stack>
                  <Text color="dimmed" size={12} ml="xs">
                    ({moment(comment.comment_date_created).fromNow()})
                  </Text>
                  {isUserOwner && (
                    <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon ml="auto">
                          <IconDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          icon={<IconEdit size={14} />}
                          onClick={() => setIsEditingComment(true)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          icon={<IconX size={14} />}
                          onClick={openPromptDeleteModal}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Flex>
                <Spoiler
                  mt="md"
                  maxHeight={120}
                  showLabel="Show more"
                  hideLabel="Hide"
                >
                  <Text size={14}>{commentContent}</Text>
                  <Text color="dimmed" size={12}>
                    {comment.comment_last_updated || isCommentEdited
                      ? "(edited)"
                      : ""}
                  </Text>
                </Spoiler>

                {/* comment attachment */}
                {commentAttachmentUrlList &&
                  commentAttachmentUrlList.length > 0 && (
                    <Stack mt="md" spacing="xs">
                      {commentAttachmentUrlList.map((attachment) => (
                        <Link
                          key={attachment.attachment_id}
                          href={attachment.attachment_public_url}
                          target="__blank"
                          style={{ textDecoration: "none" }}
                        >
                          <Card p="xs" withBorder>
                            <Group position="apart">
                              <Flex sx={{ flex: 1 }} align="center" gap="sm">
                                <Avatar
                                  size="sm"
                                  color={
                                    attachment.attachment_name.includes(".pdf")
                                      ? "cyan"
                                      : "red"
                                  }
                                >
                                  {attachment.attachment_name.includes(".pdf")
                                    ? "PDF"
                                    : "IMG"}
                                </Avatar>
                                <Text size="xs">
                                  {attachment.attachment_name}
                                </Text>
                              </Flex>
                              <ActionIcon size="sm" color="green">
                                <IconDownload />
                              </ActionIcon>
                            </Group>
                          </Card>
                        </Link>
                      ))}
                    </Stack>
                  )}
              </Card>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default RequestComment;
