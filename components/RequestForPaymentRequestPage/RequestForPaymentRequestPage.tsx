import { deleteRequest } from "@/backend/api/delete";
import {
  getAllSection,
  getExistingConnectedRequest,
  getJiraAutomationDataByProjectId,
  getRequestComment,
  getSectionInRequestPageWithMultipleDuplicatableSection,
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
import { formatDate } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { createJiraTicket, formatJiraRFPPayload } from "@/utils/jira/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CommentType,
  DuplicateSectionType,
  FieldTableRow,
  JiraFormFieldChoice,
  ReceiverStatusType,
  RequestCommentType,
  RequestWithResponseType,
  SectionTableRow,
} from "@/utils/types";
import {
  Accordion,
  Button,
  Container,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import RequestCommentList from "../RequestPage/RequestCommentList";
import RequestForPaymentSummary from "../SummarySection/RequestForPaymentSummary";

type Props = {
  request: RequestWithResponseType;
  sectionIdWithDuplicatableSectionIdList: {
    request_response_duplicatable_section_id: string;
    section_id: string;
  }[];
};

const RequestForPaymentRequestPage = ({
  request,
  sectionIdWithDuplicatableSectionIdList,
}: Props) => {
  const forms = useFormList();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const { setIsLoading } = useLoadingActions();

  const initialRequestSignerList = request.request_signer.map((signer) => {
    return {
      ...signer.request_signer_signer,
      request_signer_status: signer.request_signer_status as ReceiverStatusType,
      request_signer_status_date_updated:
        signer.request_signer_status_date_updated,
      request_signer_id: signer.request_signer_id,
    };
  });

  const [jiraTicketStatus, setJiraTicketStatus] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState(request.request_status);
  const [signerList, setSignerList] = useState(initialRequestSignerList);
  const [requestCommentList, setRequestCommentList] = useState<
    RequestCommentType[]
  >([]);
  const [requestJira, setRequestJira] = useState({
    id: request.request_jira_id,
    link: request.request_jira_link,
  });
  const [uniqueSectionList, setUniqueSectionList] = useState<SectionTableRow[]>(
    []
  );

  const [formSection, setFormSection] = useState<DuplicateSectionType[]>([]);
  const [rfpCodeRedirectUrl, setRfpCodeRedirectUrl] = useState<string | null>(
    null
  );

  const teamMember = useUserTeamMember();
  const user = useUserProfile();
  const teamMemberGroupList = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();

  useEffect(() => {
    try {
      const fetchSections = async () => {
        const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        let index = 0;

        while (1) {
          const duplicatableSectionIdCondition =
            sectionIdWithDuplicatableSectionIdList
              .slice(index, index + 5)
              .map(
                (dupId) =>
                  `(${
                    dupId.request_response_duplicatable_section_id
                      ? `request_response_duplicatable_section_id = '${dupId.request_response_duplicatable_section_id}'`
                      : `request_response_duplicatable_section_id IS NULL`
                  } AND field_section_id = '${dupId.section_id}')`
              )
              .join(" OR ");

          const data =
            await getSectionInRequestPageWithMultipleDuplicatableSection(
              supabaseClient,
              {
                index,
                requestId: request.request_id,
                duplicatableSectionIdCondition,
              }
            );

          newFields.push(...data);
          index += 5;

          if (index >= sectionIdWithDuplicatableSectionIdList.length) break;
        }
        const uniqueSectionIdList: string[] = [];
        sectionIdWithDuplicatableSectionIdList.forEach((section) => {
          if (!uniqueSectionIdList.includes(section.section_id)) {
            uniqueSectionIdList.push(section.section_id);
          }
        });
        const sectionList = await getAllSection(supabaseClient, {
          sectionIdList: uniqueSectionIdList,
        });
        setUniqueSectionList(sectionList);

        const newSection = sectionIdWithDuplicatableSectionIdList.map(
          (section) => {
            const sectionMatch = sectionList.find(
              (thisSection) => thisSection.section_id === section.section_id
            );
            return {
              ...sectionMatch,
              section_duplicatable_section_id:
                section.request_response_duplicatable_section_id,
              section_field: [],
            };
          }
        ) as unknown as (DuplicateSectionType & {
          section_duplicatable_section_id: string;
        })[];

        newFields.forEach((field) => {
          const formattedField = field as unknown as FieldTableRow & {
            request_response_duplicatable_section_id: string | null;
          };
          const sectionIndex = newSection.findIndex(
            (section) =>
              section.section_id === field.field_section_id &&
              section.section_duplicatable_section_id ===
                formattedField.request_response_duplicatable_section_id
          );
          newSection[sectionIndex].section_field.push(
            field as unknown as DuplicateSectionType["section_field"][0]
          );
        });

        setFormSection(newSection);
        setIsLoading(false);
      };
      const fetchComments = async () => {
        const data = await getRequestComment(supabaseClient, {
          request_id: request.request_id,
        });
        setRequestCommentList(data);
      };
      fetchSections();
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
    const fetchRFPCodeRequest = async () => {
      // check if rfp code request exists
      const rfpCodeRequest = await getExistingConnectedRequest(supabaseClient, {
        parentRequestId: request.request_id,
        fieldId: "44edd3e4-9595-4b7c-a924-98b084346d36",
      });

      if (rfpCodeRequest) {
        const { request_formsly_id_prefix, request_formsly_id_serial } =
          rfpCodeRequest;
        const redirectUrl = `/${formatTeamNameToUrlKey(
          activeTeam.team_name
        )}/requests/${request_formsly_id_prefix}-${request_formsly_id_serial}`;
        setRfpCodeRedirectUrl(redirectUrl);
      }
    };
    if (requestStatus === "APPROVED" && activeTeam.team_name) {
      fetchRFPCodeRequest();
    }
  }, [requestStatus, activeTeam.team_name]);

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

  const openRedirectToRFPCodeRequestModal = (redirectUrl: string) =>
    modals.openConfirmModal({
      title: <Text weight={600}>RFP Code request already exists.</Text>,
      children: (
        <Text size="sm">
          Would you like to be redirected to the RFP Code request page?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      onConfirm: async () => await router.push(redirectUrl),
    });

  const handleCreateRFPCodeRequest = async () => {
    try {
      if (rfpCodeRedirectUrl) {
        openRedirectToRFPCodeRequestModal(rfpCodeRedirectUrl);
        return;
      }

      const rfpCodeForm = forms.find(
        (form) => form.form_name === "Request For Payment Code"
      );
      if (!rfpCodeForm) {
        notifications.show({
          message: "Request For Payment Code form is not available",
          color: "red",
        });
        return;
      }
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/forms/${
          rfpCodeForm.form_id
        }/create?rfp=${request.request_formsly_id}`
      );
    } catch (e) {
      notifications.show({
        message:
          "Failed to create RFP Code request. Please contact the IT team.",
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

  const onCreateJiraTicket = async () => {
    try {
      if (!request.request_project_id) {
        throw new Error("Project id is not defined.");
      }
      setIsLoading(true);

      let obTicket = "";
      let departmentCode = "";

      const isChargeToVariousDepartment =
        selectedChargeTo === "Various Department";
      const requestTypeId = isChargeToVariousDepartment ? "337" : "337";
      const serviceDeskId = isChargeToVariousDepartment ? "23" : "27";
      const payeeFieldId = isChargeToVariousDepartment ? "24" : "25";

      const [jiraAutomationData, automationFormResponse] = await Promise.all([
        getJiraAutomationDataByProjectId(supabaseClient, {
          teamProjectId: request.request_project_id,
        }),
        fetch(
          `/api/jira/get-form?serviceDeskId=${serviceDeskId}&requestType=${requestTypeId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        ),
      ]);

      if (!jiraAutomationData?.jiraProjectData || !automationFormResponse.ok) {
        throw new Error("Error fetching of jira automation data.");
      }

      const { fields } = await automationFormResponse.json();
      const urgencyList = fields["5"].choices;
      const payeeTypeList = fields[payeeFieldId].choices;
      const purposeList = fields["13"].choices;
      const chargeToList = fields["18"].choices;

      const headerSectionFieldList = formSection[0].section_field;
      const requestUrgency = headerSectionFieldList.find(
        (field) => field.field_name === "Urgency"
      )?.field_response?.request_response;
      const requestDepartment =
        headerSectionFieldList[1].field_response?.request_response;

      const requestDepartmentCode = headerSectionFieldList.find(
        (field) => field.field_name === "Department Code"
      );

      if (requestDepartmentCode?.field_response?.request_response) {
        departmentCode = safeParse(
          requestDepartmentCode.field_response.request_response
        );
      }

      const requestPayeeType = headerSectionFieldList.find(
        (field) => field.field_name === "Payee Type"
      )?.field_response?.request_response;
      const requestPurpose = formSection[1].section_field.find(
        (field) => field.field_name === "Purpose of Payment"
      )?.field_response?.request_response;

      if (safeParse(`${requestPurpose}`).toLowerCase() === "ob budget") {
        obTicket = safeParse(
          formSection.length
            ? formSection[1].section_field.find(
                (field) =>
                  field.field_name ===
                  "Ticket Number of Approved Official Business"
              )?.field_response?.request_response ?? ""
            : ""
        );
      }

      const costCode = safeParse(
        `${headerSectionFieldList[2].field_response?.request_response}`
      );
      const boqCode = safeParse(
        `${headerSectionFieldList[3].field_response?.request_response}`
      );

      const urgency = urgencyList.find(
        (item: JiraFormFieldChoice) =>
          item.name.trim().toLowerCase() ===
          safeParse(`${requestUrgency}`).toLowerCase()
      );
      const payeeType = payeeTypeList.find(
        (item: JiraFormFieldChoice) =>
          item.name.trim().toLowerCase() ===
          safeParse(`${requestPayeeType}`).toLowerCase()
      );
      const purpose = purposeList.find(
        (item: JiraFormFieldChoice) =>
          item.name.trim().toLowerCase() ===
          safeParse(`${requestPurpose}`).toLowerCase()
      );
      const chargeTo = chargeToList.find(
        (item: JiraFormFieldChoice) =>
          item.name.trim().toLowerCase() ===
          safeParse(`${selectedChargeTo}`).toLowerCase()
      );

      if (!urgency || !payeeType || !purpose || !chargeTo) {
        throw new Error("Missing data in jira payload");
      }

      const jiraTicketPayload = formatJiraRFPPayload({
        requestId: request.request_formsly_id,
        requestUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/public-request/${request.request_formsly_id}`,
        jiraProjectSiteId:
          jiraAutomationData.jiraProjectData.jira_project_jira_id,
        department: safeParse(`${requestDepartment}`),
        purpose: purpose.id,
        urgency: urgency.id,
        payeeType: payeeType.id,
        chargeTo: chargeTo.id,
        costCode,
        boqCode,
        departmentCode,
        obTicket,
      });

      const jiraTicket = await createJiraTicket({
        requestType: "Request for Payment Form",
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
    signerList
      .map((signer) => signer.request_signer_status)
      .filter((status) => status !== "PENDING").length === 0 &&
    isUserOwner &&
    requestStatus === "PENDING";
  const isCancelable = isUserOwner && requestStatus === "PENDING";
  const isDeletable = isUserOwner && requestStatus === "CANCELED";
  const isUserRequester = teamMemberGroupList.includes("REQUESTER");
  const isUserCostEngineer = teamMemberGroupList.includes("COST ENGINEER");
  const selectedDepartment = safeParse(
    request.request_form.form_section[0].section_field[1].field_response[0]
      .request_response
  );
  const selectedChargeTo = safeParse(
    formSection.length
      ? formSection[1].section_field.find(
          (field) => field.field_name === "Charge To"
        )?.field_response?.request_response ?? ""
      : ""
  );

  const canCreateRFPCode =
    requestStatus === "APPROVED" &&
    isUserCostEngineer &&
    !["PED", "Plants and Equipment"].includes(selectedDepartment) &&
    selectedChargeTo === "Project";

  const isRequestActionSectionVisible =
    canSignerTakeAction || isEditable || isDeletable || isUserRequester;

  return (
    <Container>
      <Flex justify="space-between" rowGap="xs" wrap="wrap">
        <Title order={2} color="dimmed">
          Request
        </Title>
        {canCreateRFPCode && (
          <Button onClick={() => handleCreateRFPCodeRequest()}>
            Create RFP Code
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

        {formSection.length ? (
          <>
            {uniqueSectionList.map((section, idx) => {
              if (!section.section_is_duplicatable) {
                const sectionMatch = formSection.find(
                  (thisSection) => thisSection.section_id === section.section_id
                );
                return (
                  sectionMatch && (
                    <RequestSection
                      key={section.section_id}
                      section={sectionMatch}
                      isFormslyForm={true}
                      isOnlyWithResponse
                      index={idx + 1}
                    />
                  )
                );
              } else {
                const sectionMatch = formSection.filter(
                  (thisSection) => thisSection.section_id === section.section_id
                );

                return (
                  <Accordion key={section.section_id}>
                    <Accordion.Item
                      key={section.section_name}
                      value={section.section_name}
                    >
                      <Paper shadow="xs">
                        <Accordion.Control>
                          <Title order={4} color="dimmed">
                            {section.section_name}
                          </Title>
                        </Accordion.Control>
                      </Paper>
                      <Accordion.Panel>
                        <Stack spacing="xl" mt="lg">
                          {sectionMatch.map((section, sectionIndex) => {
                            return (
                              sectionMatch && (
                                <RequestSection
                                  key={section.section_id + sectionIndex}
                                  section={section}
                                  isFormslyForm={true}
                                  isOnlyWithResponse
                                  index={sectionIndex + 1}
                                />
                              )
                            );
                          })}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                );
              }
            })}
          </>
        ) : null}

        {formSection.length > 3 && (
          <RequestForPaymentSummary
            summaryData={formSection.filter(
              (section) => section.section_name === "Request"
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
            isEditable={false}
            isCancelable={isCancelable}
            canSignerTakeAction={canSignerTakeAction}
            isDeletable={isDeletable}
            isUserRequester={isUserRequester}
            requestId={request.request_id}
            isItemForm
            onCreateJiraTicket={
              ["Plants and Equipment", "PED"].includes(selectedDepartment) ||
              selectedChargeTo === "Various Department"
                ? onCreateJiraTicket
                : undefined
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

export default RequestForPaymentRequestPage;
