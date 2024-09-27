import { deleteRequest } from "@/backend/api/delete";
import {
  getPositionTypeOptions,
  getRequestComment,
  getUserIdInApplicationInformationV1,
} from "@/backend/api/get";
import { approveOrRejectRequest, cancelRequest } from "@/backend/api/update";
import RequestActionSection from "@/components/RequestPage/RequestActionSection";
import RequestCommentList from "@/components/RequestPage/RequestCommentList";
import RequestDetailsSection from "@/components/RequestPage/RequestDetailsSection";
import RequestSection from "@/components/RequestPage/RequestSection";
import RequestSignerSection from "@/components/RequestPage/RequestSignerSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { formatDate } from "@/utils/constant";
import { JoyRideNoSSR, safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CommentType,
  ReceiverStatusType,
  RequestCommentType,
  RequestWithResponseType,
} from "@/utils/types";
import {
  Accordion,
  Alert,
  Button,
  Container,
  Flex,
  Paper,
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

const ApplicationInformationV1RequestPage = ({ request }: Props) => {
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

  const isWithDuplicatableSection = request.request_form.form_section.some(
    (section) =>
      section.section_is_duplicatable &&
      section.section_field[0].field_response.length
  );

  const teamMember = useUserTeamMember();
  const user = useUserProfile();
  // const teamMemberGroupList = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();

  const requestor = request.request_team_member.team_member_user;

  const requestDateCreated = formatDate(new Date(request.request_date_created));

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

      const userId = await getUserIdInApplicationInformationV1(supabaseClient, {
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
        jiraId,
        jiraLink,
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
      setIsLoading(true);

      const personalInformationSection = formSection[1].section_field;
      const firstName = safeParse(
        `${personalInformationSection[0].field_response?.request_response}`
      );
      const middleName = personalInformationSection[1].field_response
        ?.request_response
        ? safeParse(
            personalInformationSection[1].field_response?.request_response
          )
        : "";
      const lastName = safeParse(
        `${personalInformationSection[2].field_response?.request_response}`
      );
      let applicantName = `${lastName}, ${firstName}`;
      if (middleName) {
        applicantName = applicantName + ` ${middleName}`;
      }

      const applicantPosition = safeParse(
        `${formSection[0].section_field[0].field_response?.request_response}`
      );
      const positionType = await getPositionTypeOptions(
        supabaseClient,
        applicantPosition
      );
      const sssID = safeParse(
        `${formSection[3].section_field[0].field_response?.request_response}`
      );
      const contactNumber = safeParse(
        `${formSection[2].section_field[0].field_response?.request_response}`
      );
      const emailAddress = safeParse(
        `${formSection[2].section_field[1].field_response?.request_response}`
      );
      const candidateSource = safeParse(
        `${formSection[0].section_field[3].field_response?.request_response}`
      );
      const employmentStatus = safeParse(
        `${formSection[5].section_field[0].field_response?.request_response}`
      );
      const isExperienced = formSection.some(
        (section) => section.section_name === "Most Recent Work Experience"
      );

      const createTicketResponse = await fetch(
        "/api/jira/create-recruitment-ticket",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantName,
            applicantPosition,
            positionType,
            sssID,
            contactNumber,
            emailAddress,
            candidateSource,
            employmentStatus,
            isExperienced,
          }),
        }
      );
      const jiraTicket = await createTicketResponse.json();

      if (!jiraTicket.jiraTicketId) {
        notifications.show({
          message: "Failed to create jira ticket",
          color: "red",
        });
        return;
      }
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
  const nextStep = false;
  // request.request_status === "APPROVED" &&
  // user?.user_email ===
  //   safeParse(
  //     request.request_form.form_section[2].section_field[1].field_response[0]
  //       .request_response ?? ""
  //   ) &&
  // request.isWithNextStep;

  return (
    <Container>
      <JoyRideNoSSR
        steps={[
          {
            target: ".onboarding-create-team",
            content: (
              <Text>
                You can now continue with the online application since your
                application information has been accepted. To continue, simply
                click the &ldquo;Next Step&ldquo; button.
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
            className="onboarding-create-team"
            onClick={() =>
              router.push(
                `/public-form/71f569a0-70a8-4609-82d2-5cc26ac1fe8c/create?applicationInformationId=${request.request_formsly_id}`
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
          {formSection.map((section, idx) => {
            if (
              !section.section_field[0].field_response ||
              section.section_is_duplicatable ||
              section.section_name === "Resume"
            )
              return null;
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

          {isWithDuplicatableSection && (
            <Accordion>
              <Accordion.Item value={"workExperience"}>
                <Paper shadow="xs">
                  <Accordion.Control>
                    <Title order={4} color="dimmed">
                      Most Recent Work Experience
                    </Title>
                  </Accordion.Control>
                </Paper>
                <Accordion.Panel>
                  <Stack spacing="xl" mt="lg">
                    {formSection
                      .filter((section) => section.section_is_duplicatable)
                      .map((section, index) => {
                        return (
                          <RequestSection
                            key={section.section_id + index}
                            section={section}
                            isFormslyForm={true}
                            isOnlyWithResponse
                            index={index + 1}
                            isPublicRequest={true}
                          />
                        );
                      })}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}

          <RequestSection
            section={formSection[formSection.length - 1]}
            isFormslyForm={true}
            isOnlyWithResponse
            isPublicRequest={true}
          />
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
            requestSignerId={isUserSigner?.request_signer_id}
            onCreateJiraTicket={onCreateJiraTicket}
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

export default ApplicationInformationV1RequestPage;
