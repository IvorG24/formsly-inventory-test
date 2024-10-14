import { getMemoFormat } from "@/backend/api/get";
import { agreeToMemo, createNotification } from "@/backend/api/post";
import { approveOrRejectMemo } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { formatDate } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isEmpty } from "@/utils/functions";
import { formatTeamNameToUrlKey, getInitials } from "@/utils/string";
import { getAvatarColor, getStatusToColor } from "@/utils/styling";
import { MemoType } from "@/utils/types";
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  CopyButton,
  Divider,
  Flex,
  Group,
  Image,
  LoadingOverlay,
  Modal,
  Paper,
  Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconCircleDashed, IconCircleX, IconShare } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { MemoFormatFormValues } from "../MemoFormatEditor/MemoFormatEditor";
import ExportMemoToPdf from "./ExportMemoToPdf";

type Props = {
  memo: MemoType;
};

const renderMemoDetails = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <Group>
      <Text weight={600} miw={120}>
        {label}
      </Text>
      <Text>:</Text>
      <Text>{value !== "" ? value : "<empty>"}</Text>
    </Group>
  );
};

const renderMemoLineItems = (lineItem: MemoType["memo_line_item_list"][0]) => {
  const attachment = lineItem.memo_line_item_attachment;
  const caption = attachment?.memo_line_item_attachment_caption;

  return (
    <>
      <Markdown>{lineItem.memo_line_item_content}</Markdown>
      {attachment?.memo_line_item_attachment_public_url && (
        <>
          <Text weight={600}>Figure {lineItem.memo_line_item_order + 1}</Text>
          <Image
            src={attachment.memo_line_item_attachment_public_url}
            alt={caption ?? "No alt provided"}
            width="100%"
            height={600}
            fit="contain"
          />
          {caption && (
            <Text weight={600}>{`Caption ${
              lineItem.memo_line_item_order + 1
            }: ${caption}`}</Text>
          )}
        </>
      )}
    </>
  );
};

const renderSignerItem = (signerItem: MemoType["memo_signer_list"][0]) => {
  const signerUserData = signerItem.memo_signer_team_member.user;
  return (
    <Stack key={signerItem.memo_signer_id} spacing={0}>
      <Image
        width={120}
        height={80}
        src={signerItem.memo_signer_signature_public_url}
        alt="User signature"
        fit="contain"
        withPlaceholder
        placeholder={
          <Box>
            <Text>No signature</Text>
          </Box>
        }
      />
      <Text weight={600}>
        {signerUserData.user_first_name + " " + signerUserData.user_last_name}
      </Text>
      <Text>{signerUserData.user_job_title}</Text>
    </Stack>
  );
};

const renderMemoReadReceiptSection = (
  readerList: MemoType["memo_read_receipt_list"],
  handleViewReaderList: () => void
) => {
  return (
    <Paper mt="md" p="md" radius="md">
      <Group mb="sm" position="apart">
        <Box>
          <Title order={4}>Reader Receipt</Title>
          <Text size="xs">
            This memo has been read by the following members.
          </Text>
        </Box>
        <Button onClick={handleViewReaderList} size="xs" color="orange">
          List View
        </Button>
      </Group>
      <Tooltip.Group>
        <Avatar.Group sx={{ flexWrap: "wrap" }} spacing="sm">
          {readerList.map((reader) => (
            <Tooltip
              key={reader.memo_read_receipt_id}
              label={`${reader.user_first_name} ${reader.user_last_name}`}
            >
              <Avatar
                src={reader.user_avatar}
                radius="xl"
                color={getAvatarColor(
                  Number(`${reader.user_id.charCodeAt(0)}`)
                )}
                sx={{
                  cursor: "pointer",
                }}
                onClick={() =>
                  window.open(
                    `/member/${reader.memo_read_receipt_by_team_member_id}`
                  )
                }
              >
                {getInitials(
                  `${reader.user_first_name} ${reader.user_last_name}`
                )}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      </Tooltip.Group>
    </Paper>
  );
};

const renderAgreementReceiptSection = (
  agreementList: MemoType["memo_agreement_list"],
  handleViewAgreementList: () => void
) => {
  return (
    <Paper mt="md" p="md" radius="md">
      <Group mb="sm" position="apart">
        <Box>
          <Title order={4}>Agreement Receipt</Title>
          <Text size="xs">
            This memo has been agreed by the following members.
          </Text>
        </Box>
        <Button onClick={handleViewAgreementList} size="xs" color="orange">
          List View
        </Button>
      </Group>
      <Tooltip.Group>
        <Avatar.Group sx={{ flexWrap: "wrap" }} spacing="sm">
          {agreementList.map((member) => (
            <Tooltip
              key={member.memo_agreement_id}
              label={`${member.user_first_name} ${member.user_last_name}`}
            >
              <Avatar
                src={member.user_avatar}
                radius="xl"
                color={getAvatarColor(
                  Number(`${member.user_id.charCodeAt(0)}`)
                )}
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  window.open(
                    `/member/${member.memo_agreement_by_team_member_id}`
                  )
                }
              >
                {getInitials(
                  `${member.user_first_name} ${member.user_last_name}`
                )}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      </Tooltip.Group>
    </Paper>
  );
};

const MemoPage = ({ memo }: Props) => {
  const userTeamMemberData = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();

  const { memo_author_user } = memo;
  const isUserAuthor =
    userTeamMemberData?.team_member_user_id === memo_author_user.user_id;
  const sortMemoLineItems = memo.memo_line_item_list.sort(
    (a, b) => a.memo_line_item_order - b.memo_line_item_order
  );
  const memoAuthorFullname = `${memo_author_user.user_first_name} ${memo_author_user.user_last_name}`;
  const pendingSignerList = memo.memo_signer_list.filter(
    (signer) => signer.memo_signer_status === "PENDING"
  );
  const signedSignerList = memo.memo_signer_list.filter((signer) =>
    ["APPROVED", "REJECTED"].includes(signer.memo_signer_status)
  );
  const [currentMemoStatus, setCurrentMemoStatus] = useState(memo.memo_status);
  const [userSignerData, setUserSignerData] = useState<
    MemoType["memo_signer_list"][0] | null
  >(null);
  const [userSignerStatus, setUserSignerStatus] = useState(
    userSignerData?.memo_signer_status
  );
  const [currentPendingSignerList, setCurrentPendingSignerList] =
    useState(pendingSignerList);
  const [currentSignedSignerList, setCurrentSignedSignerList] =
    useState(signedSignerList);
  const [currentAgreementList, setCurrentAgreementList] = useState(
    memo.memo_agreement_list
  );
  const [isLoading, setIsLoading] = useState(false);
  const [openReaderListModal, setOpenReaderListModal] = useState(false);
  const [openAgreementListModal, setOpenAgreementListModal] = useState(false);
  const [hasUserAgreedToMemo, setHasUserAgreedToMemo] = useState(false);
  const [memoFormat, setMemoFormat] = useState<
    MemoFormatFormValues["formatSection"] | null
  >(null);
  const [currentUrl, setCurrentUrl] = useState("");

  const handleApproveOrRejectMemo = async (
    action: string,
    signerId: string,
    isPrimarySigner: boolean
  ) => {
    try {
      if (!userSignerData) return;
      const signer = userSignerData.memo_signer_team_member.user;

      setIsLoading(true);
      const newAgreementData = await approveOrRejectMemo(supabaseClient, {
        memoSignerId: signerId,
        memoId: memo.memo_id,
        action,
        isPrimarySigner,
        memoSignerTeamMemberId:
          userSignerData.memo_signer_team_member.team_member_id,
      });

      await createNotification(supabaseClient, {
        notification_app: "REQUEST",
        notification_type: `MEMO-${action}`,
        notification_content: `${signer?.user_first_name} ${
          signer?.user_last_name
        } ${action.toLowerCase()} your request`,
        notification_redirect_url: `/${formatTeamNameToUrlKey(
          activeTeam.team_name ?? ""
        )}/memo/${memo.memo_id}`,
        notification_user_id: `${memo.memo_author_user.user_id}`,
        notification_team_id: activeTeam.team_id,
      });

      setUserSignerStatus(action);

      if (isPrimarySigner) {
        setCurrentMemoStatus(action);
      }
      const updatedSignerData = {
        ...userSignerData,
        memo_signer_status: action,
      };
      setUserSignerData(updatedSignerData as MemoType["memo_signer_list"][0]);

      const updatedCurrentSignerList = currentPendingSignerList.filter(
        (signer) => signer.memo_signer_id !== signerId
      );
      setCurrentPendingSignerList(updatedCurrentSignerList);

      const updatedSignedSignerList = [
        ...currentSignedSignerList,
        updatedSignerData as MemoType["memo_signer_list"][0],
      ];
      setCurrentSignedSignerList(updatedSignedSignerList);

      if (!isEmpty(newAgreementData)) {
        const { user_data } = newAgreementData.memo_agreement_by_team_member;
        const employeeNumber = user_data.user_employee_number[0]
          ? user_data.user_employee_number[0].user_employee_number
          : "N/A";
        const newUserAgreementData = {
          memo_agreement_by_team_member_id:
            newAgreementData.memo_agreement_by_team_member_id,
          memo_agreement_date_created:
            newAgreementData.memo_agreement_date_created,
          memo_agreement_id: newAgreementData.memo_agreement_id,
          memo_agreement_memo_id: newAgreementData.memo_agreement_memo_id,
          ...user_data,
          user_employee_number: employeeNumber,
        };
        setCurrentAgreementList((prev) => [...prev, newUserAgreementData]);
        setHasUserAgreedToMemo(true);
      }
    } catch (e) {
      notifications.show({
        message: "Failed to sign the memo",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgreeToMemo = async () => {
    try {
      if (!userTeamMemberData) return;
      setIsLoading(true);
      const newAgreementData = await agreeToMemo(supabaseClient, {
        memoId: memo.memo_id,
        teamMemberId: userTeamMemberData.team_member_id,
      });

      if (newAgreementData) {
        const { user_data } = newAgreementData.memo_agreement_by_team_member;
        const employeeNumber = user_data.user_employee_number[0]
          ? user_data.user_employee_number[0].user_employee_number
          : "N/A";
        const newUserAgreementData = {
          memo_agreement_by_team_member_id:
            newAgreementData.memo_agreement_by_team_member_id,
          memo_agreement_date_created:
            newAgreementData.memo_agreement_date_created,
          memo_agreement_id: newAgreementData.memo_agreement_id,
          memo_agreement_memo_id: newAgreementData.memo_agreement_memo_id,
          ...user_data,
          user_employee_number: employeeNumber,
        };
        setCurrentAgreementList((prev) => [...prev, newUserAgreementData]);
        setHasUserAgreedToMemo(true);
      }
    } catch (e) {
      notifications.show({
        message: "Failed to agree to memo",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userSignerData = memo.memo_signer_list.find(
      (signer) =>
        signer.memo_signer_team_member.team_member_id ===
        userTeamMemberData?.team_member_id
    );

    if (userSignerData) {
      setUserSignerData(userSignerData);
      setUserSignerStatus(userSignerData.memo_signer_status);
    }

    const userAgreementData = memo.memo_agreement_list.find(
      (member) =>
        member.memo_agreement_by_team_member_id ===
        userTeamMemberData?.team_member_id
    );

    if (userAgreementData) {
      setHasUserAgreedToMemo(userAgreementData !== undefined);
    }
  }, [userTeamMemberData]);

  useEffect(() => {
    const fetchMemoFormat = async () => {
      const memoFormat = await getMemoFormat(supabaseClient);
      setMemoFormat(memoFormat);
    };
    fetchMemoFormat();
  }, [supabaseClient]);

  useEffect(() => {
    if (window !== undefined) {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <Container pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Group position="apart">
        <Group>
          <Title order={3} color="dimmed">
            Memo Page
          </Title>
          <CopyButton value={currentUrl}>
            {({ copied, copy }) => (
              <Button
                leftIcon={<IconShare size={16} />}
                size="xs"
                color={copied ? "teal" : "blue"}
                onClick={copy}
              >
                {copied ? "Link Copied" : "Share Memo"}
              </Button>
            )}
          </CopyButton>
        </Group>
        <Group spacing="sm">
          {isUserAuthor && currentMemoStatus === "PENDING" && (
            <Button
              onClick={async () =>
                await router.push(
                  `/${formatTeamNameToUrlKey(activeTeam.team_name)}/memo/${
                    memo.memo_id
                  }/edit`
                )
              }
            >
              Edit Memo
            </Button>
          )}
          <Button
            variant="light"
            onClick={async () =>
              await router.push(
                `/${formatTeamNameToUrlKey(activeTeam.team_name)}/memo/${
                  memo.memo_id
                }/reference`
              )
            }
          >
            Use Memo As Template
          </Button>
          {memoFormat && (
            <ExportMemoToPdf
              memo={memo}
              currentSignedSignerList={currentSignedSignerList}
              sortMemoLineItems={sortMemoLineItems}
              memoFormat={memoFormat}
            />
          )}
        </Group>
      </Group>
      <Paper mt="md" p="xl" radius="md" h="fit-content">
        <Text mb="md" weight={700}>
          MEMORANDUM
        </Text>
        <Stack spacing="xs">
          {renderMemoDetails({
            label: "Reference No.",
            value: memo.memo_reference_number,
          })}
          {renderMemoDetails({
            label: "Version",
            value: memo.memo_version,
          })}
          {renderMemoDetails({
            label: "Date",
            value: formatDate(new Date(memo.memo_date_created)),
          })}
          {renderMemoDetails({
            label: "Author",
            value: memoAuthorFullname,
          })}
          {renderMemoDetails({
            label: "Subject",
            value: memo.memo_subject,
          })}
          <Group>
            <Text weight={600} miw={120}>
              Status
            </Text>
            <Text>:</Text>
            <Badge color={getStatusToColor(currentMemoStatus)}>
              {currentMemoStatus}
            </Badge>
          </Group>
          <Box>
            <Divider color="dark" mt="sm" />
            <Divider color="dark" mt={2} size="lg" />
          </Box>
          <Box>
            {sortMemoLineItems.map((lineItem) => (
              <Box key={lineItem.memo_line_item_id}>
                {renderMemoLineItems(lineItem)}
              </Box>
            ))}
          </Box>

          {currentSignedSignerList.length > 0 ? (
            <>
              <Space mt="xl" />
              <Flex gap={48}>
                {currentSignedSignerList.map((signer) =>
                  signer.memo_signer_status === "APPROVED"
                    ? renderSignerItem(signer)
                    : null
                )}
              </Flex>
            </>
          ) : null}
        </Stack>
      </Paper>
      {currentPendingSignerList.length > 0 && (
        <Paper mt="xl" p="md" radius="md">
          <Stack>
            <Title order={4}>Signers</Title>
            {currentPendingSignerList.map((signer) => {
              const { user_first_name, user_last_name } =
                signer.memo_signer_team_member.user;
              const signerFullname = `${user_first_name} ${user_last_name}`;

              return (
                <Group key={signer.memo_signer_id} spacing={12}>
                  <ThemeIcon
                    color={
                      signer.memo_signer_status === "PENDING" ? "blue" : "red"
                    }
                    size="xs"
                    radius="xl"
                  >
                    {signer.memo_signer_status === "PENDING" ? (
                      <IconCircleDashed />
                    ) : (
                      <IconCircleX />
                    )}
                  </ThemeIcon>
                  {signer.memo_signer_status === "PENDING" ? (
                    <Text>To be signed by {signerFullname}</Text>
                  ) : (
                    <Text>Rejected by {signerFullname}</Text>
                  )}
                  {signer.memo_signer_is_primary && (
                    <Badge size="sm" color="green" variant="light">
                      Primary
                    </Badge>
                  )}
                </Group>
              );
            })}
          </Stack>
        </Paper>
      )}
      {memo.memo_read_receipt_list.length > 0 && (
        <>
          {renderMemoReadReceiptSection(memo.memo_read_receipt_list, () =>
            setOpenReaderListModal(true)
          )}
          <Modal
            title="Memo Reader Receipt"
            opened={openReaderListModal}
            onClose={() => setOpenReaderListModal(false)}
            centered
            withCloseButton
          >
            <Stack>
              {memo.memo_read_receipt_list.map((reader) => {
                const readerFullname = `${reader.user_first_name} ${reader.user_last_name}`;
                return (
                  <Group key={reader.memo_read_receipt_id} position="apart">
                    <Group>
                      <Avatar
                        src={reader.user_avatar}
                        radius="xl"
                        color={getAvatarColor(
                          Number(`${reader.user_id.charCodeAt(0)}`)
                        )}
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          window.open(
                            `/member/${reader.memo_read_receipt_by_team_member_id}`
                          )
                        }
                      >
                        {getInitials(readerFullname)}
                      </Avatar>
                      <Text>
                        <Anchor
                          href={`/member/${reader.memo_read_receipt_by_team_member_id}`}
                          target="_blank"
                        >
                          {readerFullname}
                        </Anchor>
                      </Text>
                    </Group>
                    <Text weight={600}>
                      {reader.user_employee_number ?? "No employee number"}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          </Modal>
        </>
      )}
      {currentAgreementList.length > 0 && (
        <>
          {renderAgreementReceiptSection(currentAgreementList, () =>
            setOpenAgreementListModal(true)
          )}
          <Modal
            title="Memo Agreement Receipt"
            opened={openAgreementListModal}
            onClose={() => setOpenAgreementListModal(false)}
            centered
            withCloseButton
          >
            <Stack>
              {currentAgreementList.map((member) => {
                const memberFullname = `${member.user_first_name} ${member.user_last_name}`;
                return (
                  <Group key={member.memo_agreement_id} position="apart">
                    <Group>
                      <Avatar
                        src={member.user_avatar}
                        radius="xl"
                        color={getAvatarColor(
                          Number(`${member.user_id.charCodeAt(0)}`)
                        )}
                        sx={{
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          window.open(
                            `/member/${member.memo_agreement_by_team_member_id}`
                          )
                        }
                      >
                        {getInitials(memberFullname)}
                      </Avatar>
                      <Text>
                        <Anchor
                          href={`/member/${member.memo_agreement_by_team_member_id}`}
                          target="_blank"
                        >
                          {memberFullname}
                        </Anchor>
                      </Text>
                    </Group>
                    <Text weight={600}>
                      {member.user_employee_number ?? "No employee number"}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          </Modal>
        </>
      )}
      {!userSignerData && !hasUserAgreedToMemo && (
        <Button mt="xl" fullWidth onClick={handleAgreeToMemo}>
          Agree to this Memo
        </Button>
      )}
      {userSignerData && userSignerStatus === "PENDING" ? (
        <Stack spacing="xs" mt="xl">
          <Button
            color="green"
            onClick={() => {
              handleApproveOrRejectMemo(
                "APPROVED",
                userSignerData?.memo_signer_id as string,
                userSignerData?.memo_signer_is_primary as boolean
              );
              setUserSignerStatus("APPROVED");
            }}
          >
            Approve
          </Button>
          <Button
            color="red"
            onClick={() =>
              handleApproveOrRejectMemo(
                "REJECTED",
                userSignerData?.memo_signer_id as string,
                userSignerData?.memo_signer_is_primary as boolean
              )
            }
          >
            Reject
          </Button>
        </Stack>
      ) : null}
    </Container>
  );
};

export default MemoPage;
