import { getRequestFieldResponse } from "@/backend/api/get";
import {
  createRequest,
  insertError,
  sendNotificationToCostEngineer,
} from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserProfile,
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { isError, safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  ConnectedRequestFormProps,
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
} from "@/utils/types";
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

export type Section = FormWithResponseType["form_section"][0];
export type Field = FormType["form_section"][0]["section_field"][0];

export type FieldWithResponseArray = Field & {
  field_response: RequestResponseTableRow[];
};

type RequestFormValues = {
  sections: Section[];
};

type Props = {
  form: FormType;
  connectedRequest?: ConnectedRequestFormProps;
};

const CreatePettyCashVoucherBalancePage = ({
  form,
  connectedRequest,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const teamMemberGroupList = useUserTeamMemberGroupList();

  const [requireCostEngineer, setRequireCostEngineer] = useState(false);

  const requestorProfile = useUserProfile();

  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>({
    mode: "onChange",
  });
  const { handleSubmit, control } = requestFormMethods;
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });

  const signerList = form.form_signer.map((signer) => ({
    ...signer,
    signer_action: signer.signer_action.toUpperCase(),
  }));

  const isUserCostEngineer = teamMemberGroupList.includes("COST ENGINEER");

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile) return;
      if (!teamMember || !connectedRequest) return;

      setIsLoading(true);
      const requesterName = `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`;
      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId,
        teamMemberId: teamMember.team_member_id,
        signers: signerList,
        teamId: teamMember.team_member_team_id,
        requesterName,
        formName: form.form_name,
        isFormslyForm: true,
        projectId: connectedRequest.request_project_id,
        teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
        userId: requestorProfile.user_id,
      });

      const redirectUrl = `/${formatTeamNameToUrlKey(
        activeTeam.team_name ?? ""
      )}/requests/${request.request_formsly_id_prefix}-${
        request.request_formsly_id_serial
      }`;

      if (requireCostEngineer) {
        await sendNotificationToCostEngineer(supabaseClient, {
          projectId: connectedRequest.request_project_id,
          requesterName,
          redirectUrl,
          teamId: teamMember.team_member_team_id,
        });
      }

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      await router.push(redirectUrl);
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
            error_function: "handleCreateRequest",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (!activeTeam.team_id) return;
        if (!connectedRequest) {
          await router.push(
            `/${formatTeamNameToUrlKey(activeTeam.team_name)}/requests`
          );
          return;
        }

        const requestingDepartmentFieldId =
          "694465de-8aa9-4361-be52-f8c091c13fde";
        const chargeToBooleanFieldId = "9cde1e79-646d-4a9f-9e76-3a6494bff6e2";

        const fieldResponseList = await getRequestFieldResponse(
          supabaseClient,
          {
            requestId: connectedRequest.request_id,
            fieldId: [requestingDepartmentFieldId, chargeToBooleanFieldId],
          }
        );

        const isPed =
          safeParse(fieldResponseList[0].request_response) ===
          "Plants and Equipment";

        const isChargeToProject = safeParse(
          fieldResponseList[1] ? fieldResponseList[1].request_response : ""
        );

        setRequireCostEngineer(isPed && isChargeToProject);

        const formSectionList = [
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: connectedRequest.request_id,
                field_is_read_only: true,
              },
            ],
          },
          {
            ...form.form_section[1],
          },
        ];

        if (isPed && isChargeToProject) {
          formSectionList.push({
            ...form.form_section[2],
            section_name: `${form.form_section[2].section_name} - To be filled by Cost Engineer`,
            section_field: form.form_section[2].section_field.map((field) => ({
              ...field,
              field_is_read_only: !isUserCostEngineer,
              field_response: "TBA",
            })),
          });
        }
        replaceSection(formSectionList);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, [activeTeam]);

  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
          <Stack spacing="xl">
            <RequestFormDetails formDetails={formDetails} />
            {formSections.map((section, idx) => {
              return (
                <Box key={section.id}>
                  <RequestFormSection
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                    formslyFormName={form.form_name}
                  />
                </Box>
              );
            })}
            <RequestFormSigner signerList={signerList} />
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreatePettyCashVoucherBalancePage;
