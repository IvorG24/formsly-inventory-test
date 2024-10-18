import { deleteRequest } from "@/backend/api/delete";
import {
  getExistingConnectedRequest,
  getRequestComment,
} from "@/backend/api/get";
import { insertError } from "@/backend/api/post";
import { approveOrRejectRequest, cancelRequest } from "@/backend/api/update";
import RequestActionSection from "@/components/RequestPage/RequestActionSection";
import RequestCommentList from "@/components/RequestPage/RequestCommentList";
import RequestDetailsSection from "@/components/RequestPage/RequestDetailsSection";
import RequestSection from "@/components/RequestPage/RequestSection";
import RequestSignerSection from "@/components/RequestPage/RequestSignerSection";
import { useFormList } from "@/stores/useFormStore";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserProfile,
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { formatDate } from "@/utils/constant";
import { isError } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CommentType,
  ReceiverStatusType,
  RequestCommentType,
  RequestWithResponseType,
} from "@/utils/types";
import {
  Alert,
  Button,
  Container,
  Flex,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Props = {
  request: RequestWithResponseType;
};

const PettyCashVoucherRequestPage = ({ request }: Props) => {
  const forms = useFormList();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const initialRequestSignerList = request.request_signer.map((signer) => {
    return {
      ...signer.request_signer_signer,
      request_signer_status: signer.request_signer_status as ReceiverStatusType,
      request_signer_status_date_updated:
        signer.request_signer_status_date_updated,
      request_signer_id: signer.request_signer_id,
    };
  });

  const requestJira = {
    id: request.request_jira_id,
    link: request.request_jira_link,
  };

  const [requestStatus, setRequestStatus] = useState(request.request_status);
  const [signerList, setSignerList] = useState(initialRequestSignerList);
  const [requestCommentList, setRequestCommentList] = useState<
    RequestCommentType[]
  >([]);

  const [jiraTicketStatus, setJiraTicketStatus] = useState<string | null>(null);
  const [pcvBalanceRequestRedirectUrl, setPCVBalanceRequestRedirectUrl] =
    useState<string | null>(null);

  const { setIsLoading } = useLoadingActions();
  const teamMember = useUserTeamMember();
  const user = useUserProfile();
  const teamMemberGroupList = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();

  const requestor = request.request_team_member.team_member_user;
  const isUserOwner = requestor.user_id === user?.user_id;
  const isUserSigner = signerList.find(
    (signer) =>
      signer.signer_team_member.team_member_id === teamMember?.team_member_id
  );
  const requestDateCreated = formatDate(new Date(request.request_date_created));
  const canSignerTakeAction =
    isUserSigner &&
    isUserSigner.request_signer_status === "PENDING" &&
    requestStatus !== "CANCELED";
  const isEditable =
    signerList
      .map((signer) => signer.request_signer_status)
      .filter((status) => status !== "PENDING").length === 0 &&
    isUserOwner &&
    requestStatus === "PENDING";
  const isCancelable = isUserOwner && requestStatus === "PENDING";
  const isDeletable = isUserOwner && requestStatus === "CANCELED";
  const isUserRequester = teamMemberGroupList.includes("REQUESTER");
  const isUserAccountant = teamMemberGroupList.includes("ACCOUNTANT");

  const isRequestActionSectionVisible =
    canSignerTakeAction || isEditable || isDeletable || isUserRequester;

  const originalSectionList = request.request_form.form_section;
  const [sectionWithDuplicateList, setSectionWithDuplicateList] = useState(
    generateSectionWithDuplicateList(originalSectionList)
  );
  const [canCreatePCVBalance, setCanCreatePCVBalance] = useState(false);

  const handleUpdateRequest = async (
    status: "APPROVED" | "REJECTED",
    jiraId?: string,
    jiraLink?: string
  ) => {
    try {
      setIsLoading(true);
      const signer = isUserSigner;
      const signerFullName = `${signer?.signer_team_member.team_member_user.user_first_name} ${signer?.signer_team_member.team_member_user.user_last_name}`;
      if (!signer) {
        notifications.show({
          message: "Invalid signer.",
          color: "orange",
        });
        return;
      }
      if (!teamMember) return;

      await approveOrRejectRequest(supabaseClient, {
        requestAction: status,
        requestId: request.request_id,
        isPrimarySigner: signer.signer_is_primary_signer,
        requestSignerId: signer.request_signer_id,
        requestOwnerId: request.request_team_member.team_member_user.user_id,
        signerFullName: signerFullName,
        formName: request.request_form.form_name,
        memberId: teamMember.team_member_id,
        teamId: request.request_team_member.team_member_team_id,
        jiraId,
        jiraLink,
        requestFormslyId: request.request_formsly_id,
      });

      notifications.show({
        message: `Request ${status.toLowerCase()}.`,
        color: "green",
      });
      setRequestStatus(status);
      setSignerList((prev) =>
        prev.map((thisSigner) => {
          if (signer.signer_id === thisSigner.signer_id) {
            return {
              ...signer,
              request_signer_status: status,
              request_signer_status_date_updated: new Date().toISOString(),
            };
          }
          return thisSigner;
        })
      );
      setRequestCommentList((prev) => [
        {
          comment_id: uuidv4(),
          comment_date_created: new Date().toISOString(),
          comment_content: `${signerFullName} ${status.toLowerCase()} this request`,
          comment_is_edited: false,
          comment_last_updated: "",
          comment_type: `ACTION_${status.toUpperCase()}` as CommentType,
          comment_team_member_id: signer.signer_team_member.team_member_id,
          comment_team_member: {
            team_member_user: {
              ...signer.signer_team_member.team_member_user,
              user_id: uuidv4(),
              user_username: "",
              user_avatar: "",
            },
          },
          comment_attachment: [],
        },
        ...prev,
      ]);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleUpdateRequest",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!teamMember) return;
    try {
      setIsLoading(true);
      await cancelRequest(supabaseClient, {
        requestId: request.request_id,
        memberId: teamMember.team_member_id,
      });
      setRequestStatus("CANCELED");
      setRequestCommentList((prev) => [
        {
          comment_id: uuidv4(),
          comment_date_created: new Date().toISOString(),
          comment_content: `Request canceled`,
          comment_is_edited: false,
          comment_last_updated: "",
          comment_type: `ACTION_CANCELED` as CommentType,
          comment_team_member_id: request.request_team_member_id ?? "",
          comment_team_member: {
            team_member_user: {
              ...request.request_team_member.team_member_user,
              user_id: uuidv4(),
              user_username: "",
              user_avatar: "",
            },
          },
          comment_attachment: [],
        },
        ...prev,
      ]);
      notifications.show({
        message: `Request cancelled.`,
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteRequest = async () => {
    try {
      setIsLoading(true);
      await deleteRequest(supabaseClient, {
        requestId: request.request_id,
      });
      notifications.show({
        message: "Request deleted.",
        color: "green",
      });
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/requests`
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPromptDeleteModal = () =>
    modals.openConfirmModal({
      title: "Are you sure you want to delete this request?",
      children: (
        <Text size="sm">
          This action is so important that you are required to confirm it with a
          modal. Please click one of these buttons to proceed.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "red" },
      onConfirm: async () => await handleDeleteRequest(),
    });

  const openRedirectToPCVBalanceRequestModal = (redirectUrl: string) =>
    modals.openConfirmModal({
      title: <Text weight={600}>PCV Balance request already exists.</Text>,
      children: (
        <Text size="sm">
          Would you like to be redirected to the PCV Balance request page?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      onConfirm: async () => await router.push(redirectUrl),
    });

  const handleCreatePCVBalanceRequest = async () => {
    try {
      if (pcvBalanceRequestRedirectUrl) {
        openRedirectToPCVBalanceRequestModal(pcvBalanceRequestRedirectUrl);
        return;
      }

      const wavBalanceForm = forms.find(
        (form) => form.form_name === "Petty Cash Voucher Balance"
      );
      if (!wavBalanceForm) {
        notifications.show({
          message: "Petty Cash Voucher Balance form is not available",
          color: "red",
        });
        return;
      }
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/forms/${
          wavBalanceForm.form_id
        }/create?wav=${request.request_formsly_id}`
      );
    } catch (e) {
      notifications.show({
        message:
          "Failed to create Bill of Quantity request. Please contact the IT team.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    try {
      // update sections
      let updatedRequestSectionList = sectionWithDuplicateList;
      const isChargeToProject =
        request.request_form.form_section[1].section_field.find(
          (field) =>
            field.field_name === "Is this request charged to the project?"
        )?.field_response[0];
      const salaryDeductionSection = request.request_form.form_section.find(
        (section) =>
          section.section_name === "SCIC Salary Deduction Authorization"
      );

      const isSalaryDeduction =
        salaryDeductionSection?.section_field[0]?.field_response[0];

      const isPedAndChargeToProject =
        isChargeToProject &&
        isChargeToProject.request_response &&
        isChargeToProject.request_response === "false";

      if (!isChargeToProject || Boolean(isPedAndChargeToProject)) {
        updatedRequestSectionList = updatedRequestSectionList.filter(
          (section) => section.section_name !== "Charge to Project Details"
        );
      }

      if (
        isSalaryDeduction?.request_response &&
        isSalaryDeduction.request_response === "false"
      ) {
        updatedRequestSectionList = updatedRequestSectionList.filter(
          (section) => section.section_name !== "Particular Details"
        );
      }
      setSectionWithDuplicateList(updatedRequestSectionList);

      const fetchComments = async () => {
        const data = await getRequestComment(supabaseClient, {
          request_id: request.request_id,
        });
        setRequestCommentList(data);
      };

      fetchComments();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchJiraTicketStatus = async (requestJiraId: string) => {
      const newJiraTicketData = await fetch(
        `/api/jira/get-ticket?jiraTicketKey=${requestJiraId}`
      );

      if (newJiraTicketData.ok) {
        const jiraTicket = await newJiraTicketData.json();
        const jiraTicketStatus =
          jiraTicket.fields["customfield_10010"].currentStatus.status;

        setJiraTicketStatus(jiraTicketStatus);
      } else {
        setJiraTicketStatus("Ticket Not Found");
      }
    };
    if (requestJira.id) {
      fetchJiraTicketStatus(requestJira.id);
    }
  }, [requestJira.id]);

  useEffect(() => {
    const fetchPCVBalanceRequest = async () => {
      const pcvBalanceRequest = await getExistingConnectedRequest(
        supabaseClient,
        {
          parentRequestId: request.request_id,
          fieldId: "9a112d6f-a34e-4767-b3c1-7f30af858f8f",
        }
      );
      setCanCreatePCVBalance(
        requestStatus === "APPROVED" && isUserAccountant && !pcvBalanceRequest
      );
      if (pcvBalanceRequest) {
        const { request_formsly_id_prefix, request_formsly_id_serial } =
          pcvBalanceRequest;
        const baseUrl = activeTeam.team_name
          ? `/${formatTeamNameToUrlKey(activeTeam.team_name)}/requests`
          : `/public-request`;
        const redirectUrl = `${baseUrl}/${request_formsly_id_prefix}-${request_formsly_id_serial}`;
        setPCVBalanceRequestRedirectUrl(redirectUrl);
      }
    };
    if (requestStatus === "APPROVED") {
      fetchPCVBalanceRequest();
    }
  }, [requestStatus, activeTeam.team_name, isUserAccountant]);

  return (
    <Container>
      <Flex justify="space-between" rowGap="xs" wrap="wrap">
        <Title order={2} color="dimmed">
          Request
        </Title>
        {canCreatePCVBalance && (
          <Button onClick={() => handleCreatePCVBalanceRequest()}>
            Create PCV Balance
          </Button>
        )}
      </Flex>
      <Stack spacing="xl" mt="xl">
        <RequestDetailsSection
          request={request}
          requestor={requestor}
          requestDateCreated={requestDateCreated}
          requestStatus={requestStatus}
          isPrimarySigner={isUserSigner?.signer_is_primary_signer}
          requestJira={requestJira}
          jiraTicketStatus={jiraTicketStatus}
        />

        {/* connected PCV Balance request */}
        {pcvBalanceRequestRedirectUrl && (
          <Alert variant="light" color="blue">
            <Flex align="center" gap="sm">
              <Group spacing={4}>
                <ThemeIcon variant="light">
                  <IconAlertCircle size={16} />
                </ThemeIcon>
                <Text color="blue" weight={600}>
                  A PCV Balance request has been created for this request.
                </Text>
              </Group>
              <Button
                size="xs"
                variant="outline"
                onClick={async () =>
                  await router.push(pcvBalanceRequestRedirectUrl)
                }
              >
                View PCV Balance
              </Button>
            </Flex>
          </Alert>
        )}

        {sectionWithDuplicateList.map((section, idx) => {
          if (
            idx === 0 &&
            section.section_field[0].field_response?.request_response ===
              '"null"'
          )
            return;

          return (
            <RequestSection
              key={section.section_id + idx}
              section={section}
              isFormslyForm={true}
              isOnlyWithResponse
            />
          );
        })}

        {isRequestActionSectionVisible && (
          <RequestActionSection
            handleCancelRequest={handleCancelRequest}
            openPromptDeleteModal={openPromptDeleteModal}
            handleUpdateRequest={handleUpdateRequest}
            isUserPrimarySigner={
              isUserSigner
                ? Boolean(isUserSigner.signer_is_primary_signer)
                : false
            }
            isEditable={isEditable}
            isCancelable={isCancelable}
            canSignerTakeAction={canSignerTakeAction}
            isDeletable={isDeletable}
            isUserRequester={isUserRequester}
            requestId={request.request_id}
            isItemForm
            requestSignerId={isUserSigner?.request_signer_id}
          />
        )}

        <RequestSignerSection signerList={signerList} />
      </Stack>

      <RequestCommentList
        requestData={{
          requestId: request.request_id,
          requestOwnerId: request.request_team_member.team_member_user.user_id,
          teamId: request.request_team_member.team_member_team_id,
        }}
        requestCommentList={requestCommentList}
        setRequestCommentList={setRequestCommentList}
      />
    </Container>
  );
};

export default PettyCashVoucherRequestPage;
