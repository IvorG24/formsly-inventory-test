import {
  getCurrencyOptionList,
  getNonDuplictableSectionResponse,
  getSectionInRequestPage,
} from "@/backend/api/get";
import { createRequest, editRequest } from "@/backend/api/post";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  OptionTableRow,
  RequestResponseTableRow,
  RequestTableRow,
  RequestWithResponseType,
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
import RequestFormDetails from "../CreateRequestPage/RequestFormDetails";
import RequestFormSection from "../CreateRequestPage/RequestFormSection";
import RequestFormSigner from "../CreateRequestPage/RequestFormSigner";
import InvalidSignerNotification from "../InvalidSignerNotification/InvalidSignerNotification";

export type Section = FormWithResponseType["form_section"][0];

export type RequestFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray =
  FormType["form_section"][0]["section_field"][0] & {
    field_response: RequestResponseTableRow[];
  };

type Props = {
  form: FormType;
  requestId: string;
  duplicatableSectionIdList: string[];
  formslyFormName?: string;
  requestProjectId?: string;
};

const EditRequestPage = ({
  form,
  requestId,
  formslyFormName = "",
  requestProjectId,
  duplicatableSectionIdList,
}: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();

  const isReferenceOnly = Boolean(router.query.referenceOnly);

  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const [initialRequestDetails, setInitialRequestDetails] =
    useState<RequestFormValues>();

  const [currencyOptionList, setCurrencyOptionList] = useState<
    { value: string; label: string }[]
  >([]);

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };
  const signerList = form.form_signer.map((signer) => ({
    ...signer,
    signer_action: signer.signer_action.toUpperCase(),
  }));

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control, getValues } = requestFormMethods;
  const {
    fields: formSections,
    insert: insertSection,
    remove: removeSection,
    replace: replaceSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const onSubmit = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      if (!form.form_signer.length) {
        notifications.show({
          title: "There's no assigned signer.",
          message: <InvalidSignerNotification />,
          color: "orange",
          autoClose: false,
        });
        return;
      }

      let request: RequestTableRow;
      if (isReferenceOnly) {
        request = await createRequest(supabaseClient, {
          requestFormValues: data,
          formId: form.form_id,
          teamMemberId: teamMember.team_member_id,
          signers: form.form_signer,
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          isFormslyForm: false,
          projectId: requestProjectId || "",
          teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
          userId: requestorProfile.user_id,
        });
      } else {
        request = await editRequest(supabaseClient, {
          requestId,
          requestFormValues: data,
          signers: form.form_signer,
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
          userId: requestorProfile.user_id,
        });
      }

      notifications.show({
        message: `Request ${isReferenceOnly ? "created" : "edited"}.`,
        color: "green",
      });
      await router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/requests/${
          request.request_id
        }`
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

  const handleDuplicateSection = (sectionId: string) => {
    const sectionLastIndex = formSections
      .map((sectionItem) => sectionItem.section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = form.form_section.find(
      (section) => section.section_id === sectionId
    );
    if (sectionMatch) {
      const sectionDuplicatableId = uuidv4();
      const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
        (field) => ({
          ...field,
          field_section_duplicatable_id: sectionDuplicatableId,
        })
      );
      const newSection = {
        ...sectionMatch,
        section_field: duplicatedFieldsWithDuplicatableId,
      };
      insertSection(sectionLastIndex + 1, newSection);
      return;
    }
  };

  const handleRemoveSection = (sectionDuplicatableId: string) => {
    const sectionMatchIndex = formSections.findIndex(
      (section) =>
        section.section_field[0].field_section_duplicatable_id ===
        sectionDuplicatableId
    );
    if (sectionMatchIndex) {
      removeSection(sectionMatchIndex);
      return;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (!team.team_id) return;
    try {
      const fetchRequestDetails = async () => {
        const finalInitialRequestDetails: Section[] = [];
        // non duplicatable section
        let fieldIdList: string[] = [];
        let nonDuplicatableSectionResponse: {
          request_response_field_id: string;
          request_response: string;
          request_response_prefix: string | null;
        }[] = [];

        let sectionWithDuplicatableId: Section[] = [];

        form.form_section.forEach((section) => {
          if (section.section_is_duplicatable) return;

          fieldIdList = section.section_field.map((field) => field.field_id);
        });

        if (fieldIdList.length > 0) {
          nonDuplicatableSectionResponse =
            await getNonDuplictableSectionResponse(supabaseClient, {
              requestId,
              fieldIdList,
            });

          const nonDuplicatableSection = form.form_section.map((section) => {
            const sectionField = section.section_field.map((field) => {
              const response = nonDuplicatableSectionResponse.find(
                (response) =>
                  response.request_response_field_id === field.field_id
              );
              return {
                ...field,
                field_response: response
                  ? safeParse(response.request_response)
                  : "",
              };
            });

            return {
              ...section,
              section_field: sectionField,
            };
          });

          finalInitialRequestDetails.push(...nonDuplicatableSection);
        }

        // duplicatable section response
        if (duplicatableSectionIdList.length > 0) {
          let index = 0;
          const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
            [];

          while (1) {
            setIsLoading(true);
            const duplicatableSectionIdCondition = duplicatableSectionIdList
              .slice(index, index + 5)
              .map((dupId) => `'${dupId}'`)
              .join(",");

            const data = await getSectionInRequestPage(supabaseClient, {
              index,
              requestId: requestId,
              sectionId: form.form_section[0].section_id,
              duplicatableSectionIdCondition:
                duplicatableSectionIdCondition.length !== 0
                  ? duplicatableSectionIdCondition
                  : `'${uuidv4()}'`,
              withOption: true,
            });
            newFields.push(...data);
            index += 5;

            if (index > duplicatableSectionIdList.length) break;
          }
          const uniqueFieldIdList: string[] = [];
          const combinedFieldList: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
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

          // Format section
          const newSection = generateSectionWithDuplicateList([
            {
              ...form.form_section[0],
              section_field: combinedFieldList,
            },
          ]);

          // Input option to the sections
          const formattedSection = newSection
            .map((section) => {
              const fieldList: Section["section_field"] = [];
              section.section_field.forEach((field) => {
                const response = field.field_response?.request_response
                  ? safeParse(field.field_response?.request_response)
                  : "";
                const option: OptionTableRow[] = field.field_option ?? [];

                const prefix = field.field_response?.request_response_prefix
                  ? safeParse(field.field_response.request_response_prefix)
                  : "";

                if (response) {
                  fieldList.push({
                    ...field,
                    field_response: response,
                    field_option: option,
                    field_prefix: prefix,
                  });
                }
              });

              return {
                ...section,
                section_field: fieldList,
              };
            })
            .sort((a, b) => a.section_order - b.section_order);

          // Add duplicatable section id
          sectionWithDuplicatableId = formattedSection.map((section, index) => {
            const dupId = index ? uuidv4() : undefined;
            return {
              ...section,
              section_field: section.section_field.map((field) => {
                return {
                  ...field,
                  field_section_duplicatable_id: dupId,
                };
              }),
            };
          });
        }

        finalInitialRequestDetails.push(...sectionWithDuplicatableId);
        replaceSection(finalInitialRequestDetails);
        setInitialRequestDetails({ sections: finalInitialRequestDetails });
        setIsLoading(false);
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
  }, [team]);

  const handleResetRequest = () => {
    replaceSection(initialRequestDetails ? initialRequestDetails.sections : []);
  };

  // fetch currency option list
  useEffect(() => {
    const fetchCurrencyOptionList = async () => {
      setIsLoading(true);
      try {
        const data = await getCurrencyOptionList(supabaseClient);
        if (!data) return;
        const optionList = data.map((item) => ({
          value: item.currency_alphabetic_code,
          label: item.currency_alphabetic_code,
        }));
        setCurrencyOptionList(optionList);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrencyOptionList();
  }, []);

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
              // used to render add duplicate button
              // find the last index of current section, and render add duplicate button if match
              const sectionIdToFind = section.section_id;
              const sectionLastIndex = getValues("sections")
                .map((sectionItem) => sectionItem.section_id)
                .lastIndexOf(sectionIdToFind);

              return (
                <Box key={section.id}>
                  <RequestFormSection
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                    onRemoveSection={handleRemoveSection}
                    formslyFormName={formslyFormName}
                    isEdit={!isReferenceOnly}
                    currencyOptionList={currencyOptionList}
                  />
                  {section.section_is_duplicatable &&
                    idx === sectionLastIndex && (
                      <Button
                        mt="md"
                        variant="default"
                        onClick={() =>
                          handleDuplicateSection(section.section_id)
                        }
                        fullWidth
                      >
                        {section.section_name} +
                      </Button>
                    )}
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

export default EditRequestPage;
