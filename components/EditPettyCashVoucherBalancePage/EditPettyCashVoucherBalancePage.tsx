import {
  checkIfUserIsRequestOwner,
  getNonDuplictableSectionResponse,
} from "@/backend/api/get";
import {
  createComment,
  createRequest,
  editRequest,
  insertError,
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
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
  RequestTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Flex,
  Space,
  Stack,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

export type Section = FormWithResponseType["form_section"][0];
export type Field = FormType["form_section"][0]["section_field"][0];

export type RequestFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray = Field & {
  field_response: RequestResponseTableRow[];
};

type Props = {
  form: FormType;
  requestId: string;
};

const EditPettyCashVoucherBalanceRequestPage = ({ form, requestId }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const userProfile = useUserProfile();
  const teamMemberGroupList = useUserTeamMemberGroupList();
  const team = useActiveTeam();
  const isUserCostEngineer = teamMemberGroupList.includes("COST ENGINEER");
  const isReferenceOnly = Boolean(router.query.referenceOnly);

  const [initialRequestDetails, setInitialRequestDetails] =
    useState<RequestFormValues>();
  const signerList = form.form_signer.map((signer) => ({
    ...signer,
    signer_action: signer.signer_action.toUpperCase(),
  }));
  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
    form_type: form.form_type,
    form_sub_type: form.form_sub_type,
  };

  const requestFormMethods = useForm<RequestFormValues>({ mode: "onChange" });
  const { handleSubmit, control, unregister } = requestFormMethods;
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });
  const [oldBoqCodeValue, setOldBoqCodeValue] = useState("TBA");
  const [oldCostCodeValue, setOldCostCodeValue] = useState("TBA");

  const onSubmit = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      const additionalSignerList: FormType["form_signer"] = [];

      let request: RequestTableRow;
      if (isReferenceOnly) {
        const response = data.sections[1].section_field[0]
          .field_response as string;

        const projectId = data.sections[1].section_field[0].field_option.find(
          (option) => option.option_value === response
        )?.option_id as string;

        request = await createRequest(supabaseClient, {
          requestFormValues: data,
          formId: form.form_id,
          teamMemberId: teamMember.team_member_id,
          signers: [...signerList, ...additionalSignerList],
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          isFormslyForm: true,
          projectId,
          teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
          userId: requestorProfile.user_id,
        });
      } else {
        request = await editRequest(supabaseClient, {
          requestId,
          requestFormValues: data,
          signers: [...signerList, ...additionalSignerList],
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
          userId: requestorProfile.user_id,
        });

        // add comment
        if (isUserCostEngineer && data.sections[2]) {
          const newBoqCodeFieldValue = safeParse(
            `${data.sections[2].section_field[0].field_response}`
          );
          const newcostCodeFieldValue = safeParse(
            `${data.sections[2].section_field[1].field_response}`
          );
          await createComment(supabaseClient, {
            comment_request_id: requestId,
            comment_team_member_id: teamMember.team_member_id,
            comment_type: "REQUEST_COMMENT",
            comment_content: `${userProfile?.user_first_name} ${userProfile?.user_last_name} updated the request cost code section. BOQ Code (old) ${oldBoqCodeValue} => (new) ${newBoqCodeFieldValue}. Cost Code (old) ${oldCostCodeValue} => (new) ${newcostCodeFieldValue}`,
            comment_id: uuidv4(),
          });
        }
      }

      notifications.show({
        message: `Request ${isReferenceOnly ? "created" : "edited"}.`,
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/requests/${
          request.request_formsly_id_prefix
        }-${request.request_formsly_id_serial}`
      );
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
            error_function: "onSubmit",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = () => {
    unregister(`sections.${0}`);
    replaceSection(initialRequestDetails ? initialRequestDetails.sections : []);
  };

  useEffect(() => {
    setIsLoading(true);
    if (!team.team_id || !teamMember) return;
    try {
      if (!teamMember) return;
      const fetchRequestDetails = async () => {
        const isOwner = await checkIfUserIsRequestOwner(supabaseClient, {
          requestId,
          teamMemberId: teamMember.team_member_id,
        });

        const formSectionResponseList = await getNonDuplictableSectionResponse(
          supabaseClient,
          {
            requestId,
            fieldIdList: form.form_section.flatMap((section) =>
              section.section_field.map((field) => field.field_id)
            ),
          }
        );

        const formSectionWithResponse = form.form_section.map((section) => {
          const fieldWithResponseList = section.section_field.map((field) => {
            const response = formSectionResponseList.find(
              (response) =>
                response.request_response_field_id === field.field_id
            );
            const field_option = field.field_option ?? [];

            return {
              ...field,
              field_response: response
                ? safeParse(response.request_response)
                : "",
              field_option,
              field_is_read_only: true,
            };
          });

          return {
            ...section,
            section_field: fieldWithResponseList,
          };
        });

        let balanceSection = formSectionWithResponse[1];
        let costCodeSection = formSectionWithResponse[2];
        const withCostCode =
          costCodeSection.section_field[0].field_response !== "";

        if (isOwner) {
          const updatedSectionField = balanceSection.section_field.map(
            (field) => ({ ...field, field_is_read_only: false })
          );

          balanceSection = {
            ...balanceSection,
            section_field: updatedSectionField,
          };
        }

        if (isUserCostEngineer && withCostCode) {
          const updatedSectionField = costCodeSection.section_field.map(
            (field) => ({ ...field, field_is_read_only: false })
          );

          costCodeSection = {
            ...costCodeSection,
            section_field: updatedSectionField,
          };

          setOldBoqCodeValue(
            safeParse(costCodeSection.section_field[0].field_response)
          );
          setOldCostCodeValue(
            safeParse(costCodeSection.section_field[1].field_response)
          );
        }

        if (withCostCode) {
          replaceSection([
            formSectionWithResponse[0],
            balanceSection,
            costCodeSection,
          ]);
        } else {
          replaceSection([formSectionWithResponse[0], balanceSection]);
        }

        setInitialRequestDetails({ sections: formSectionWithResponse });
      };
      fetchRequestDetails();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, [team, teamMember]);

  return (
    <Container>
      <Title order={2} color="dimmed">
        {isReferenceOnly ? "Create" : "Edit"} Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                    isEdit={!isReferenceOnly}
                  />
                </Box>
              );
            })}
            <RequestFormSigner signerList={signerList} />
            <Flex direction="column" gap="sm">
              <Button
                variant="outline"
                color="red"
                onClick={handleResetRequest}
              >
                Reset
              </Button>
              <Button type="submit">Submit</Button>
            </Flex>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default EditPettyCashVoucherBalanceRequestPage;
