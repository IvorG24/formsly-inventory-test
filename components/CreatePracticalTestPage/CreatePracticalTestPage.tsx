import {
  getPracticalTestAutomaticResponse,
  getPracticalTestFieldList,
} from "@/backend/api/get";
import { createRequest, insertError } from "@/backend/api/post";
import { updateTradeTestStatus } from "@/backend/api/update";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
  TradeTestSpreadsheetData,
  TradeTestTableRow,
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
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
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

const CreatePracticalTestPage = ({ form }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const requestorProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const [passingScore, setPassingScore] = useState(0);

  const [tradeTestData, setTradeTestData] = useState<
    | (TradeTestTableRow & {
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
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
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
          !router.query.practicalTestId ||
          typeof router.query.practicalTestId !== "string"
        )
          throw new Error("Invalid Request ID");

        if (teamMember?.team_member_id !== router.query.teamMemberId) {
          notifications.show({
            message: "You are not the assigned evaluator.",
            color: "orange",
          });
          await router.push("/");
        }

        const data = await getPracticalTestAutomaticResponse(supabaseClient, {
          practicalTestId: router.query.practicalTestId,
        });

        setTradeTestData({
          ...data.tradeTestData,
          email: data.email,
        });

        if (data.tradeTestData.trade_test_status !== "PENDING") {
          notifications.show({
            message: "Applicant is already evaluated",
            color: "orange",
          });
          await router.push("/");
        }
        if (!data.tradeTestData.trade_test_schedule)
          throw new Error("Missing schedule");
        const schedule = new Date(data.tradeTestData.trade_test_schedule);
        const formattedTime = schedule.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Ensure 24-hour format
        });

        const quantitativeFields = await getPracticalTestFieldList(
          supabaseClient,
          { position: data.position }
        );

        const applicantSectionFieldList = [
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
        ];

        if (!quantitativeFields) {
          notifications.show({
            color: "orange",
            message:
              "A Practical Test has not yet been assigned to the selected position. Please contact an HR Admin to request that a practical test be assigned.",
            autoClose: false,
          });
          replaceSection([
            {
              ...form.form_section[0],
              section_field: applicantSectionFieldList,
            },
            ...form.form_section.slice(1),
          ]);
          return;
        }
        setPassingScore(quantitativeFields.practical_test_passing_score);

        replaceSection([
          {
            ...form.form_section[0],
            section_field: applicantSectionFieldList,
          },
          form.form_section[1],
          {
            ...form.form_section[2],
            section_field: quantitativeFields.practicalTestQuestionList.map(
              (fieldQuestion) => {
                return {
                  ...fieldQuestion,
                  field_option: [],
                };
              }
            ),
          },
          {
            ...form.form_section[3],
            section_field: [
              {
                ...form.form_section[3].section_field[0],
                field_name: `${form.form_section[3].section_field[0].field_name} (Passing Score: ${quantitativeFields.practical_test_passing_score})`,
              },
              form.form_section[3].section_field[1],
            ],
          },
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

      if (!requestorProfile || !teamMember || !tradeTestData) return;

      const interviewStatus = data.sections[3].section_field[1].field_response;

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
        tradeTestParams: {
          status: (interviewStatus as string).toUpperCase(),
          teamMemberId: tradeTestData.trade_test_team_member_id as string,
          data: {
            ...tradeTestData,
            hr_request_reference_id: tradeTestData.trade_test_request_id,
            application_information_email: tradeTestData.email,
            application_information_request_id:
              tradeTestData.request_formsly_id,
            position: data.sections[0].section_field[3]
              .field_response as string,
          },
          tradeTestId: tradeTestData.trade_test_id,
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

  const handleScoreChange = () => {
    let totalScore = 0;
    let status = "NOT QUALIFIED";

    getValues("sections.2.section_field").forEach(
      (field) =>
        (totalScore += field.field_response ? Number(field.field_response) : 0)
    );
    if (totalScore >= passingScore) status = "QUALIFIED";

    setValue("sections.3.section_field.0.field_response", totalScore);
    setValue("sections.3.section_field.1.field_response", status);
  };

  const handleNotResponsive = async () => {
    try {
      setIsLoading(true);
      if (!requestorProfile || !teamMember || !tradeTestData) return;
      const positionData = getValues(
        "sections.0.section_field.3.field_response"
      );

      await updateTradeTestStatus(supabaseClient, {
        status: "NOT RESPONSIVE",
        teamMemberId: teamMember.team_member_id,
        data: {
          hr_request_reference_id: tradeTestData.trade_test_request_id,
          application_information_email: tradeTestData.email,
          application_information_request_id: tradeTestData.request_formsly_id,
          position: positionData as string,
        } as TradeTestSpreadsheetData,
      });
      notifications.show({
        message: "Trade test status updated.",
        color: "green",
      });
      await router.push(`/`);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPromptNotResponsiveModal = () =>
    modals.openConfirmModal({
      title: "Are you sure the applicant is not responsive?",
      children: (
        <Text size="sm">
          This action is so important that you are required to confirm it with a
          modal. Please click one of these buttons to proceed.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "gray" },
      onConfirm: async () => await handleNotResponsive(),
    });

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
                    practicalTestFormMethods={{
                      onScoreChange: handleScoreChange,
                    }}
                  />
                </Box>
              );
            })}
            {/* <RequestFormSigner signerList={signerList} /> */}
            <Stack spacing="xs">
              <Button color="gray" onClick={openPromptNotResponsiveModal}>
                Not Responsive
              </Button>
              <Button type="submit">Submit</Button>
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreatePracticalTestPage;
