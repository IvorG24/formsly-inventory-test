import { deleteComment } from "@/backend/api/delete";
import { updateComment } from "@/backend/api/update";
import { useUserTeamMember } from "@/stores/useUserStore";
import { formatDate, formatTime } from "@/utils/constant";
import {
  getAvatarColor,
  getFileType,
  getFileTypeColor,
  shortenFileName,
} from "@/utils/styling";
import { RequestCommentType } from "@/utils/types";
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
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
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
    "ACTION_REVERSED",
  ];

  const actionCommentColor = (type: string) => {
    switch (type) {
      case "ACTION_APPROVED":
        return "green";
      case "ACTION_REJECTED":
        return "red";
      case "ACTION_CANCELED":
        return "gray";
      case "ACTION_REVERSED":
        return "orange";
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
      case "ACTION_REVERSED":
        return "Reversed!";
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
      case "ACTION_REVERSED":
        return <IconRefresh size={16} />;
    }
  };

  useEffect(() => {
    setCommentContent(comment.comment_content);
    setIsCommentEdited(comment.comment_is_edited);
  }, [comment.comment_content, comment.comment_is_edited]);

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
                {(
                  commenter.user_first_name[0] + commenter.user_last_name[0]
                ).toUpperCase()}
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
                    <Text>{`${commentContent}`}</Text>
                    <Text color="dimmed" size={12}>
                      {`${moment(
                        comment.comment_date_created
                      ).fromNow()} ${formatDate(
                        new Date(comment.comment_date_created)
                      )} ${formatTime(new Date(comment.comment_date_created))}`}
                    </Text>
                  </Stack>
                </Flex>
              </Alert>
            </Flex>
          ) : (
            <>
              <Card p={0} pb="sm" sx={{ cursor: "pointer" }}>
                <Flex mt="lg">
                  <Avatar
                    size={40}
                    src={commenter.user_avatar}
                    color={getAvatarColor(
                      Number(`${commenter.user_id.charCodeAt(0)}`)
                    )}
                    radius="xl"
                  >
                    {(
                      commenter.user_first_name[0] + commenter.user_last_name[0]
                    ).toUpperCase()}
                  </Avatar>
                  <Stack spacing={0} ml="md">
                    <Text size={14}>
                      {`${commenter.user_first_name} ${commenter.user_last_name}`}
                    </Text>
                  </Stack>
                  <Text color="dimmed" size={12} ml="xs">
                    ({moment(comment.comment_date_created).fromNow()})
                  </Text>
                  {isUserOwner && (
                    <Menu
                      shadow="md"
                      width={200}
                      position="bottom-end"
                      withinPortal
                    >
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
                {comment.comment_attachment &&
                  comment.comment_attachment.length > 0 && (
                    <Stack mt="md" spacing="xs">
                      {comment.comment_attachment.map((attachment) => (
                        <Card p="xs" key={attachment.attachment_id} withBorder>
                          <Group position="apart">
                            <Flex
                              sx={{ flex: 1 }}
                              align="center"
                              gap="sm"
                              onClick={() =>
                                window.open(
                                  attachment.attachment_public_url,
                                  "_blank"
                                )
                              }
                            >
                              <Avatar
                                size="sm"
                                color={getFileTypeColor(
                                  attachment.attachment_name
                                )}
                              >
                                {getFileType(attachment.attachment_name)}
                              </Avatar>
                              <Text c="dark" size="xs">
                                {shortenFileName(
                                  attachment.attachment_name,
                                  60
                                )}
                              </Text>
                            </Flex>
                            <Link
                              href={`${
                                attachment.attachment_public_url
                              }?download=${encodeURIComponent(
                                attachment.attachment_name
                              )}`}
                            >
                              <ActionIcon
                                size="sm"
                                color="green"
                                onClick={() =>
                                  notifications.show({
                                    title: "File downloaded.",
                                    message:
                                      "Please check your Downloads folder.",
                                    color: "green",
                                  })
                                }
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                            </Link>
                          </Group>
                        </Card>
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
