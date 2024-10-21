import { getSectionInRequestPage } from "@/backend/api/get";
import { createRequest, insertError } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { Database } from "@/utils/database";
import { isError, safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  ConnectedRequestFormProps,
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
  RequestWithResponseType,
} from "@/utils/types";
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";
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
  connectedRequest?: ConnectedRequestFormProps;
};

const CreateBillOfQuantityRequestPage = ({ form, connectedRequest }: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const requestorProfile = useUserProfile();

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

  const { setIsLoading } = useLoadingActions();
  const signerList = form.form_signer.map((signer) => ({
    ...signer,
    signer_action: signer.signer_action.toUpperCase(),
  }));

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember || !connectedRequest) return;

      setIsLoading(true);

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId,
        teamMemberId: teamMember.team_member_id,
        signers: signerList,
        teamId: teamMember.team_member_team_id,
        requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
        formName: form.form_name,
        isFormslyForm: true,
        projectId: connectedRequest.request_project_id,
        teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
        userId: requestorProfile.user_id,
      });

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/requests/${
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
            error_function: "handleCreateRequest",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchFormSections = async () => {
      setIsLoading(true);
      try {
        if (!activeTeam.team_id) return;
        if (!connectedRequest) {
          await router.push(
            `/${formatTeamNameToUrlKey(activeTeam.team_name)}/requests`
          );
          return;
        }

        const supplierNameFieldId =
          form.form_section[1].section_field[0].field_id;
        const typeOfRequestFieldId =
          form.form_section[1].section_field[1].field_id;
        const invoiceAmountFieldId =
          form.form_section[1].section_field[2].field_id;
        const vatFieldId = form.form_section[1].section_field[3].field_id;
        const costFieldId = form.form_section[1].section_field[4].field_id;

        const { duplicatableSectionIdList } = connectedRequest;
        const sortedDuplicatableSectionIdList = duplicatableSectionIdList
          .sort()
          .reverse();

        const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        let index = 0;
        while (1) {
          setIsLoading(true);
          const duplicatableSectionIdCondition = sortedDuplicatableSectionIdList
            .slice(index, index + 5)
            .map((dupId) => `'${dupId}'`)
            .join(",");

          const data = await getSectionInRequestPage(supabaseClient, {
            index,
            requestId: connectedRequest.request_id,
            sectionId: connectedRequest.form_section[0],
            duplicatableSectionIdCondition:
              duplicatableSectionIdCondition.length !== 0
                ? duplicatableSectionIdCondition
                : `'${uuidv4()}'`,
          });
          newFields.push(...data);
          index += 5;

          if (index >= duplicatableSectionIdList.length) break;
        }

        const filteredNewFields = newFields.filter((field) =>
          [
            "Supplier Name/Payee",
            "Type of Request",
            "Invoice Amount",
            "VAT",
            "Cost",
          ].includes(field.field_name)
        );

        const uniqueFieldIdList: string[] = [];
        const combinedFieldList: RequestWithResponseType["request_form"]["form_section"][1]["section_field"] =
          [];

        filteredNewFields.forEach((field) => {
          if (uniqueFieldIdList.includes(field.field_id)) {
            const currentFieldIndex = combinedFieldList.findIndex(
              (combinedField) => combinedField.field_name === field.field_name
            );
            combinedFieldList[currentFieldIndex].field_response.push(
              ...field.field_response
            );
          } else {
            uniqueFieldIdList.push(field.field_id);
            switch (field.field_name) {
              case "Supplier Name/Payee":
                field.field_order = 1;
                field.field_is_read_only = true;
                field.field_id = supplierNameFieldId;
                break;
              case "Type of Request":
                field.field_order = 2;
                field.field_is_read_only = true;
                field.field_id = typeOfRequestFieldId;
                break;

              case "Invoice Amount":
                field.field_order = 3;
                field.field_is_read_only = true;
                field.field_id = invoiceAmountFieldId;
                break;

              case "VAT":
                field.field_order = 4;
                field.field_id = vatFieldId;
                field.field_is_required = false;
                break;

              case "Cost":
                field.field_order = 5;
                field.field_id = costFieldId;
                break;

              default:
                break;
            }
            combinedFieldList.push(field);
          }
        });

        const boqFieldList = [
          ...form.form_section[1].section_field.slice(5, 8).map((field) => ({
            ...field,
            field_response: [
              {
                request_response: "",
                request_response_duplicatable_section_id: "",
                request_response_field_id: field.field_id,
                request_response_id: "",
                request_response_prefix: "",
                request_response_request_id: "",
              },
            ],
          })),
          ...combinedFieldList,
        ];

        const newSection = generateSectionWithDuplicateList([
          {
            ...form.form_section[1],
            section_field: boqFieldList,
          },
        ]);

        const formattedSection = newSection
          .slice(1)
          .map((section) => {
            let sectionOrder = section.section_order;
            let connectedRequestSectionIndex = 0;
            const sectionDuplicatableId = uuidv4();

            const connectedRequestSectionDuplicatableId =
              section.section_field[2].field_response
                ?.request_response_duplicatable_section_id;

            if (connectedRequestSectionDuplicatableId) {
              connectedRequestSectionIndex =
                sortedDuplicatableSectionIdList.findIndex(
                  (id) => id === connectedRequestSectionDuplicatableId
                );

              sectionOrder = connectedRequestSectionIndex + 1;
            } else {
              sectionOrder = 0;
            }

            const updatedFieldList = section.section_field
              .map((field) => {
                const fieldOption =
                  field.field_type === "DROPDOWN"
                    ? [
                        {
                          option_field_id: field.field_id,
                          option_id: uuidv4(),
                          option_order: 0,
                          option_value: safeParse(
                            `${field.field_response?.request_response}`
                          ),
                        },
                      ]
                    : [];

                if (sectionOrder > 0) {
                  field.field_section_duplicatable_id =
                    connectedRequestSectionDuplicatableId ??
                    sectionDuplicatableId;
                }

                return {
                  ...field,
                  field_option: fieldOption,
                  field_response: safeParse(
                    `${field.field_response?.request_response ?? ""}`
                  ),
                };
              })
              .sort((a, b) => a.field_order - b.field_order);

            return {
              ...section,
              section_order: sectionOrder,
              section_form_id: formId,
              section_field: updatedFieldList,
              section_duplicatable_id: sectionDuplicatableId,
            };
          })
          .sort((a, b) => a.section_order - b.section_order);

        replaceSection([
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: connectedRequest.request_id,
              },
            ],
          },
          ...formattedSection,
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
    fetchFormSections();
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

export default CreateBillOfQuantityRequestPage;
