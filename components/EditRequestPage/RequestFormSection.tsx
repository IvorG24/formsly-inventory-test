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
import { Section } from "./EditRequestPage";
import RequestFormFields from "./RequestFormFields";

type RequestFormSectionProps = {
  section: Section;
  sectionIndex: number;
  onRemoveSection?: (index: number) => void;
  isSectionRemovable?: boolean;
  itemFormMethods?: {
    onGeneralNameChange: (index: number, value: string | null) => void;
    onProjectNameChange: (value: string | null) => void;
    onCSICodeChange: (index: number, value: string | null) => void;
    supplierSearch?: (value: string, index: number) => void;
    isSearchingSupplier?: boolean;
    csiSearch?: (value: string, index: number) => void;
    isSearchingCSI?: boolean;
  };

  formslyFormName?: string;

  referenceOnly?: boolean;
  servicesFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onCSIDivisionChange: (index: number, value: string | null) => void;
    onCSICodeChange: (index: number, value: string | null) => void;
    supplierSearch?: (value: string, index: number) => void;
    isSearching?: boolean;
  };
  otherExpensesMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onCSICodeChange: (index: number, value: string | null) => void;
    onCategoryChange: (index: number, value: string | null) => void;
    supplierSearch?: (value: string, index: number) => void;
    isSearching?: boolean;
  };
  pedEquipmentFormMethods?: {
    onCategoryChange: (value: string | null, index: number) => void;
    onProjectNameChange: (value: string | null) => void;
    onEquipmentNameChange: (value: string | null, index: number) => void;
    onBrandChange: (value: string | null, index: number) => void;
  };
  pedPartFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onCategoryChange: (value: string | null) => void;
    onEquipmentNameChange: (value: string | null) => void;
    onPropertyNumberChange: (value: string | null) => void;
    onTypeOfOrderChange: (
      prevValue: string | null,
      value: string | null
    ) => void;
    onGeneralItemNameChange: (value: string | null, index: number) => void;
    onComponentCategoryChange: (value: string | null, index: number) => void;
    onBrandChange: (value: string | null, index: number) => void;
    onModelChange: (value: string | null, index: number) => void;
    onPartNumberChange: (value: string | null, index: number) => void;
  };
  pedConsumableFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onPropertyNumberChange: (value: string | null, index: number) => void;
    onRequestTypeChange: (
      prevValue: string | null,
      value: string | null
    ) => void;
    onGeneralNameChange: (value: string | null, index: number) => void;
  };
  paymentRequestFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onRequestTypeChange: (value: string | null, index: number) => void;
  };
};

const RequestFormSection = ({
  section,
  sectionIndex,
  onRemoveSection,
  isSectionRemovable,
  itemFormMethods,
  formslyFormName = "",
  referenceOnly,
  servicesFormMethods,
  pedEquipmentFormMethods,
  pedPartFormMethods,
  otherExpensesMethods,
  pedConsumableFormMethods,
  paymentRequestFormMethods,
}: RequestFormSectionProps) => {
  return (
    <Paper p="xl" shadow="xs">
      <Group position="apart">
        <Title order={4} color="dimmed">
          {section.section_name}
        </Title>
        {isSectionRemovable && (
          <Tooltip label="Remove Section">
            <ActionIcon
              onClick={() => onRemoveSection && onRemoveSection(sectionIndex)}
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
            itemFormMethods={itemFormMethods}
            servicesFormMethods={servicesFormMethods}
            formslyFormName={formslyFormName}
            referenceOnly={referenceOnly}
            otherExpensesMethods={otherExpensesMethods}
            pedEquipmentFormMethods={pedEquipmentFormMethods}
            pedPartFormMethods={pedPartFormMethods}
            pedConsumableFormMethods={pedConsumableFormMethods}
            paymentRequestFormMethods={paymentRequestFormMethods}
          />
        ))}
      </Stack>
    </Paper>
  );
};

export default RequestFormSection;
