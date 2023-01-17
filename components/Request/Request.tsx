import ActiveTeamContext from "@/contexts/ActiveTeamContext";
import CurrentUserProfileContext from "@/contexts/CurrentUserProfileContext";
import FileUrlListContext from "@/contexts/FileUrlListContext";
import RequestContext from "@/contexts/RequestContext";
import RequestListContext from "@/contexts/RequestListContext";
import useFetchRequest from "@/hooks/useFetchRequest";
import useFetchRequestCommentList from "@/hooks/useFetchRequestCommentList";
import useFetchRequestWithAttachmentUrlList from "@/hooks/useFetchRequestWithAttachmentUrlList";
import { deleteFile, getFileUrl, uploadFile } from "@/utils/file";
import {
  createRequestComment,
  deletePendingRequest,
  deleteRequestComment,
  GetRequestCommentList,
  updateRequestComment,
  updateRequestStatus,
} from "@/utils/queries-new";
import {
  renderTooltip,
  setBadgeColor,
  setTimeDifference,
} from "@/utils/request";
import { Marks } from "@/utils/types";
import { RequestStatus, TeamMemberRole } from "@/utils/types-new";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FileInput,
  Flex,
  Group,
  LoadingOverlay,
  MultiSelect,
  NumberInput,
  Paper,
  Popover,
  Select,
  Slider,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePicker, DateRangePicker, TimeInput } from "@mantine/dates";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import axios from "axios";
import { startCase } from "lodash";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { Close, Dots, FileIcon, Maximize, Upload } from "../Icon";
import IconWrapper from "../IconWrapper/IconWrapper";
import AttachmentBox from "../RequestsPage/AttachmentBox";
import AttachmentPill from "../RequestsPage/AttachmentPill";
import styles from "./Request.module.scss";

type Props = {
  view: "split" | "full";
  selectedRequestId: number;
  setSelectedRequestId?: (requestId: number | null) => void;
};

const MARKS: Marks[] = [
  {
    value: 1,
    label: "0%",
  },
  {
    value: 2,
    label: "25%",
  },
  {
    value: 3,
    label: "50%",
  },
  {
    value: 4,
    label: "75%",
  },
  {
    value: 5,
    label: "100%",
  },
];

const Request = ({ view, selectedRequestId, setSelectedRequestId }: Props) => {
  const router = useRouter();
  const requestListContext = useContext(RequestListContext);
  const requestContext = useContext(RequestContext);
  const currentUser = useContext(CurrentUserProfileContext);
  const { teamMemberList } = useContext(ActiveTeamContext);
  const fileUrlListContext = useContext(FileUrlListContext);
  const { setRequestList } = requestListContext;
  const requestWithApproverList =
    view === "full"
      ? requestContext.requestWithApproverList
      : requestListContext.requestWithApproverList;
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const [comment, setComment] = useState("");
  const [editComment, setEditComment] = useState<
    GetRequestCommentList[0] | null
  >(null);
  const [newComment, setNewComment] = useState("");
  const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
  const [editCommentAttachment, setEditCommentAttachment] =
    useState<File | null>(null);
  const [isEditCommentAttachmentChanged, setIsEditCommentAttachmentChanged] =
    useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const { requestWithAttachmentUrlList: attachmentUrlList } =
    useFetchRequestWithAttachmentUrlList(selectedRequestId);
  const { request, setRequest } = useFetchRequest(selectedRequestId);
  const {
    requestCommentList: commentList,
    setRequestCommentList: setCommentList,
  } = useFetchRequestCommentList(selectedRequestId);

  useEffect(() => {
    setIsCommentLoading(true);
    const downloadAttachment = async () => {
      try {
        setEditCommentAttachment(null);
        setIsEditCommentAttachmentChanged(false);
        if (editComment?.comment_attachment_url) {
          axios
            .get(editComment?.comment_attachment_url, {
              responseType: "blob",
            })
            .then((response) => {
              setEditCommentAttachment({
                ...response.data,
                name: editComment.comment_attachment_filepath,
              });
            });
        }
      } catch {
        showNotification({
          title: "Error!",
          message: "Failed to fetch comment attachment",
          color: "red",
        });
      }
    };
    downloadAttachment();
    setIsCommentLoading(false);
  }, [editComment]);

  const title = request?.[0]?.request_title;
  const description = request?.[0]?.request_description;
  const requestedBy = request?.[0]?.username;
  const requestedById = request?.[0]?.user_id;
  const dateCreated = request?.[0]?.request_date_created;
  const onBehalfOf = request?.[0]?.request_on_behalf_of;
  const order = request && request[0].order_field_id_list;
  const attachments =
    request &&
    request[0]?.request_attachment_filepath_list &&
    request[0].request_attachment_filepath_list.map((filepath, i) => {
      return {
        filepath,
        url: attachmentUrlList ? attachmentUrlList[i] : null,
      };
    });
  const userIdRoleDictionary = teamMemberList.reduce(
    (acc, member) => ({
      ...acc,
      [`${member.user_id}`]: member.member_role_id,
    }),
    {}
  ) as { [key: string]: TeamMemberRole };
  const approverList = requestWithApproverList[selectedRequestId.toString()];
  const approverIdWithStatus = approverList.find((approver) => {
    const isApprover =
      userIdRoleDictionary[approver.approver_id] === "owner" ||
      userIdRoleDictionary[approver.approver_id] === "admin";
    return isApprover;
  });
  const purchaserIdWithStatus = approverList.find((approver) => {
    const isPurchaser =
      userIdRoleDictionary[approver.approver_id] === "purchaser";
    return isPurchaser;
  });
  const approver = teamMemberList.find(
    (member) => member.user_id === approverIdWithStatus?.approver_id
  );
  const purchaser = teamMemberList.find(
    (member) => member.user_id === purchaserIdWithStatus?.approver_id
  );

  request &&
    request.sort((a, b) => {
      if (!order) return 0;
      return (
        order.indexOf(a.field_id as number) -
        order.indexOf(b.field_id as number)
      );
    });

  const currentUserIsOwner = request?.[0]?.user_id === user?.id;
  const currentUserIsApprover = approver?.user_id === user?.id;
  const currentUserIsPurchaser = purchaser?.user_id === user?.id;
  const status = request?.[0]?.form_fact_request_status_id;

  const handleAddComment = async () => {
    if (!comment && !commentAttachment) return;
    if (!request) return;
    setIsCommentLoading(true);
    try {
      let attachmentPath = "";
      if (commentAttachment) {
        const file = await uploadFile(
          supabaseClient,
          commentAttachment?.name,
          commentAttachment,
          "comment_attachments"
        );
        attachmentPath = file.path;
      }
      const createdComment = await createRequestComment(
        supabaseClient,
        comment,
        user?.id as string,
        request[0].request_id as number,
        attachmentPath
      );

      setComment("");
      setCommentAttachment(null);

      let commentAttachmentUrl = "";
      if (attachmentPath) {
        commentAttachmentUrl = await getFileUrl(
          supabaseClient,
          attachmentPath,
          "comment_attachments"
        );
      }
      setCommentList((prev) => {
        const newCommentList = [...(prev as GetRequestCommentList)];
        newCommentList.push({
          ...(createdComment as GetRequestCommentList[0]),
          username: currentUser?.username || "",
          comment_attachment_filepath: attachmentPath,
          comment_attachment_url: commentAttachmentUrl,
          user_id: currentUser?.user_id || "",
        });
        return newCommentList;
      });

      showNotification({
        title: "Success!",
        message: "Comment created",
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: "Failed to create comment",
        color: "red",
      });
    }
    setIsCommentLoading(false);
  };

  const handleDeleteComment = async (comment: GetRequestCommentList[0]) => {
    setIsCommentLoading(true);
    try {
      const commentId = Number(comment.comment_id);
      if (comment.comment_attachment_filepath) {
        await deleteFile(
          supabaseClient,
          comment.comment_attachment_filepath,
          "comment_attachments"
        );
      }
      await deleteRequestComment(supabaseClient, commentId);

      setCommentList((prev) =>
        (prev as GetRequestCommentList).filter(
          (comment) => comment.comment_id !== commentId
        )
      );
      showNotification({
        title: "Success!",
        message: "Comment deleted",
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: "Failed to delete comment",
        color: "red",
      });
    }
    setIsCommentLoading(false);
  };

  const handleEditComment = async () => {
    try {
      if (!newComment && !editCommentAttachment) return;
      if (!editComment) return;
      if (
        editComment?.comment_content === newComment &&
        !isEditCommentAttachmentChanged
      ) {
        setEditComment(null);
        setNewComment("");
        return;
      }

      setIsCommentLoading(true);

      if (editComment?.comment_attachment_filepath) {
        await deleteFile(
          supabaseClient,
          `${editComment.comment_attachment_filepath}`,
          "comment_attachments"
        );
      }

      let commentAttachmentPath = "";
      if (editCommentAttachment) {
        const file = await uploadFile(
          supabaseClient,
          editCommentAttachment?.name,
          editCommentAttachment,
          "comment_attachments"
        );
        commentAttachmentPath = file.path;
      }

      const updatedComment = await updateRequestComment(
        supabaseClient,
        newComment,
        editComment?.comment_id as number,
        commentAttachmentPath
      );

      let commentAttachmentUrl = "";
      if (commentAttachmentPath) {
        commentAttachmentUrl = await getFileUrl(
          supabaseClient,
          commentAttachmentPath,
          "comment_attachments"
        );
      }

      const newCommentList = (commentList as GetRequestCommentList).map(
        (comment) =>
          comment.comment_id === updatedComment?.comment_id
            ? {
                ...updatedComment,
                username: currentUser ? currentUser.username : "",
                comment_attachment_filepath: commentAttachmentPath,
                comment_attachment_url: commentAttachmentUrl,
                user_id: currentUser ? currentUser?.user_id : "",
              }
            : comment
      );

      setCommentList(() => newCommentList as GetRequestCommentList);

      setEditComment(null);
      setNewComment("");

      showNotification({
        title: "Success!",
        message: "Comment edited",
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: "Failed to edit comment",
        color: "red",
      });
    }
    setIsCommentLoading(false);
  };

  const handleUpdateStatus = async (newStatus: RequestStatus) => {
    try {
      await updateRequestStatus(
        supabaseClient,
        selectedRequestId,
        newStatus,
        user?.id as string
      );

      setRequest(
        request?.map((request) => ({
          ...request,
          form_fact_request_status_id: newStatus,
          request_status_id: newStatus,
        }))
      );
      // if (setRequestWithApproverListProps)
      //   setRequestWithApproverListProps((prev) => {
      //     return prev[selectedRequestId.toString()].map((approver) => {
      //       if (approver.approver_id === user?.id) {
      //         return { ...approver, status: "approved" };
      //       } else {
      //         return approver;
      //       }
      //     });
      //   });
      if (view !== "full") {
        if (setRequestList)
          setRequestList((prev) => {
            return prev.map((request) => {
              if (request.request_id === selectedRequestId) {
                return {
                  ...request,
                  form_fact_request_status_id: newStatus,
                  request_status_id: newStatus,
                };
              } else {
                return request;
              }
            });
          });
      }

      showNotification({
        title: "Success!",
        message: `You ${newStatus} ${request && request[0].request_title}`,
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: `Failed to update status of ${
          request && request[0].request_title
        }`,
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!request) throw Error("No request found");

      await deletePendingRequest(
        supabaseClient,
        request[0].request_id as number
      );

      showNotification({
        title: "Success!",
        message: `You deleted ${request && request[0].request_title}`,
        color: "green",
      });
      if (view === "full") {
        router.push(`/t/${router.query.tid}/requests`);
      } else {
        if (setRequestList) {
          setRequestList((prev) => {
            return prev.filter(
              (request) => request.request_id !== selectedRequestId
            );
          });
          setSelectedRequestId && setSelectedRequestId(null);
        } else {
          router.replace(router.asPath);
        }
      }
    } catch {
      showNotification({
        title: "Error!",
        message: `Failed to delete ${request && request[0].request_title}`,
        color: "red",
      });
    }
  };

  const confirmationModal = (
    action: string,
    requestTitle: string,
    confirmFunction: () => Promise<void>
  ) =>
    openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          Are you sure you want to {action} the {requestTitle}?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: () => confirmFunction(),
    });

  // isLoading && <LoadingOverlay visible={isLoading} overlayBlur={2} />;
  return (
    <Container
      p={view === "full" ? "xl" : 0}
      m={0}
      className={styles.container}
      fluid
    >
      {view === "split" ? (
        <Container m={0} p={0} className={styles.closeIcon}>
          <Group spacing={0}>
            <ActionIcon
              onClick={() =>
                router.push(
                  `/t/${router.query.tid}/requests/${selectedRequestId}`
                )
              }
            >
              <Maximize />
            </ActionIcon>
            <ActionIcon
              onClick={() => {
                if (setSelectedRequestId) {
                  setSelectedRequestId(null);
                }
              }}
            >
              <Close />
            </ActionIcon>
          </Group>
        </Container>
      ) : null}
      <Group position="apart" grow>
        <Stack align="flex-start">
          <Title order={5}>Request Title</Title>
          <Text>{title}</Text>
        </Stack>
        <Stack align="flex-start">
          <Title order={5}>Requested By</Title>
          <Group>
            <Avatar
              radius={100}
              src={fileUrlListContext?.avatarUrlList[requestedById as string]}
            />
            <Text>{requestedBy}</Text>
          </Group>
        </Stack>
      </Group>
      <Group mt="xl" position="apart" grow>
        <Stack align="flex-start">
          <Title order={5}>Date Created</Title>
          <Text>{dateCreated?.slice(0, 10)}</Text>
        </Stack>
        <Stack align="flex-start">
          <Title order={5}>Status</Title>
          <Badge color={setBadgeColor(`${status}`)}>
            {startCase(`${status}`)}
          </Badge>
        </Stack>
      </Group>
      <Group mt="xl" position="apart" grow>
        <Stack mt="xl" align="flex-start">
          <Title order={5}>Request Description</Title>
          <Text>{description}</Text>
        </Stack>
        <Stack align="flex-start">
          <Title order={5}>On behalf of</Title>
          <Text>{onBehalfOf || "---"}</Text>
        </Stack>
      </Group>

      <Divider mt="xl" />
      <Group mt="xl" position="apart" grow>
        <Stack>
          <Title order={5}>Approver</Title>
          <Group align="apart" grow>
            <Group>
              <Badge
                color={setBadgeColor(
                  approverIdWithStatus?.approver_status || "pending"
                )}
              />
              <Text>{approver?.username}</Text>
            </Group>
          </Group>
        </Stack>
        {purchaser ? (
          <Stack>
            <Title order={5}>Purchaser</Title>
            <Group align="apart" grow>
              <Group>
                <Badge color={status === "purchased" ? "green" : "blue"} />
                <Text>{purchaser.username}</Text>
              </Group>
            </Group>
          </Stack>
        ) : null}
      </Group>
      <Divider mt="xl" />
      <Stack mt="xl">
        <Title order={5}>Attachment</Title>
        {!attachments && <Text>---</Text>}
        {attachments &&
          attachments.map((attachment, idx) => {
            // const mockFileSize = "234 KB";
            const filePath = attachment.filepath;
            const fileUrl = attachment.url as string;
            const fileType = attachment.filepath.split(".").pop() as string;
            const mockFileSize = "";
            const mockFile = "file";

            return (
              <Group key={idx}>
                {view === "split" ? (
                  <AttachmentPill
                    filename={filePath}
                    fileType={fileType}
                    fileUrl={fileUrl}
                  />
                ) : (
                  <AttachmentBox
                    file={mockFile}
                    fileSize={mockFileSize}
                    filename={filePath}
                    fileType={fileType}
                    fileUrl={fileUrl}
                  />
                )}
              </Group>
            );
          })}
      </Stack>

      {currentUserIsApprover && status === "pending" ? (
        <>
          <Divider mt="xl" />
          <Flex mt="xl" wrap="wrap" gap="xs" align="center" justify="flex-end">
            <Button
              color="green"
              onClick={() =>
                confirmationModal(
                  "approve",
                  `${request && request[0].request_title}`,
                  () => handleUpdateStatus("approved")
                )
              }
              fullWidth={view === "split"}
              w={view === "full" ? 200 : ""}
              size={view === "full" ? "md" : "sm"}
              data-cy="request-approve"
            >
              Approve
            </Button>
            <Button
              color="red"
              onClick={() =>
                confirmationModal(
                  "reject",
                  `${request && request[0].request_title}`,
                  () => handleUpdateStatus("rejected")
                )
              }
              fullWidth={view === "split"}
              w={view === "full" ? 200 : ""}
              size={view === "full" ? "md" : "sm"}
              data-cy="request-reject"
            >
              Reject
            </Button>
          </Flex>
        </>
      ) : null}

      {currentUserIsOwner && status === "pending" ? (
        <>
          <Divider mt="xl" />{" "}
          <Flex mt="xl" wrap="wrap" gap="xs" align="center" justify="flex-end">
            <Button
              color="dark"
              onClick={() =>
                confirmationModal(
                  "delete",
                  `${request && request[0].request_title}`,
                  handleDelete
                )
              }
              fullWidth={view === "split"}
              w={view === "full" ? 200 : ""}
              size={view === "full" ? "md" : "sm"}
              data-cy="request-delete"
            >
              Delete
            </Button>
          </Flex>
        </>
      ) : null}

      {currentUserIsPurchaser && status === "approved" ? (
        <>
          <Divider mt="xl" />{" "}
          <Flex mt="xl" wrap="wrap" gap="xs" align="center" justify="flex-end">
            <Button
              onClick={() =>
                confirmationModal(
                  "mark as purchased",
                  `${request && request[0].request_title}`,
                  () => handleUpdateStatus("purchased")
                )
              }
              fullWidth={view === "split"}
              w={view === "full" ? 200 : ""}
              size={view === "full" ? "md" : "sm"}
            >
              Mark as Purchased
            </Button>
          </Flex>
        </>
      ) : null}

      <Divider mt="xl" />
      <Title mt="xl" order={5}>
        Request Fields
      </Title>
      {request?.map((field) => {
        const fieldType = field.request_field_type;
        const fieldLabel = field.field_name;
        const fieldResponse = `${field.response_value}`;
        const fieldOptions = field.field_options;

        if (fieldType === "section") {
          return (
            <Divider
              key={field.field_id}
              label={fieldLabel}
              labelPosition="center"
              mt="xl"
            />
          );
        } else if (fieldType === "text" || fieldType === "email") {
          return (
            <Box key={field.field_id} py="sm">
              {renderTooltip(
                <TextInput
                  label={fieldLabel}
                  withAsterisk={Boolean(field.field_is_required)}
                  value={`${field.response_value}`}
                  readOnly
                />,
                `${field.field_tooltip}`
              )}
            </Box>
          );
        } else if (fieldType === "number") {
          return (
            <Box key={field.field_id} py="sm">
              {renderTooltip(
                <NumberInput
                  label={fieldLabel}
                  withAsterisk={Boolean(field.field_is_required)}
                  value={Number(fieldResponse)}
                  readOnly
                />,
                `${field.field_tooltip}`
              )}
            </Box>
          );
        } else if (fieldType === "date") {
          return (
            <Box key={field.field_id} py="sm">
              {renderTooltip(
                <DatePicker
                  label={fieldLabel}
                  withAsterisk={Boolean(field.field_is_required)}
                  placeholder={"Choose date"}
                  value={new Date(fieldResponse)}
                  readOnly
                />,
                `${field.field_tooltip}`
              )}
            </Box>
          );
        } else if (fieldType === "daterange") {
          return (
            <Box key={field.field_id} py="sm">
              {renderTooltip(
                <DateRangePicker
                  label={fieldLabel}
                  withAsterisk={Boolean(field.field_is_required)}
                  placeholder={"Choose a date range"}
                  value={[
                    new Date(fieldResponse.split(",")[0]),
                    new Date(fieldResponse.split(",")[1]),
                  ]}
                  readOnly
                />,
                `${field.field_tooltip}`
              )}
            </Box>
          );
        } else if (fieldType === "time") {
          return (
            <Box key={field.field_id} py="sm">
              {renderTooltip(
                <TimeInput
                  label={fieldLabel}
                  withAsterisk={Boolean(field.field_is_required)}
                  placeholder={"Choose time"}
                  format="12"
                  value={new Date(fieldResponse)}
                />,
                `${field.field_tooltip}`
              )}
            </Box>
          );
        } else if (fieldType === "slider") {
          return (
            <Box my="md" key={field.field_id} py="sm">
              {renderTooltip(
                <Text component="label" color="dark">
                  {fieldLabel}
                </Text>,
                `${field.field_tooltip}`
              )}
              <Slider
                label={fieldLabel}
                placeholder={"Slide to choose value"}
                marks={MARKS}
                min={1}
                max={5}
                labelAlwaysOn={false}
                value={Number(fieldResponse)}
              />
            </Box>
          );
        } else if (fieldType === "multiple" && fieldOptions !== null) {
          return renderTooltip(
            <MultiSelect
              key={field.field_id}
              data={fieldOptions.map((option) => {
                return { value: `${option}`, label: `${option}` };
              })}
              label={fieldLabel}
              withAsterisk={Boolean(field.field_is_required)}
              placeholder={"Choose multiple"}
              value={fieldResponse.split(",")}
              py="sm"
            />,
            `${field.field_tooltip}`
          );
        } else if (fieldType === "select" && fieldOptions !== null) {
          return renderTooltip(
            <Select
              key={field.field_id}
              data={fieldOptions.map((option) => {
                return { value: `${option}`, label: `${option}` };
              })}
              searchable
              clearable
              label={fieldLabel}
              withAsterisk={Boolean(field.field_is_required)}
              placeholder={"Choose one"}
              value={fieldResponse}
              py="sm"
            />,
            `${field.field_tooltip}`
          );
        }
      })}

      {/* fields and comments na now */}

      <Divider mt="xl" />
      <Stack mt="xl">
        <Title order={5}>Comments</Title>
        <Paper withBorder p="xs">
          <Textarea
            placeholder="Type your comment here"
            variant="unstyled"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-cy="request-input-comment"
          />
          <Group position="right" mt="xs">
            <FileInput
              placeholder="Add Attachment"
              withAsterisk
              value={commentAttachment}
              onChange={(value) => setCommentAttachment(value)}
              icon={
                <IconWrapper size={14}>
                  <Upload />
                </IconWrapper>
              }
            />
            <Button
              w={100}
              onClick={handleAddComment}
              data-cy="request-submit-comment"
            >
              Send
            </Button>
          </Group>
        </Paper>
        {commentList &&
          commentList.map((comment) => (
            <Paper shadow="sm" key={comment.comment_id} p="xl" withBorder>
              <LoadingOverlay visible={isCommentLoading} />
              <Flex gap="xs" wrap="wrap" align="center">
                <Avatar
                  radius={100}
                  src={
                    fileUrlListContext?.avatarUrlList[
                      comment.user_request_comment_user_id as string
                    ]
                  }
                  size="sm"
                />
                <Text fw={500}>{comment.username}</Text>
                {comment.comment_is_edited ? (
                  <Text c="dimmed">(edited)</Text>
                ) : null}
                <Text c="dimmed">
                  {setTimeDifference(
                    new Date(`${comment.comment_date_created}`)
                  )}
                </Text>
                {comment.user_id === user?.id ? (
                  <Popover position="bottom" shadow="md">
                    <Popover.Target>
                      <Button ml="auto" variant="subtle">
                        <Dots />
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown p={0}>
                      <Flex>
                        <Button
                          radius={0}
                          variant="subtle"
                          onClick={() => {
                            setNewComment(`${comment.comment_content}`);
                            setEditComment(comment);
                          }}
                        >
                          Edit
                        </Button>
                        <Divider orientation="vertical" />
                        <Button
                          radius={0}
                          variant="subtle"
                          onClick={() => handleDeleteComment(comment)}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Popover.Dropdown>
                  </Popover>
                ) : null}
              </Flex>
              {comment.comment_id === editComment?.comment_id ? (
                <Paper withBorder p="xs" mt="sm">
                  <Textarea
                    placeholder="Type your new comment here"
                    variant="unstyled"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Group position="right" mt="xs" spacing={5}>
                    <FileInput
                      placeholder="Add Attachment"
                      withAsterisk
                      value={editCommentAttachment}
                      onChange={(value) => {
                        setIsEditCommentAttachmentChanged(true);
                        setEditCommentAttachment(value);
                      }}
                      icon={
                        <IconWrapper size={14}>
                          <Upload />
                        </IconWrapper>
                      }
                    />

                    <Button
                      w={100}
                      onClick={() => {
                        setEditComment(null);
                        setNewComment("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button w={100} onClick={handleEditComment}>
                      Submit
                    </Button>
                  </Group>
                </Paper>
              ) : null}
              {comment.comment_id !== editComment?.comment_id ? (
                <Text mt="xs">{comment.comment_content}</Text>
              ) : null}
              {comment.comment_attachment_filepath &&
              comment.comment_id !== editComment?.comment_id ? (
                <a
                  href={comment.comment_attachment_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    mt="xs"
                    variant="outline"
                    leftIcon={
                      <IconWrapper size={14}>
                        <FileIcon />
                      </IconWrapper>
                    }
                  >
                    {comment.comment_attachment_filepath}
                  </Button>
                </a>
              ) : null}
            </Paper>
          ))}
      </Stack>
    </Container>
  );
};

export default Request;
