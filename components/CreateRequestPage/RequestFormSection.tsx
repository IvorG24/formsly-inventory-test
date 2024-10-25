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
  onRemoveSection?: (sectionDuplicatableId: string) => void;
  currencyOptionList?: { value: string; label: string }[];
  formslyFormName?: string;
  isEdit?: boolean;
  loadingFieldList?: { sectionIndex: number; fieldIndex: number }[];
  isPublicRequest?: boolean;
  itemFormMethods?: {
    onGeneralNameChange: (index: number, value: string | null) => void;
    onProjectNameChange: (value: string | null) => void;
  };
  servicesFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
  };
  otherExpensesMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onCategoryChange: (index: number, value: string | null) => void;
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
    onGeneralItemNameChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onComponentCategoryChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onBrandChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onModelChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onPartNumberChange: (value: string | null, index: number) => void;
    onGeneralItemNameOpen?: (index: number) => void;
  };
  pedItemFormMethods?: {
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
  itAssetRequestFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onGeneralNameChange: (index: number, value: string | null) => void;
    onEmployeeNumberChange: (
      value: string | null,
      sectionIndex: number
    ) => void;
  };
  liquidationReimbursementFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onRequestTypeChange: (value: string | null) => void;
    onPayeeVatBooleanChange: (
      value: boolean,
      fieldIndex: number,
      sectionIndex: number
    ) => void;
    onInvoiceAmountChange: (value: number, sectionIndex: number) => void;
    onVatFieldChange?: (value: number, sectionIndex: number) => void;
    onTypeOfRequestChange: (value: string | null, sectionIndex: number) => void;
    onModeOfPaymentChange: (
      value: string | null,
      fieldIndex: number,
      sectionIndex: number
    ) => void;
    onWorkingAdvancesChange: (value: string | null, fieldIndex: number) => void;
  };
  personnelTransferRequisitionMethods?: {
    onMannerOfTransferChange: (
      value: string | null,
      prevValue: string | null
    ) => void;
    onFromChange: (value: string | null) => void;
    onToChange: (value: string | null) => void;
    onTypeOfTransferChange: (value: string | null) => void;
    onPurposeChange: (value: string | null, prevValue: string | null) => void;
    onEquipmentCodeChange: (value: string | null, index: number) => void;
    onEmployeeNumberChange: (value: string | null, index: number) => void;
    onITAssetBooleanChange: (value: boolean, index: number) => void;
    onEmployeeStatusChange: (
      value: string | null,
      prevValue: string | null,
      index: number
    ) => void;
    onPhaseOfWorkChange: (
      value: string | null,
      sectionIndex: number,
      fieldIndex: number
    ) => void;
  };
  pettyCashVoucherFormMethods?: {
    onProjectOrDepartmentNameChange: () => void;
    onPettyCashVoucherBooleanChange: (
      value: boolean,
      sectionIndex: number
    ) => void;
    onEmployeeNumberChange: (
      value: string | null,
      sectionIndex: number
    ) => void;
    onAccountingAuthorizationBooleanChange: (value: boolean) => void;
    onSCICAuthorizationChange: (value: boolean) => void;
    onChargeToProjectBooleanChange: (value: boolean) => void;
    onModeOfPaymentChange: (value: string | null, sectionIndex: number) => void;
    onTypeOfRequestChange: (value: string | null) => void;
    onQuantityOrUnitCostChange: (sectionIndex: number) => void;
    onParticularTypeChange: (
      value: string | null,
      sectionIndex: number
    ) => void;
  };
  equipmentServiceReportMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onCategoryChange: (value: string | null) => void;
    onEquipmentTypeChange: (value: string | null) => void;
    onPropertyNumberChange: (value: string | null) => void;
    onActionTypeChange: (
      value: string | null,
      prevValue: string | null
    ) => void;
    onActionPlanBlur: (value: string | null, index: number) => void;
    onGeneralItemNameChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onComponentCategoryChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onBrandChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onModelChange: (
      value: string | null,
      index: number,
      editDetails?: {
        fieldId: string;
        dupId: string | undefined;
        response: string;
      }
    ) => void;
    onPartNumberChange: (value: string | null, index: number) => void;
  };
  requestForPaymentFormMethods?: {
    onProjectNameChange: (value: string | null) => void;
    onDepartmentChange: (
      value: string | null,
      prevValue: string | null
    ) => void;
    onPayeeTypeChange: (value: string | null, prevValue: string | null) => void;
    onEmployeeNumberChange: (value: string | null) => void;
    onPurposePlanChange: (
      value: string | null,
      prevValue: string | null
    ) => void;
    onChargeToChange: (value: string | null) => void;
    onAmountBlur: (value: string | null, index: number) => void;
    onModeOfPaymentChange: (value: string | null, index: number) => void;
  };
  applicationInformationFormMethods?: {
    onPositionChange: (value: string | null) => void;
    onRegionChange: (value: string | null) => void;
    onProvinceChange: (value: string | null) => void;
    onCityChange: (value: string | null) => void;
    onBarangayChange: (value: string | null) => void;
    onWillingToBeAssignedAnywhereChange: (
      value: boolean,
      index: number
    ) => void;
    onHighestEducationalAttainmentChange: (value: string | null) => void;
    onFieldOfStudyChange: (value: string | null) => void;
  };
};

const RequestFormSection = ({
  section,
  sectionIndex,
  onRemoveSection,
  formslyFormName = "",
  isPublicRequest = false,
  isEdit,
  loadingFieldList,
  currencyOptionList,
  itemFormMethods,
  servicesFormMethods,
  pedEquipmentFormMethods,
  pedPartFormMethods,
  otherExpensesMethods,
  pedItemFormMethods,
  paymentRequestFormMethods,
  itAssetRequestFormMethods,
  liquidationReimbursementFormMethods,
  personnelTransferRequisitionMethods,
  pettyCashVoucherFormMethods,
  equipmentServiceReportMethods,
  requestForPaymentFormMethods,
  applicationInformationFormMethods,
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
            <RequestFormFields
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
              isPublicRequest={isPublicRequest}
              currencyOptionList={currencyOptionList}
              itemFormMethods={itemFormMethods}
              servicesFormMethods={servicesFormMethods}
              pedEquipmentFormMethods={pedEquipmentFormMethods}
              pedPartFormMethods={pedPartFormMethods}
              otherExpensesMethods={otherExpensesMethods}
              pedItemFormMethods={pedItemFormMethods}
              paymentRequestFormMethods={paymentRequestFormMethods}
              itAssetRequestFormMethods={itAssetRequestFormMethods}
              liquidationReimbursementFormMethods={
                liquidationReimbursementFormMethods
              }
              personnelTransferRequisitionMethods={
                personnelTransferRequisitionMethods
              }
              pettyCashVoucherFormMethods={pettyCashVoucherFormMethods}
              equipmentServiceReportMethods={equipmentServiceReportMethods}
              requestForPaymentFormMethods={requestForPaymentFormMethods}
              applicationInformationFormMethods={
                applicationInformationFormMethods
              }
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

export default RequestFormSection;
