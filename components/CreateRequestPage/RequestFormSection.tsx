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
import { Section } from "./CreateRequestPage";
import RequestFormFields from "./RequestFormFields";

type RequestFormSectionProps = {
  section: Section;
  sectionIndex: number;
  onRemoveSection: (sectionDuplicatableId: string) => void;
  requisitionFormMethods?: {
    onGeneralNameChange: (index: number, value: string | null) => void;
  };
};

const RequestFormSection = ({
  section,
  sectionIndex,
  onRemoveSection,
  requisitionFormMethods,
}: RequestFormSectionProps) => {
  const sectionDuplicatableId =
    section.section_field[0].field_section_duplicatable_id;
  return (
    <Paper p="xl" shadow="xs">
      <Group position="apart">
        <Title order={4} color="dimmed">
          {section.section_name}
        </Title>
        {sectionDuplicatableId && (
          <Tooltip label="Remove Section">
            <ActionIcon
              onClick={() => onRemoveSection(sectionDuplicatableId)}
              variant="light"
              color="red"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Space />
      <Stack mt="xl">
        {section.section_field.map((field, idx) => (
          <RequestFormFields
            key={field.field_id + section.section_id}
            field={{
              ...field,
              options: field.field_option ? field.field_option : [],
            }}
            sectionIndex={sectionIndex}
            fieldIndex={idx}
            requisitionFormMethods={requisitionFormMethods}
          />
        ))}
      </Stack>
    </Paper>
  );
};

export default RequestFormSection;
