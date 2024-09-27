import { deleteRequest } from "@/backend/api/delete";
import {
  getRequestComment,
  getUserIdInApplicationInformation,
} from "@/backend/api/get";
import { approveOrRejectRequest, cancelRequest } from "@/backend/api/update";
import RequestActionSection from "@/components/RequestPage/RequestActionSection";
import RequestCommentList from "@/components/RequestPage/RequestCommentList";
import RequestDetailsSection from "@/components/RequestPage/RequestDetailsSection";
import RequestSection from "@/components/RequestPage/RequestSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { BASE_URL, formatDate } from "@/utils/constant";
import { JoyRideNoSSR, safeParse } from "@/utils/functions";
import {
  createJiraTicket,
  formatJiraRequisitionPayload,
  getJiraTransitionId,
  getRequisitionAutomationData,
} from "@/utils/jira/functions";
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
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconNote } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Props = {
  request: RequestWithResponseType;
};

const TechnicalAssessmentRequestPage = ({ request }: Props) => {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const { colors } = useMantineTheme();
  const { setIsLoading } = useLoadingActions();
  const [isNoteClosed, setIsNoteClosed] = useState(false);

  const initialRequestSignerList = request.request_signer.map((signer) => {
    return {
      ...signer.request_signer_signer,
      request_signer_status: signer.request_signer_status as ReceiverStatusType,
      request_signer_status_date_updated:
        signer.request_signer_status_date_updated,
      request_signer_id: signer.request_signer_id,
    };
  });

  const [requestStatus, setRequestStatus] = useState(request.request_status);
  const [signerList, setSignerList] = useState(initialRequestSignerList);
  const [requestCommentList, setRequestCommentList] = useState<
    RequestCommentType[]
  >([]);
  const [requestJira, setRequestJira] = useState({
    id: request.request_jira_id,
    link: request.request_jira_link,
  });
  const formSection = generateSectionWithDuplicateList(
    request.request_form.form_section
  );

  // const isWithDuplicatableSection = request.request_form.form_section.some(
  //   (section) =>
  //     section.section_is_duplicatable &&
  //     section.section_field[0].field_response.length
  // );

  const teamMember = useUserTeamMember();
  const user = useUserProfile();
  // const teamMemberGroupList = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();

  const requestor = request.request_team_member.team_member_user;

  const requestDateCreated = formatDate(new Date(request.request_date_created));

  const handleUpdateRequest = async (status: "APPROVED" | "REJECTED") => {
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

      const userId = await getUserIdInApplicationInformation(supabaseClient, {
        requestId: request.request_id,
      });

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
        requestFormslyId: request.request_formsly_id,
        userId,
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

  const onCreateJiraTicket = async () => {
    try {
      if (!request.request_project_id) {
        throw new Error("Project id is not defined.");
      }
      setIsLoading(true);
      const itemCategory =
        "Fixed Asset - Construction Equipment, Machinery and Tools";
      const requisitionAutomationData = await getRequisitionAutomationData(
        supabaseClient,
        {
          teamProjectId: request.request_project_id,
          itemCategory,
        }
      );
      const jiraTicketPayload = formatJiraRequisitionPayload({
        requestId: request.request_formsly_id,
        requestUrl: `${BASE_URL}/public-request/${request.request_formsly_id}`,
        requestFormType: request.request_form.form_name,
        requestTypeId: "299",
        ...requisitionAutomationData,
      });
      const jiraTicket = await createJiraTicket({
        requestType: "Automated Requisition Form",
        formslyId: request.request_formsly_id,
        requestCommentList,
        ticketPayload: jiraTicketPayload,
        transitionId: getJiraTransitionId(request.request_form.form_name) ?? "",
        organizationId: requisitionAutomationData.jiraOrganizationId,
      });
      setRequestJira({
        id: jiraTicket.jiraTicketId,
        link: jiraTicket.jiraTicketLink,
      });
      return jiraTicket;
    } catch (e) {
      const errorMessage = (e as Error).message;
      notifications.show({
        message: `Error: ${errorMessage}`,
        color: "red",
      });
      return { jiraTicketId: "", jiraTicketLink: "" };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const fetchComments = async () => {
        const data = await getRequestComment(supabaseClient, {
          request_id: request.request_id,
        });
        setRequestCommentList(data);
        if (nextStep) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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

  const isUserOwner = requestor.user_id === user?.user_id;
  const isUserSigner = signerList.find(
    (signer) =>
      signer.signer_team_member.team_member_id === teamMember?.team_member_id
  );

  const canSignerTakeAction =
    isUserSigner &&
    isUserSigner.request_signer_status === "PENDING" &&
    requestStatus !== "CANCELED";
  const isEditable = false;
  // signerList
  //   .map((signer) => signer.request_signer_status)
  //   .filter((status) => status !== "PENDING").length === 0 &&
  // isUserOwner &&
  // requestStatus === "PENDING";
  const isCancelable = isUserOwner && requestStatus === "PENDING";
  const isDeletable = isUserOwner && requestStatus === "CANCELED";
  const isUserRequester = false;
  // teamMemberGroupList.includes("REQUESTER");
  const isRequestActionSectionVisible =
    canSignerTakeAction || isEditable || isDeletable || isUserRequester;
  const nextStep = request.request_status === "APPROVED";

  return (
    <Container>
      <JoyRideNoSSR
        steps={[
          {
            target: ".next-step",
            content: (
              <Text>
                You can now continue to HR Phone Interview since the technical
                assessment has been approved. To continue, simply click the
                &ldquo;Next Step&ldquo; button.
              </Text>
            ),
            disableBeacon: true,
          },
        ]}
        run={true}
        hideCloseButton
        disableCloseOnEsc
        disableOverlayClose
        hideBackButton
        styles={{ buttonNext: { backgroundColor: colors.blue[6] } }}
      />
      {!isNoteClosed && router.pathname.includes("public-request") && (
        <Alert
          mb="xl"
          title="Note!"
          icon={<IconNote size={16} />}
          withCloseButton
          onClose={() => {
            setIsNoteClosed(true);
          }}
        >
          <Text>
            To access and keep track of all your submitted applications, go to{" "}
            <Link href="/sign-up">formsly.io/sign-up</Link> and sign up using
            the email that you entered on the application.
          </Text>
        </Alert>
      )}

      <Flex justify="space-between" rowGap="xs" wrap="wrap">
        <Title order={2} color="dimmed">
          Request
        </Title>
        {nextStep && (
          <Button
            className="next-step"
            onClick={() =>
              router.push(
                `/user/application-progress/${safeParse(
                  request.request_form.form_section[0].section_field[0]
                    .field_response[0].request_response
                )}`
              )
            }
          >
            Next Step
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
        />
        <Stack spacing="xl" mt="lg">
          {formSection.slice(0, 2).map((section, idx) => {
            return (
              <RequestSection
                key={section.section_id + idx}
                section={section}
                isFormslyForm={true}
                isOnlyWithResponse
                index={idx + 1}
                isPublicRequest={true}
              />
            );
          })}
          {formSection[2].section_field.length ? (
            formSection.slice(2).map((section, idx) => {
              return (
                <RequestSection
                  key={section.section_id + idx}
                  section={section}
                  isFormslyForm={true}
                  isOnlyWithResponse
                  index={idx + 1}
                  isPublicRequest={true}
                />
              );
            })
          ) : (
            <Alert mb="xl" title="Note!" icon={<IconNote size={16} />}>
              <Text>
                The position doesn&apos;t have a technical assessment yet.
              </Text>
            </Alert>
          )}
        </Stack>

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
            isEditable={false}
            isCancelable={isCancelable}
            canSignerTakeAction={canSignerTakeAction}
            isDeletable={isDeletable}
            isUserRequester={false}
            requestId={request.request_id}
            isItemForm
            onCreateJiraTicket={onCreateJiraTicket}
            requestSignerId={isUserSigner?.request_signer_id}
          />
        )}

        {/* <RequestSignerSection signerList={signerList} /> */}
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

export default TechnicalAssessmentRequestPage;
