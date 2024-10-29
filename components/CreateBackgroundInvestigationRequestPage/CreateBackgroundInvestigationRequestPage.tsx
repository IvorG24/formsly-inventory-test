import {
  getBackgroundCheckData,
  getUserCurrentSignature,
} from "@/backend/api/get";
import { createRequest, insertError } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { BASE_URL } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError, setFileInputFromUrl } from "@/utils/functions";
import { formatTeamNameToUrlKey, startCase } from "@/utils/string";
import {
  BackgroundCheckTableRow,
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
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
import { v4 as uuidv4 } from "uuid";
import { EmailNotificationTemplateProps } from "../Resend/EmailNotificationTemplate";

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

const CreateBackgroundInvestigationRequestPage = ({ form }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const requestorProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const [backgroundCheckData, setBackgroundCheckData] = useState<
    | (BackgroundCheckTableRow & {
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
          !router.query.backgroundCheckId ||
          typeof router.query.backgroundCheckId !== "string"
        )
          throw new Error("Invalid Request ID");

        const data = await getBackgroundCheckData(supabaseClient, {
          backgroundCheckId: router.query.backgroundCheckId,
        });
        setBackgroundCheckData({
          ...data.backgroundCheckData,
          email: data.email,
        });

        if (
          teamMember?.team_member_id !==
          data.backgroundCheckData.background_check_team_member_id
        ) {
          notifications.show({
            message: "You are not the assigned evaluator.",
            color: "orange",
          });
          await router.push("/");
        }

        if (data.backgroundCheckData.background_check_status !== "PENDING") {
          notifications.show({
            message: "Applicant is already evaluated",
            color: "orange",
          });
          await router.push("/");
        }

        let fileData = "";
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
        if (!requestorProfile.user_signature_attachment_id) {
          notifications.show({
            title: "Signature is required",
            message: (
              <Text>
                Go to{" "}
                <Link href={`${BASE_URL}/user/settings`}>User Settings</Link> to
                update your Signature.
              </Text>
            ),
            color: "blue",
            autoClose: false,
          });
        } else {
          const signatureData = await getUserCurrentSignature(supabaseClient, {
            userId: requestorProfile.user_id,
          });
          fileData = (await setFileInputFromUrl(
            signatureData
          )) as unknown as string;
        }

        replaceSection([
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: [
                  data.candidateFirstName,
                  data.candidateMiddleName,
                  data.candidateLastName,
                ].join(" "),
              },
              {
                ...form.form_section[0].section_field[1],
                field_response: data.position,
                field_option: [
                  {
                    option_id: uuidv4(),
                    option_field_id:
                      form.form_section[0].section_field[1].field_id,
                    option_order: 1,
                    option_value: data.position,
                  },
                ],
              },
              ...form.form_section[0].section_field.slice(2),
            ],
          },
          form.form_section[1],
          {
            ...form.form_section[2],
            section_field: [
              {
                ...form.form_section[2].section_field[0],
                field_response: requestorProfile.user_first_name,
              },
              {
                ...form.form_section[2].section_field[1],
                field_response: requestorProfile.user_last_name,
              },
              {
                ...form.form_section[2].section_field[2],
                field_response: fileData,
              },
              {
                ...form.form_section[2].section_field[3],
                field_response: requestorProfile.user_job_title,
              },
              ...form.form_section[2].section_field.slice(4),
            ],
          },
          ...form.form_section.slice(3),
        ]);
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof router.query.backgroundCheckId === "string" && teamMember) {
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

      if (!requestorProfile || !teamMember || !backgroundCheckData) return;

      const backgroundCheckStatus = data.sections[5].section_field[0]
        .field_response as string;

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
        backgroundCheckParams: {
          status: backgroundCheckStatus.toUpperCase(),
          teamMemberId:
            backgroundCheckData?.background_check_team_member_id as string,
          data: {
            ...backgroundCheckData,
            hr_request_reference_id:
              backgroundCheckData.background_check_request_id,
            application_information_email: backgroundCheckData.email,
            application_information_request_id:
              backgroundCheckData.request_formsly_id,
            position: data.sections[0].section_field[1]
              .field_response as string,
          },
          backgroundCheckId: backgroundCheckData.background_check_id,
        },
      });

      if (backgroundCheckStatus.toUpperCase() === "NOT QUALIFIED") {
        const emailNotificationProps: {
          to: string;
          subject: string;
        } & EmailNotificationTemplateProps = {
          to: backgroundCheckData.email,
          subject: `Application Status | Sta. Clara International Corporation`,
          greetingPhrase: `Dear ${startCase(
            data.sections[0].section_field[0].field_response as string
          )},`,
          message: `
                    <p>
                     We sincerely appreciate your interest in joining Sta. Clara International Corporation under the Application ID: ${backgroundCheckData.request_formsly_id}
                    </p>
                    <p>
                      After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
                    </p>
                    <p>
                      We wish you success in your future professional endeavors.
                    </p>
                `,
          closingPhrase: "Best regards,",
          signature: "Sta. Clara International Corporation Recruitment Team",
        };
        await fetch("/api/resend/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailNotificationProps),
        });
      }

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

export default CreateBackgroundInvestigationRequestPage;
