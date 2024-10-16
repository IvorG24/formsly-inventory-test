import {
  ActionIcon,
  Group,
  Paper,
  Space,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Section } from "./CreateAssetPage";
import InventoryFormFields from "./InventoryFormFields";

type RequestFormSectionProps = {
  section: Section;
  sectionIndex: number;
  type?: "Modal" | "Form";
  onRemoveSection?: (sectionDuplicatableId: string) => void;
  formslyFormName?: string;
  isEdit?: boolean;
  loadingFieldList?: { sectionIndex: number; fieldIndex: number }[];
  assetFormMethods?: {
    onCategoryNameChange: (index: number, value: string | null) => void;
    onSiteNameChange: (index: number, value: string | null) => void;
  };
  eventFormMethods?: {
    onCheckinCategoryChange: (index: number, value: string | null) => void;
    onSiteCategorychange: (index: number, value: string | null) => void;
  };
};

const InventoryFormSection = ({
  section,
  sectionIndex,
  onRemoveSection,
  formslyFormName = "",
  isEdit,
  loadingFieldList,
  type = "Form",
  assetFormMethods,
  eventFormMethods,
}: RequestFormSectionProps) => {
  const sectionDuplicatableId =
    section.section_field?.[0]?.field_section_duplicatable_id;

  if (type === "Modal") {
    return (
      <Stack mt="xl">
        {section.section_field.map((field, idx) => {
          const isLoading = Boolean(
            loadingFieldList?.find(
              (loadingField) =>
                loadingField.sectionIndex === sectionIndex &&
                loadingField.fieldIndex === idx
            )
          );

          return (
            <InventoryFormFields
              key={field.field_id + section.section_id}
              field={{
                ...field,
                options: field.field_option ? field.field_option : [],
                field_section_duplicatable_id:
                  field.field_section_duplicatable_id,
              }}
              sectionIndex={sectionIndex}
              fieldIndex={idx}
              isEdit={isEdit}
              isLoading={isLoading}
              formslyFormName={formslyFormName}
              eventFormMethods={eventFormMethods}
            />
          );
        })}
      </Stack>
    );
  }
  return (
    <Paper p="xl" shadow="xs">
      <Group position="apart">
        <Title order={4} color="dimmed">
          {section.section_name}
        </Title>
        {sectionDuplicatableId && (
          <Tooltip label="Remove Section">
            <ActionIcon
              onClick={() =>
                onRemoveSection && onRemoveSection(sectionDuplicatableId)
              }
              variant="light"
              color="red"
              disabled={onRemoveSection === undefined}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Space />
      <Stack mt="xl" spacing="lg">
        {section.section_field.map((field, idx) => {
          const isLoading = Boolean(
            loadingFieldList?.find(
              (loadingField) =>
                loadingField.sectionIndex === sectionIndex &&
                loadingField.fieldIndex === idx
            )
          );

          return (
            <InventoryFormFields
              key={field.field_id + section.section_id}
              field={{
                ...field,
                options: field.field_option ? field.field_option : [],
                field_section_duplicatable_id:
                  field.field_section_duplicatable_id,
              }}
              sectionIndex={sectionIndex}
              fieldIndex={idx}
              isEdit={isEdit}
              isLoading={isLoading}
              formslyFormName={formslyFormName}
              assetFormMethods={assetFormMethods}
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

export default InventoryFormSection;
