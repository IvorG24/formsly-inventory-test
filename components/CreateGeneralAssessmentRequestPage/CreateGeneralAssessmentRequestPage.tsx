import { checkAssessmentCreateRequestPage } from "@/backend/api/get";
import { createRequest, insertError } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { Database } from "@/utils/database";
import { isError, safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey, startCase } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
} from "@/utils/types";
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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

const CreateGeneralAssessmentRequestPage = ({ form }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const user = useUser();

  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };
  // const signerList = form.form_signer.map((signer) => ({
  //   ...signer,
  //   signer_action: signer.signer_action.toUpperCase(),
  // }));

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control } = requestFormMethods;
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    const checkIfAlreadyAnswered = async () => {
      try {
        setIsLoading(true);

        const formattedField = form.form_section[0]
          .section_field[0] as FormType["form_section"][0]["section_field"][0] & {
          field_response: string;
        };

        const isAlreadyExists = await checkAssessmentCreateRequestPage(
          supabaseClient,
          {
            fieldAndResponse: [
              {
                fieldId: formattedField.field_id,
                response: formattedField.field_response,
              },
            ],
          }
        );
        if (isAlreadyExists) {
          notifications.show({
            message: "General Assessment already exists",
            color: "orange",
          });
          await router.push("/");
        }
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    checkIfAlreadyAnswered();
  }, [form.form_section]);

  useEffect(() => {
    replaceSection(form.form_section);
  }, [form, replaceSection, requestFormMethods]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      setIsLoading(true);

      let requestScore = 0;
      let status = "REJECTED";
      data.sections.forEach((section) => {
        section.section_field.forEach((field) => {
          if (
            field.field_response ===
            field.field_correct_response?.correct_response_value
          ) {
            requestScore += 1;
          }
        });
      });
      if (requestScore >= 5) status = "APPROVED";

      if (status === "APPROVED") {
        const applicantSection = data.sections.find(
          (section) => section.section_name === "Applicant"
        );
        const emailAddress = safeParse(
          applicantSection?.section_field[0].field_response as string
        );
        const firstName = safeParse(
          applicantSection?.section_field[1].field_response as string
        );
        const lastName = safeParse(
          applicantSection?.section_field[3].field_response as string
        );

        const applicantInformationIdSection = data.sections.find(
          (section) => section.section_name === "ID"
        );
        const applicantInformationId = safeParse(
          applicantInformationIdSection?.section_field[0]
            .field_response as string
        );

        const requestLink = `${process.env.NEXT_PUBLIC_SITE_URL}/user/application-progress/${applicantInformationId}`;

        const emailNotificationProps: {
          to: string;
          subject: string;
        } & EmailNotificationTemplateProps = {
          to: emailAddress,
          subject: `General Assessment | Sta. Clara International Corporation`,
          greetingPhrase: `Dear ${startCase(firstName)} ${startCase(
            lastName
          )},`,
          message: `
              <p>
                We are pleased to inform you that you have successfully
                completed and passed the <strong>General Assessment</strong>.
                You may now proceed to the Technical Assessment by clicking the
                link below.
              </p>
              <p>
                <a href=${requestLink}>${requestLink}</a>
              </p>
              <p>
                If you need any assistance, feel free to contact us at
                recruitment@staclara.com.ph.
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

      const rootFormslyRequestId = data.sections[0].section_field[0]
        .field_response as string;

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId: form.form_id,
        signers: form.form_signer,
        teamId: "a5a28977-6956-45c1-a624-b9e90911502e",
        requesterName: data.sections[1].section_field
          .slice(1, 4)
          .map((field) => field.field_response)
          .join(" "),
        formName: form.form_name,
        isFormslyForm: true,
        projectId: "",
        teamName: formatTeamNameToUrlKey(
          process.env.NODE_ENV === "production" ? "SCIC" : "Sta Clara"
        ),
        status,
        requestScore,
        rootFormslyRequestId,
        userId: user?.id ?? "",
        applicationInformationFormslyId: data.sections[0].section_field[0]
          .field_response as string,
      });
      notifications.show({
        message: "Request created.",
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

export default CreateGeneralAssessmentRequestPage;
