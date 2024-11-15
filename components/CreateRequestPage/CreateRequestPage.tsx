import { getCurrencyOptionList } from "@/backend/api/get";
import { createRequest } from "@/backend/api/post";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  RequestResponseTableRow,
} from "@/utils/types";
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import RequestFormDetails from "./RequestFormDetails";
import RequestFormSection from "./RequestFormSection";
import RequestFormSigner from "./RequestFormSigner";

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
  formslyFormName?: string;
  requestProjectId?: string;
};

const CreateRequestPage = ({
  form,
  formslyFormName = "",
  requestProjectId,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const [localFormState, setLocalFormState, removeLocalFormState] =
    useLocalStorage<FormWithResponseType | null>({
      key: `${router.query.formId}`,
      defaultValue: form,
    });

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

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId,
        teamMemberId: teamMember.team_member_id,
        signers: form.form_signer,
        teamId: teamMember.team_member_team_id,
        requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
        formName: form.form_name,
        isFormslyForm: false,
        projectId: requestProjectId || "",
        teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
        userId: requestorProfile.user_id,
      });
      removeLocalFormState();
      notifications.show({
        message: "Request created.",
        color: "green",
      });
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/requests/${
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
    if (localFormState) {
      replaceSection(localFormState.form_section);
    } else {
      replaceSection(form.form_section);
    }
  }, [form, localFormState, replaceSection, requestFormMethods]);

  useBeforeunload(() => {
    const formWithResponse: FormWithResponseType = {
      ...form,
      form_section: getValues("sections"),
    };
    setLocalFormState(formWithResponse);
  });

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
        Create Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
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
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateRequestPage;
