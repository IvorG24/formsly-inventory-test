import { getEvaluationResultAutomaticResponse } from "@/backend/api/get";
import { createRequest, insertError } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { BASE_URL } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
  TechnicalInterviewTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

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
};

const CreateEvaluationResultRequestPage = ({ form }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const requestorProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const [interviewData, setInterviewData] = useState<
    | (TechnicalInterviewTableRow & {
        request_formsly_id: string;
        email: string;
      })
    | null
  >(null);

  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control } = requestFormMethods;
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    const fetchAutomaticResponse = async () => {
      setIsLoading(true);
      if (!requestorProfile) return;
      try {
        if (
          !router.query.interviewId ||
          typeof router.query.interviewId !== "string"
        )
          throw new Error("Invalid Request ID");

        if (teamMember?.team_member_id !== router.query.teamMemberId) {
          notifications.show({
            message: "You are not the assigned evaluator.",
            color: "orange",
          });
          await router.push("/");
        }

        const data = await getEvaluationResultAutomaticResponse(
          supabaseClient,
          {
            interviewId: router.query.interviewId,
          }
        );
        setInterviewData({
          ...data.interviewData,
          email: data.email,
        });

        if (data.interviewData.technical_interview_status !== "PENDING") {
          notifications.show({
            message: "Applicant is already evaluated",
            color: "orange",
          });
          await router.push("/");
        }
        if (!data.interviewData.technical_interview_schedule)
          throw new Error("Missing schedule");
        const schedule = new Date(
          data.interviewData.technical_interview_schedule
        );
        const formattedTime = schedule.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Ensure 24-hour format
        });

        replaceSection([
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: data.candidateFirstName,
              },
              {
                ...form.form_section[0].section_field[1],
                field_response: data.candidateMiddleName,
              },
              {
                ...form.form_section[0].section_field[2],
                field_response: data.candidateLastName,
              },
              {
                ...form.form_section[0].section_field[3],
                field_response: data.position,
              },
              {
                ...form.form_section[0].section_field[4],
                field_response: schedule,
              },
              {
                ...form.form_section[0].section_field[5],
                field_response: formattedTime,
              },
            ],
          },
          {
            ...form.form_section[1],
            section_field: [
              {
                ...form.form_section[1].section_field[0],
                field_response: requestorProfile.user_first_name,
              },
              {
                ...form.form_section[1].section_field[1],
                field_response: requestorProfile.user_last_name,
              },
              {
                ...form.form_section[1].section_field[2],
                field_response: requestorProfile.user_job_title,
              },
              ...form.form_section[1].section_field.slice(3),
            ],
          },
          ...form.form_section.slice(2),
        ]);

        if (!requestorProfile.user_job_title) {
          notifications.show({
            title: "Position is required",
            message: (
              <Text>
                Go to{" "}
                <Link href={`${BASE_URL}/user/settings`}>User Settings</Link> to
                update your Job Title.
              </Text>
            ),
            color: "blue",
            autoClose: false,
          });
        }
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof router.query.teamMemberId === "string" && teamMember) {
      fetchAutomaticResponse();
    }
  }, [
    requestorProfile,
    form,
    replaceSection,
    requestFormMethods,
    router,
    teamMember,
  ]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      setIsLoading(true);

      if (!requestorProfile || !teamMember || !interviewData) return;

      const interviewStatus = data.sections[2].section_field[3].field_response;

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId: form.form_id,
        teamMemberId: teamMember.team_member_id,
        signers: [],
        teamId: teamMember.team_member_team_id,
        requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
        formName: form.form_name,
        isFormslyForm: true,
        projectId: "",
        teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
        userId: requestorProfile.user_id,
        status: "APPROVED",
        interviewParams: {
          status: (interviewStatus as string).toUpperCase(),
          teamMemberId:
            interviewData.technical_interview_team_member_id as string,
          data: {
            ...interviewData,
            hr_request_reference_id:
              interviewData.technical_interview_request_id,
            application_information_email: interviewData.email,
            application_information_request_id:
              interviewData.request_formsly_id,
            position: data.sections[0].section_field[3]
              .field_response as string,
          },
          technicalInterviewNumber: interviewData.technical_interview_number,
          technicalInterviewId: interviewData.technical_interview_id,
        },
      });

      notifications.show({
        message: "Evaluation created.",
        color: "green",
      });

      await router.push(`/public-request/${request.request_id}`);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        const applicantSection = data.sections.find(
          (section) => section.section_name === "Applicant"
        );
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleCreateRequest",
            error_user_email: applicantSection?.section_field[0]
              .field_response as string,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Evaluation
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
                    isPublicRequest={true}
                  />
                </Box>
              );
            })}
            {/* <RequestFormSigner signerList={signerList} /> */}
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateEvaluationResultRequestPage;
