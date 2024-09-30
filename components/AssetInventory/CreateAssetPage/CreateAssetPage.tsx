import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
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
import { useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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
  const teamMember = useUserTeamMember();
  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<InventoryFormValues>();
  const { handleSubmit, control } = requestFormMethods;
  const {
    fields: formSections,
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
                return (
                  <Box key={section.id}>
                    <InventoryFormSection
                      key={section.section_id}
                      section={section}
                      sectionIndex={idx}
                      onRemoveSection={handleRemoveSection}
                      formslyFormName={formslyFormName}
                    />
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
