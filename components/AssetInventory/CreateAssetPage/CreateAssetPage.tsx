import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import {
  FormType,
  InventoryFormResponseType,
  InventoryFormType,
  RequestResponseTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Paper,
  Space,
  Stack,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import InventoryFormSection from "./InventoryFormSection";

export type Section = InventoryFormResponseType["form_section"][0];

export type InventoryFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray =
  FormType["form_section"][0]["section_field"][0] & {
    field_response: RequestResponseTableRow[];
  };

type Props = {
  form: InventoryFormType;
  formslyFormName?: string;
  requestProjectId?: string;
};

const CreateAssetPage = ({ form, formslyFormName = "" }: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<InventoryFormValues>();
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

  const handleCreateRequest = async (data: InventoryFormValues) => {
    try {
      if (!requestorProfile) return;
      if (!teamMember) return;

      setIsLoading(true);

      console.log(data);

      notifications.show({
        message: "Request created.",
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
    console.log(form);

    replaceSection(form.form_section);
  }, [form]);
  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Asset
      </Title>
      <Space h="md" />
      <Paper>
        <FormProvider {...requestFormMethods}>
          <form onSubmit={handleSubmit(handleCreateRequest)}>
            <RequestFormDetails formDetails={formDetails} />
            <Stack spacing="xl">
              {formSections.map((section, idx) => {
                const sectionIdToFind = section.section_id;
                const sectionLastIndex = getValues("sections")
                  .map((sectionItem) => sectionItem.section_id)
                  .lastIndexOf(sectionIdToFind);

                return (
                  <Box key={section.id}>
                    <InventoryFormSection
                      key={section.section_id}
                      section={section}
                      sectionIndex={idx}
                      onRemoveSection={handleRemoveSection}
                      formslyFormName={formslyFormName}
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

              <Button type="submit">Submit</Button>
            </Stack>
          </form>
        </FormProvider>
      </Paper>
    </Container>
  );
};

export default CreateAssetPage;
