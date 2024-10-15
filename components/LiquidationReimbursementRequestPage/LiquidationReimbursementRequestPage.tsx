import { deleteRequest } from "@/backend/api/delete";
import {
  getExistingConnectedRequest,
  getJiraAutomationDataByProjectId,
  getRequestComment,
  getSectionInRequestPage,
} from "@/backend/api/get";
import { approveOrRejectRequest, cancelRequest } from "@/backend/api/update";
import RequestActionSection from "@/components/RequestPage/RequestActionSection";
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
import {
  ALLOWED_USER_TO_EDIT_LRF_REQUESTS,
  formatDate,
} from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import {
  createJiraTicket,
  formatJiraLRFRequisitionPayload,
} from "@/utils/jira/functions";
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
  Group,
  Paper,
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
import ExportToPdfMenu from "../ExportToPDF/ExportToPdfMenu";
import RequestCommentList from "../RequestPage/RequestCommentList";
import LiquidationReimbursementSummary from "../SummarySection/LiquidationReimbursementSummary";

type Props = {
  request: RequestWithResponseType;
  duplicatableSectionIdList: string[];
};

type SectionField =
  RequestWithResponseType["request_form"]["form_section"][0]["section_field"];

const LiquidationReimbursementRequestPage = ({
  request,
  duplicatableSectionIdList,
}: Props) => {
  const forms = useFormList();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const { setIsLoading } = useLoadingActions();

  const isPureLiquidation =
    safeParse(
      `${
        request.request_form.form_section[0].section_field[4].field_response[0]
          .request_response ?? ""
      }`
    ) === "Liquidation";

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
  const [jiraTicketStatus, setJiraTicketStatus] = useState<string | null>(null);
  const [formSection, setFormSection] = useState(
    generateSectionWithDuplicateList([
      {
        ...request.request_form.form_section[0],
        section_field:
          request.request_form.form_section[0].section_field.filter(
            (field) => field.field_name !== "BOQ Code"
          ),
      },
      request.request_form.form_section[2],
    ])
  );
  const [boqRequestRedirectUrl, setBOQRequestRedirectUrl] = useState<
    string | null
  >(null);
  const [requestJira, setRequestJira] = useState({
    id: request.request_jira_id,
    link: request.request_jira_link,
  });

  const teamMember = useUserTeamMember();
  const user = useUserProfile();
  const teamMemberGroupList = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();

  const requestor = request.request_team_member.team_member_user;
  const requestDateCreated = formatDate(new Date(request.request_date_created));
  const selectedDepartment = safeParse(
    request.request_form.form_section[0].section_field[2].field_response[0]
      .request_response
  );
  const isUserOwner = requestor.user_id === user?.user_id;
  const isUserSigner = signerList.find(
    (signer) =>
      signer.signer_team_member.team_member_id === teamMember?.team_member_id
  );
  const canSignerTakeAction =
    isUserSigner &&
    isUserSigner.request_signer_status === "PENDING" &&
    requestStatus !== "CANCELED";
  const isEditable =
    (signerList
      .map((signer) => signer.request_signer_status)
      .filter((status) => status !== "PENDING").length === 0 &&
      isUserOwner &&
      requestStatus === "PENDING") ||
    (["PENDING", "APPROVED"].includes(requestStatus) &&
      user?.user_email === ALLOWED_USER_TO_EDIT_LRF_REQUESTS);
  const isCancelable = isUserOwner && requestStatus === "PENDING";
  const isDeletable = isUserOwner && requestStatus === "CANCELED";
  const isUserRequester = teamMemberGroupList.includes("REQUESTER");
  const isUserCostEngineer = teamMemberGroupList.includes("COST ENGINEER");
  const requestProjectName = request.request_project.team_project_name;
  const isBOQNotRequired =
    requestProjectName.includes("CENTRAL OFFICE") ||
    requestProjectName.includes("YARD") ||
    selectedDepartment === "Plants and Equipment";

  const [canCreateBOQ, setCanCreateBOQ] = useState(false);

  const isRequestActionSectionVisible =
    canSignerTakeAction || isEditable || isDeletable || isUserRequester;

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

  const openRedirectToBOQRequestModal = (redirectUrl: string) =>
    modals.openConfirmModal({
      title: <Text weight={600}>Bill of Quantity request already exists.</Text>,
      children: (
        <Text size="sm">
          Would you like to be redirected to the Bill of Quantity request page?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      onConfirm: async () => await router.push(redirectUrl),
    });

  const handleCreateBOQRequest = async () => {
    try {
      if (boqRequestRedirectUrl) {
        openRedirectToBOQRequestModal(boqRequestRedirectUrl);
        return;
      }

      const boqForm = forms.find(
        (form) => form.form_name === "Bill of Quantity"
      );
      if (!boqForm) {
        notifications.show({
          message: "Bill of Quantity form is not available",
          color: "red",
        });
        return;
      }
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/forms/${
          boqForm.form_id
        }/create?lrf=${request.request_formsly_id}`
      );
    } catch (e) {
      notifications.show({
        message:
          "Failed to create Bill of Quantity request. Please contact the IT team.",
        color: "red",
      });
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

  const getTotalInvoiceAmount = () => {
    const payeeSectionList = formSection.filter(
      (section) => section.section_name === "Payee"
    );
    let total = 0;

    payeeSectionList.forEach((section) => {
      const invoiceAmountField = section.section_field.find(
        (field) => field.field_name === "Invoice Amount"
      );
      if (invoiceAmountField?.field_response) {
        total += Number(invoiceAmountField.field_response.request_response);
      }
    });

    return total;
  };

  const onCreateJiraTicket = async () => {
    try {
      if (!isBOQNotRequired) {
        return { jiraTicketId: "", jiraTicketLink: "" };
      }
      if (!user) throw new Error("User is not defined.");
      if (!request.request_project_id) {
        throw new Error("Project id is not defined.");
      }
      setIsLoading(true);
      const jiraAutomationData = await getJiraAutomationDataByProjectId(
        supabaseClient,
        { teamProjectId: request.request_project_id }
      );

      if (!jiraAutomationData?.jiraProjectData) {
        throw new Error("Error fetching Jira project data.");
      }

      const response = await fetch(
        "/api/jira/get-form?serviceDeskId=27&requestType=406",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const { fields } = await response.json();
      if (!fields) {
        throw new Error("Jira form is not defined.");
      }
      const departmentList = fields["469"].choices;
      const typeList = fields["442"].choices;
      const workingAdvanceList = fields["445"].choices;

      const requestDetails = request.request_form.form_section[0]
        .section_field as SectionField;

      const sortedRequestDetails = requestDetails.sort(
        (a, b) => a.field_order - b.field_order
      );
      const purpose = safeParse(
        sortedRequestDetails[3].field_response[0].request_response
      );
      const typeOfRequest = safeParse(
        sortedRequestDetails[4].field_response[0].request_response
      );

      let workingAdvances = "";
      let ticketId = "";

      if (typeOfRequest.includes("Liquidation")) {
        const requestWorkingAdvances = safeParse(
          sortedRequestDetails[5].field_response[0].request_response
        );
        const choiceMatch = workingAdvanceList.find(
          (workingAdvanceItem: { id: string; name: string }) =>
            workingAdvanceItem.name.toLowerCase() ===
            requestWorkingAdvances.toLowerCase()
        );
        workingAdvances = choiceMatch.id;
        ticketId = safeParse(
          sortedRequestDetails[6].field_response[0].request_response
        );
      }
      const typeOfRequestId = typeList.find(
        (typeOfRequestItem: { id: string; name: string }) =>
          typeOfRequestItem.name.toLowerCase() === typeOfRequest.toLowerCase()
      );
      const departmentId = departmentList.find(
        (departmentItem: { id: string; name: string }) =>
          departmentItem.name.toLowerCase() === selectedDepartment.toLowerCase()
      );

      if (!typeOfRequestId || !departmentId) {
        notifications.show({
          message: "Department or type of request is undefined.",
          color: "red",
        });
        return { success: false, data: null };
      }

      const requestor = `${request.request_team_member.team_member_user.user_first_name} ${request.request_team_member.team_member_user.user_last_name}`;
      const amount = getTotalInvoiceAmount();

      const jiraTicketPayload = formatJiraLRFRequisitionPayload({
        requestId: request.request_formsly_id,
        requestUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/public-request/${request.request_formsly_id}`,
        requestor: requestor,
        jiraProjectSiteId:
          jiraAutomationData.jiraProjectData.jira_project_jira_id,
        department: departmentId.id,
        purpose,
        typeOfRequest: typeOfRequestId.id,
        requestFormType: "BOQ",
        workingAdvances,
        ticketId,
        amount,
      });

      const jiraTicket = await createJiraTicket({
        requestType: "Request for Liquidation/Reimbursement v2",
        formslyId: request.request_formsly_id,
        requestCommentList,
        ticketPayload: jiraTicketPayload,
      });

      if (!jiraTicket.jiraTicketId) {
        throw new Error("Failed to create jira ticket.");
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
      setIsLoading(true);
      const fetchSections = async () => {
        const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];

        const sortedDuplicatableSectionIdList = duplicatableSectionIdList
          .sort()
          .reverse();
        let index = 0;
        while (1) {
          const duplicatableSectionIdCondition = sortedDuplicatableSectionIdList
            .slice(index, index + 5)
            .map((dupId) => `'${dupId}'`)
            .join(",");

          const data = await getSectionInRequestPage(supabaseClient, {
            index,
            requestId: request.request_id,
            sectionId: request.request_form.form_section[1].section_id,
            duplicatableSectionIdCondition:
              duplicatableSectionIdCondition.length !== 0
                ? duplicatableSectionIdCondition
                : `'${uuidv4()}'`,
          });
          newFields.push(...data);
          index += 5;

          if (index >= duplicatableSectionIdList.length) break;
        }

        const uniqueFieldIdList: string[] = [];
        const combinedFieldList: RequestWithResponseType["request_form"]["form_section"][1]["section_field"] =
          [];
        newFields.forEach((field) => {
          if (uniqueFieldIdList.includes(field.field_id)) {
            const currentFieldIndex = combinedFieldList.findIndex(
              (combinedField) => combinedField.field_id === field.field_id
            );
            combinedFieldList[currentFieldIndex].field_response.push(
              ...field.field_response
            );
          } else {
            uniqueFieldIdList.push(field.field_id);
            combinedFieldList.push(field);
          }
        });

        const newSection = generateSectionWithDuplicateList([
          {
            ...request.request_form.form_section[1],
            section_field: combinedFieldList,
          },
        ]);

        const formattedSection = newSection
          .map((section) => {
            let sectionOrder = section.section_order;
            const sectionDuplicatableId =
              section.section_field[0].field_response
                ?.request_response_duplicatable_section_id;

            if (sectionDuplicatableId) {
              const sectionIndex = sortedDuplicatableSectionIdList.findIndex(
                (id) => id === sectionDuplicatableId
              );

              sectionOrder = sectionIndex + 1;
            } else {
              sectionOrder = 0;
            }
            return {
              ...section,
              section_order: sectionOrder,
            };
          })
          .sort((a, b) => a.section_order - b.section_order);

        const newFormSection = [...formSection, ...formattedSection];
        setFormSection(newFormSection);
      };
      const fetchComments = async () => {
        const data = await getRequestComment(supabaseClient, {
          request_id: request.request_id,
        });
        setRequestCommentList(data);
      };
      fetchSections();
      fetchComments();
      setIsLoading(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  }, []);

  useEffect(() => {
    const fetchBOQRequest = async () => {
      // check if boq request exists
      const boqRequest = await getExistingConnectedRequest(
        supabaseClient,
        request.request_id
      );
      setCanCreateBOQ(
        requestStatus === "APPROVED" &&
          isUserCostEngineer &&
          !isBOQNotRequired &&
          !boqRequest
      );
      if (boqRequest) {
        const { request_formsly_id_prefix, request_formsly_id_serial } =
          boqRequest;
        const baseUrl = activeTeam.team_name
          ? `/${formatTeamNameToUrlKey(activeTeam.team_name)}/requests`
          : `/public-request`;
        const redirectUrl = `${baseUrl}/${request_formsly_id_prefix}-${request_formsly_id_serial}`;

        setBOQRequestRedirectUrl(redirectUrl);
      }
    };
    if (requestStatus === "APPROVED") {
      fetchBOQRequest();
    }
  }, [
    requestStatus,
    activeTeam.team_name,
    supabaseClient,
    request.request_id,
    isUserCostEngineer,
    selectedDepartment,
  ]);

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

  return (
    <Container>
      <Flex justify="space-between" rowGap="xs" wrap="wrap">
        <Title order={2} color="dimmed">
          Request
        </Title>
        {canCreateBOQ && (
          <Button onClick={() => handleCreateBOQRequest()}>Create BOQ</Button>
        )}
        <ExportToPdfMenu
          isFormslyForm={request.request_form.form_is_formsly_form}
          formName={request.request_form.form_name}
          requestId={request.request_formsly_id ?? request.request_id}
        />
      </Flex>

      <Stack spacing="xl" mt="xl">
        <RequestDetailsSection
          request={request}
          requestor={requestor}
          requestDateCreated={requestDateCreated}
          requestStatus={requestStatus}
          requestJira={requestJira}
          isPrimarySigner={isUserSigner?.signer_is_primary_signer}
          jiraTicketStatus={jiraTicketStatus}
        />

        {/* connected BOQ request */}
        {boqRequestRedirectUrl && (
          <Alert variant="light" color="blue">
            <Flex align="center" gap="sm">
              <Group spacing={4}>
                <ThemeIcon variant="light">
                  <IconAlertCircle size={16} />
                </ThemeIcon>
                <Text color="blue" weight={600}>
                  A BOQ request has been created for this request.
                </Text>
              </Group>
              <Button
                size="xs"
                variant="outline"
                onClick={async () => await router.push(boqRequestRedirectUrl)}
              >
                View BOQ
              </Button>
            </Flex>
          </Alert>
        )}

        <RequestSection
          section={formSection[0]}
          isFormslyForm={true}
          isOnlyWithResponse
        />

        <Accordion>
          <Accordion.Item key="item" value="item">
            <Paper shadow="xs">
              <Accordion.Control>
                <Title order={4} color="dimmed">
                  Payee Section
                </Title>
              </Accordion.Control>
            </Paper>
            <Accordion.Panel>
              <Stack spacing="xl" mt="lg">
                {formSection.slice(2).map((section, idx) => {
                  return (
                    <RequestSection
                      key={section.section_id + idx}
                      section={section}
                      isFormslyForm={true}
                      isOnlyWithResponse
                      index={idx + 1}
                    />
                  );
                })}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {!isPureLiquidation &&
          formSection.filter(
            (section) => section.section_name === "Payment"
          )[0] && (
            <RequestSection
              section={
                formSection.filter(
                  (section) => section.section_name === "Payment"
                )[0]
              }
              isFormslyForm={true}
              isOnlyWithResponse
            />
          )}

        {formSection.length > 0 && (
          <LiquidationReimbursementSummary
            summaryData={formSection
              .slice(2)
              .sort((a, b) =>
                `${a.section_field[0].field_response?.request_response}` >
                `${b.section_field[0].field_response?.request_response}`
                  ? 1
                  : `${b.section_field[0].field_response?.request_response}` >
                    `${a.section_field[0].field_response?.request_response}`
                  ? -1
                  : 0
              )}
          />
        )}

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
            onCreateJiraTicket={
              isBOQNotRequired ? onCreateJiraTicket : undefined
            }
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

export default LiquidationReimbursementRequestPage;
