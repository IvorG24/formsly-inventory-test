import { getRequestFormslyId } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_IN_MB,
  MAX_INT,
  MAX_TEXT_LENGTH,
  SELECT_OPTION_LIMIT,
} from "@/utils/constant";
import {
  parseJSONIfValid,
  publicRequestPath,
  requestPath,
} from "@/utils/string";
import { FieldTableRow, OptionTableRow } from "@/utils/types";
import {
  ActionIcon,
  Autocomplete,
  Checkbox,
  FileInput,
  Flex,
  List,
  Loader,
  MultiSelect,
  NumberInput,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { DateInput, TimeInput, YearPickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconCalendar,
  IconClock,
  IconExternalLink,
  IconFile,
  IconLink,
} from "@tabler/icons-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import isURL from "validator/lib/isURL";
import { RequestFormValues } from "./CreateRequestPage";
import CurrencyFormField from "./SpecialField/CurrencyFormField";

type RequestFormFieldsProps = {
  field: FieldTableRow & {
    options: OptionTableRow[];
    isCorrect?: boolean;
  } & {
    field_section_duplicatable_id: string | undefined;
    field_description?: string;
    field_prefix?: string | null;
    field_weight?: number;
  };
  sectionIndex: number;
  fieldIndex: number;
  currencyOptionList?: { value: string; label: string }[];
  formslyFormName?: string;
  isEdit?: boolean;
  isLoading: boolean | undefined;
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
    onProjectOrDepartmentNameChange: () => void;
    onRequestTypeChange: (value: string | null) => void;
    onTypeOfRequestChange: (value: string | null, sectionIndex: number) => void;
    onPayeeVatBooleanChange: (
      value: boolean,
      fieldIndex: number,
      sectionIndex: number
    ) => void;
    onInvoiceAmountChange: (value: number, sectionIndex: number) => void;
    onVatFieldChange?: (value: number, sectionIndex: number) => void;
    onModeOfPaymentChange: (
      value: string | null,
      fieldIndex: number,
      sectionIndex: number
    ) => void;
    onWorkingAdvancesChange: (value: string | null, fieldIndex: number) => void;
    onMaterialTypeChange: (value: string | null, sectionIndex: number) => void;
  };
  personnelTransferRequisitionMethods?: {
    onTypeOfTransferChange: (value: string | null) => void;
    onMannerOfTransferChange: (
      value: string | null,
      prevValue: string | null
    ) => void;
    onFromChange: (value: string | null) => void;
    onToChange: (value: string | null) => void;
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
  practicalTestFormMethods?: {
    onScoreChange: () => void;
  };
};

const RequestFormFields = ({
  field,
  sectionIndex,
  fieldIndex,
  isEdit,
  isLoading,
  currencyOptionList,
  formslyFormName = "",
  isPublicRequest = false,
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
  practicalTestFormMethods,
}: RequestFormFieldsProps) => {
  const {
    register,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useFormContext<RequestFormValues>();

  const team = useActiveTeam();
  const dropdownOptionValue = useWatch({
    control,
    name: `sections.${sectionIndex}.section_field.${fieldIndex}.field_option`,
  });

  const supabaseClient = useSupabaseClient();
  const timeInputRef = useRef<HTMLInputElement>(null);

  const [linkToDisplay, setLinkToDisplay] = useState<string | null>(null);
  const [prevFileLink, setPrevFileLink] = useState<string | null>(null);
  const [currencyFieldValue, setCurrencyFieldValue] = useState<string | null>(
    field.field_prefix ?? "PHP"
  );

  const fieldError =
    errors.sections?.[sectionIndex]?.section_field?.[fieldIndex]?.field_response
      ?.message;

  const inputProps = {
    label: field.field_name,
    required: field.field_is_required,
    variant: field.field_is_read_only ? "filled" : "default",
    error: fieldError,
  };

  const fieldRules = {
    required: {
      value: field.field_type !== "SWITCH" && field.field_is_required,
      message: "This field is required",
    },
  };

  useEffect(() => {
    const fetchLinkToDisplay = async () => {
      const requestId = getValues(
        `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`
      );
      if (requestId) {
        const fetchedValue = await getRequestFormslyId(supabaseClient, {
          requestId: requestId as string,
        });
        if (fetchedValue) {
          setLinkToDisplay(fetchedValue);
        }
      }
    };

    const fetchFile = async () => {
      try {
        const fileLink = parseJSONIfValid(
          `${getValues(
            `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`
          )}`
        );
        setPrevFileLink(fileLink);

        if (isURL(fileLink)) {
          const response = await fetch(fileLink);
          const blob = await response.blob();
          const file = new File([blob], fileLink, { type: blob.type });
          setValue(
            `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
            file as never
          );
        }
      } catch (e) {
        notifications.show({
          message: "Error downloading file.",
          color: "red",
        });
      }
    };

    if (field.field_type === "LINK") {
      fetchLinkToDisplay();
    }

    if (field.field_type === "FILE" && isEdit !== undefined) {
      fetchFile();
    }
  }, []);

  useEffect(() => {
    if (
      field.field_type === "NUMBER" &&
      field.field_special_field_template_id
    ) {
      setValue(
        `sections.${sectionIndex}.section_field.${fieldIndex}.field_prefix`,
        field.field_prefix ?? "PHP"
      );
    }
  }, [field]);

  const renderField = (field: RequestFormFieldsProps["field"]) => {
    switch (field.field_type) {
      case "LINK":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => {
              return (
                <Flex w="100%" align="flex-end" gap="xs">
                  <TextInput
                    {...inputProps}
                    error={fieldError}
                    withAsterisk={field.field_is_required}
                    value={`${linkToDisplay || value || ""}`}
                    icon={<IconLink size={16} />}
                    style={{ flex: 1 }}
                    onChange={onChange}
                    readOnly={field.field_is_read_only}
                  />
                  <ActionIcon
                    mb={4}
                    p={4}
                    variant="light"
                    color="blue"
                    onClick={() =>
                      window.open(
                        isPublicRequest
                          ? publicRequestPath(`${value}`)
                          : requestPath(`${value}`, team.team_name),
                        "_blank"
                      )
                    }
                  >
                    <IconExternalLink />
                  </ActionIcon>
                </Flex>
              );
            }}
            rules={{
              ...fieldRules,
              validate: {
                isUrl: (value) => {
                  if (linkToDisplay) {
                    return true;
                  }

                  return isURL(`${value}`) || "Link is invalid";
                },
              },
            }}
          />
        );

      case "TEXT":
        let maxLength: number | undefined = undefined;
        let formatter: ((value: string) => string) | undefined = undefined;

        switch (field.field_name) {
          case "Contact Number":
            maxLength = 10;
            break;
          case "SSS ID Number":
            maxLength = 10;
            formatter = (value: string) => {
              if (!value) return "";
              const cleaned = ("" + value).replace(/\D/g, "");
              const match = cleaned.match(/^(\d{2})(\d{7})(\d{1})$/);
              if (match) {
                return `${match[1]}-${match[2]}-${match[3]}`;
              }
              return value;
            };
            break;
          case "Philhealth Number":
            maxLength = 12;
            formatter = (value: string) => {
              if (!value) return "";
              const cleaned = ("" + value).replace(/\D/g, "");
              const match = cleaned.match(/^(\d{2})(\d{9})(\d{1})$/);
              if (match) {
                return `${match[1]}-${match[2]}-${match[3]}`;
              }
              return value;
            };
            break;
          case "Pag-IBIG Number":
            maxLength = 12;
            formatter = (value: string) => {
              if (!value) return "";
              const cleaned = ("" + value).replace(/\D/g, "");
              const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})$/);
              if (match) {
                return `${match[1]}-${match[2]}-${match[3]}`;
              }
              return value;
            };
            break;
          case "TIN":
            maxLength = 9;
            formatter = (value: string) => {
              if (!value) return "";
              const cleaned = ("" + value).replace(/\D/g, "");
              const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
              if (match) {
                return `${match[1]}-${match[2]}-${match[3]}`;
              }
              return value;
            };
            break;
        }

        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={(value ?? "") as string}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  if (formatter) {
                    const numberOnly = value.replace(/\D/g, "");
                    const newValue = formatter(numberOnly);
                    if (maxLength && maxLength + 2 === newValue.length) {
                      onChange(newValue);
                      return;
                    } else {
                      onChange(numberOnly);
                      return;
                    }
                  } else if (
                    itAssetRequestFormMethods &&
                    field.field_name === "Employee No. (HRIS)"
                  ) {
                    onChange(value.replace(/\D/g, ""));
                    return;
                  }
                  onChange(value);
                }}
                withAsterisk={field.field_is_required}
                {...inputProps}
                error={fieldError}
                maxLength={maxLength ?? MAX_TEXT_LENGTH}
                readOnly={field.field_is_read_only || isLoading}
                rightSection={isLoading && <Loader size={16} />}
                onBlur={(e) => {
                  const value = e.currentTarget.value;
                  switch (field.field_name) {
                    case "Employee No. (HRIS)":
                      personnelTransferRequisitionMethods &&
                        personnelTransferRequisitionMethods.onEmployeeNumberChange(
                          value,
                          sectionIndex
                        );
                      requestForPaymentFormMethods &&
                        requestForPaymentFormMethods.onEmployeeNumberChange(
                          value
                        );
                      pettyCashVoucherFormMethods &&
                        pettyCashVoucherFormMethods.onEmployeeNumberChange(
                          value,
                          sectionIndex
                        );
                      itAssetRequestFormMethods &&
                        itAssetRequestFormMethods.onEmployeeNumberChange(
                          value,
                          sectionIndex
                        );
                      break;

                    case "Action Plan":
                      equipmentServiceReportMethods?.onActionPlanBlur(
                        value,
                        sectionIndex
                      );
                      break;
                  }
                }}
                type={
                  field.field_name === "Email Address" ? "email" : undefined
                }
                icon={field.field_name === "Contact Number" ? "+63" : ""}
              />
            )}
            rules={{
              ...fieldRules,
              validate: {
                checkNumberOfCharacter: (value) => {
                  const stringifiedValue = value ? `${value}` : "";

                  if (!stringifiedValue.length || !maxLength) return true;
                  switch (field.field_name) {
                    case "Contact Number":
                      if (stringifiedValue.length !== maxLength) {
                        return "Invalid Contact Number";
                      }
                      return true;
                    case "SSS ID Number":
                      if (stringifiedValue.length !== maxLength + 2) {
                        return "Invalid SSS ID Number";
                      }
                      return true;
                    case "Philhealth Number":
                      if (stringifiedValue.length !== maxLength + 2) {
                        return "Invalid Philhealth Number";
                      }
                      return true;
                    case "Pag-IBIG Number":
                      if (stringifiedValue.length !== maxLength + 2) {
                        return "Invalid Pag-IBIG Number";
                      }
                      return true;
                    case "TIN":
                      if (stringifiedValue.length !== maxLength + 2) {
                        return "Invalid TIN Number";
                      }
                      return true;
                  }
                },
                startsWith: (value) => {
                  if (field.field_name !== "Contact Number") return true;
                  return `${value}`[0] === "9"
                    ? true
                    : "Contact number must start with 9";
                },
                validateStreet: (value) => {
                  if (
                    !(
                      field.field_name === "Street" &&
                      applicationInformationFormMethods
                    )
                  )
                    return true;
                  const streetPattern = /^[a-zA-Z0-9\s,.'-]{5,100}$/;
                  const trimmedStreet = (value as string).trim();
                  if (!streetPattern.test(trimmedStreet)) {
                    return "Invalid street address. Use letters, numbers, spaces, commas, and hyphens only.";
                  } else {
                    return true;
                  }
                },
                validateTicketID: (value) => {
                  if (!liquidationReimbursementFormMethods) return true;
                  if (
                    liquidationReimbursementFormMethods &&
                    field.field_name !== "Ticket ID"
                  )
                    return true;
                  const workingAdvancesFieldValue = getValues(
                    `sections.${sectionIndex}.section_field.${
                      fieldIndex - 1
                    }.field_response`
                  );

                  if (
                    value &&
                    `${workingAdvancesFieldValue}`.includes("Petty Cash Fund")
                  ) {
                    const currentValue = (value as string).trim();
                    const validPCVTicketIDCharRegex = /[^A-Z0-9\-]/;
                    const isValidPCVTicketID =
                      currentValue.includes("PCV-") &&
                      !validPCVTicketIDCharRegex.test(currentValue);

                    const validWAVTicketIDCharRegex = /^WAV NO\. \d{7}$/;
                    const isValidWAVTicketID =
                      validWAVTicketIDCharRegex.test(currentValue);

                    return (
                      isValidPCVTicketID ||
                      isValidWAVTicketID ||
                      "Invalid ticket ID. Example of valid ticket ID: SI2PCV-A13E, CO10PCV-A265, WAV NO. 0296703"
                    );
                  }

                  return true;
                },
                validateOBTicketID: (value) => {
                  if (!pettyCashVoucherFormMethods) return true;
                  if (
                    pettyCashVoucherFormMethods &&
                    field.field_name !== "Approved Official Business"
                  )
                    return true;

                  const pattern = /^HRSM-\d+$/;
                  const entries = (value as string).split(/[\s,]+/);

                  for (const entry of entries) {
                    if (!pattern.test(entry)) {
                      return "Invalid HRSM ID. Example of valid HRSM ID: HRSM-1234, HRSM-5542. To add multiple HRSM IDs, follow this example: `HRSM-1125, HRSM-1132, HRSM-2214`";
                    }
                  }

                  return true;
                },
                validateFormslyID: (value) => {
                  if (!liquidationReimbursementFormMethods) return true;
                  if (
                    liquidationReimbursementFormMethods &&
                    field.field_name !== "Formsly ID"
                  )
                    return true;

                  const pattern = /^[A-Z0-9]+-[A-Z0-9]{4}$/;

                  return (
                    pattern.test(`${value}`.trim()) ||
                    "Invalid Formsly ID. Example of valid Formsly ID: SL2PCVB-B515, MH1BOQ-B50A, MH1S-B501"
                  );
                },
              },
            }}
          />
        );

      case "TEXTAREA":
        return (
          <Textarea
            {...inputProps}
            {...register(
              `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
              {
                ...fieldRules,
              }
            )}
            error={fieldError}
            autosize
            minRows={4}
            maxRows={12}
            withAsterisk={field.field_is_required}
            maxLength={MAX_TEXT_LENGTH}
          />
        );

      case "NUMBER":
        if (field.field_special_field_template_id) {
          return (
            <Controller
              control={control}
              name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
              render={({ field: { value, onChange } }) => (
                <CurrencyFormField
                  label={inputProps.label}
                  selectInputProps={{
                    data: currencyOptionList ?? [],
                    value: currencyFieldValue,
                    onChange: (value) => {
                      setCurrencyFieldValue(value);
                      setValue(
                        `sections.${sectionIndex}.section_field.${fieldIndex}.field_prefix`,
                        value ?? ""
                      );
                    },
                  }}
                  numberInputProps={{
                    value: value as number,
                    onChange: onChange,
                    withAsterisk: inputProps.required,
                    required: inputProps.required,
                    error: inputProps.error,
                    readOnly: field.field_is_read_only,
                  }}
                />
              )}
              rules={{
                ...fieldRules,
                validate: {
                  checkIfZero: (value) =>
                    field.field_name === "Quantity" && value === 0
                      ? "Quantity value is required"
                      : true,
                  checkIfPositiveInteger: (value) =>
                    field.field_name === "Quantity" && Number(value) < 0
                      ? "Quantity must be a positive integer."
                      : true,
                },
              }}
            />
          );
        } else {
          return (
            <Controller
              control={control}
              name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
              render={({ field: { value, onChange } }) => (
                <NumberInput
                  value={value as number}
                  onChange={onChange}
                  withAsterisk={field.field_is_required}
                  {...inputProps}
                  label={`${inputProps.label} ${
                    field.field_weight ? `(Max: ${field.field_weight})` : ""
                  }`}
                  error={fieldError}
                  maxLength={10}
                  precision={
                    [
                      "Quantity",
                      "Amount",
                      "Unit Cost",
                      "Invoice Amount",
                      "Cost",
                      "VAT",
                      "Expected Monthly Salary (PHP)",
                      "Capacity",
                    ].includes(field.field_name)
                      ? 2
                      : 0
                  }
                  onBlur={() => {
                    switch (field.field_name) {
                      case "Amount":
                        requestForPaymentFormMethods?.onAmountBlur(
                          value as string | null,
                          sectionIndex
                        );
                        break;
                      case "Invoice Amount":
                        liquidationReimbursementFormMethods?.onInvoiceAmountChange(
                          value as number,
                          sectionIndex
                        );
                        break;
                      case "VAT":
                        liquidationReimbursementFormMethods?.onVatFieldChange &&
                          liquidationReimbursementFormMethods?.onVatFieldChange(
                            value as number,
                            sectionIndex
                          );
                        break;
                      case "Quantity":
                        pettyCashVoucherFormMethods?.onQuantityOrUnitCostChange(
                          sectionIndex
                        );
                        break;
                      case "Unit Cost":
                        pettyCashVoucherFormMethods?.onQuantityOrUnitCostChange(
                          sectionIndex
                        );
                        break;
                    }
                    if (practicalTestFormMethods && sectionIndex === 2) {
                      practicalTestFormMethods.onScoreChange();
                    }
                  }}
                  min={0}
                  max={field.field_weight ?? MAX_INT}
                  readOnly={field.field_is_read_only}
                />
              )}
              rules={{
                ...fieldRules,
                validate: {
                  checkIfZero: (value) =>
                    field.field_name === "Quantity" && value === 0
                      ? "Quantity value is required"
                      : true,
                  checkIfPositiveInteger: (value) =>
                    field.field_name === "Quantity" && Number(value) < 0
                      ? "Quantity must be a positive integer."
                      : true,
                },
              }}
            />
          );
        }

      case "SWITCH":
        return (
          <Controller
            defaultValue={false}
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <Switch
                checked={value as boolean}
                onChange={(e) => {
                  const value = e.currentTarget.checked;
                  switch (field.field_name) {
                    case "Do employees transferring to other projects have IT assets":
                      personnelTransferRequisitionMethods &&
                        personnelTransferRequisitionMethods.onITAssetBooleanChange(
                          value,
                          sectionIndex
                        );
                      break;
                    case "Is this for Official Business?":
                      pettyCashVoucherFormMethods &&
                        pettyCashVoucherFormMethods.onPettyCashVoucherBooleanChange(
                          value,
                          sectionIndex
                        );
                      break;
                    case "This is to authorize the Accounting Department to deduct the cash advance amount from my salary upon my failure to liquidate within 48hrs after the purpose has been accomplished.":
                      pettyCashVoucherFormMethods &&
                        pettyCashVoucherFormMethods.onAccountingAuthorizationBooleanChange(
                          value
                        );
                      break;
                    case "This is to authorize Sta. Clara International Corporation to deduct from my salary the specified amount, representing payment for the particulars listed below.":
                      pettyCashVoucherFormMethods &&
                        pettyCashVoucherFormMethods.onSCICAuthorizationChange(
                          value
                        );
                      break;
                    case "Is this request charged to the project?":
                      pettyCashVoucherFormMethods &&
                        pettyCashVoucherFormMethods.onChargeToProjectBooleanChange(
                          value
                        );
                      break;
                    case "This payee have VAT?":
                      liquidationReimbursementFormMethods &&
                        liquidationReimbursementFormMethods.onPayeeVatBooleanChange(
                          value,
                          fieldIndex,
                          sectionIndex
                        );
                      break;
                    case "Are you willing to be assigned anywhere?":
                      applicationInformationFormMethods &&
                        applicationInformationFormMethods.onWillingToBeAssignedAnywhereChange(
                          value,
                          sectionIndex
                        );
                      break;
                  }
                  onChange(value);
                }}
                {...inputProps}
                mt="xs"
                sx={{ label: { cursor: "pointer" } }}
                error={fieldError}
                disabled={field.field_is_read_only}
                onLabel="ON"
                offLabel="OFF"
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "DROPDOWN":
        const dropdownOption = dropdownOptionValue.map((option) => {
          return {
            value: option.option_value,
            label: option.option_value,
          };
        });

        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <Select
                value={value as string}
                onChange={(value) => {
                  const prevValue = getValues(
                    `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`
                  );

                  onChange(value);
                  switch (field.field_name) {
                    case "General Name":
                      itemFormMethods?.onGeneralNameChange(sectionIndex, value);
                      pedItemFormMethods?.onGeneralNameChange(
                        value,
                        sectionIndex
                      );
                      itAssetRequestFormMethods?.onGeneralNameChange(
                        sectionIndex,
                        value
                      );
                      break;
                    case "Requesting Project":
                    case "Project Responsible for PCF Charges":
                    case "Requesting Project Chargeable":
                      itemFormMethods?.onProjectNameChange(value);
                      servicesFormMethods?.onProjectNameChange(value);
                      otherExpensesMethods?.onProjectNameChange(value);
                      pedPartFormMethods?.onProjectNameChange(value);
                      pedEquipmentFormMethods?.onProjectNameChange(value);
                      pedItemFormMethods?.onProjectNameChange(value);
                      paymentRequestFormMethods?.onProjectNameChange(value);
                      itAssetRequestFormMethods?.onProjectNameChange(value);
                      liquidationReimbursementFormMethods?.onProjectOrDepartmentNameChange();
                      pettyCashVoucherFormMethods?.onProjectOrDepartmentNameChange();
                      equipmentServiceReportMethods?.onProjectNameChange(value);
                      requestForPaymentFormMethods?.onProjectNameChange(value);
                      break;

                    case "Category":
                      otherExpensesMethods?.onCategoryChange(
                        sectionIndex,
                        value
                      );
                      pedEquipmentFormMethods?.onCategoryChange(
                        value,
                        sectionIndex
                      );
                      pedPartFormMethods?.onCategoryChange(value);
                      break;
                    case "Type of Order":
                      pedPartFormMethods?.onTypeOfOrderChange(
                        prevValue as string | null,
                        value
                      );
                      break;
                    case "Equipment Property Number":
                      pedPartFormMethods?.onPropertyNumberChange(value);
                      pedItemFormMethods?.onPropertyNumberChange(
                        value,
                        sectionIndex
                      );

                      break;
                    case "Equipment Name":
                      pedPartFormMethods?.onEquipmentNameChange(value);
                      pedEquipmentFormMethods?.onEquipmentNameChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "General Item Name":
                      pedPartFormMethods?.onGeneralItemNameChange(
                        value,
                        sectionIndex
                      );
                      equipmentServiceReportMethods?.onGeneralItemNameChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Component Category":
                      pedPartFormMethods?.onComponentCategoryChange(
                        value,
                        sectionIndex
                      );
                      equipmentServiceReportMethods?.onComponentCategoryChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Brand":
                      pedPartFormMethods?.onBrandChange(value, sectionIndex);
                      pedEquipmentFormMethods?.onBrandChange(
                        value,
                        sectionIndex
                      );
                      equipmentServiceReportMethods?.onBrandChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Model":
                      pedPartFormMethods?.onModelChange(value, sectionIndex);
                      equipmentServiceReportMethods?.onModelChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Part Number":
                      pedPartFormMethods?.onPartNumberChange(
                        value,
                        sectionIndex
                      );
                      equipmentServiceReportMethods?.onPartNumberChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Request Type":
                      pedItemFormMethods?.onRequestTypeChange(
                        prevValue as string | null,
                        value
                      );
                      paymentRequestFormMethods?.onRequestTypeChange(
                        value,
                        sectionIndex
                      );
                      liquidationReimbursementFormMethods?.onRequestTypeChange(
                        value
                      );
                      break;
                    case "Department":
                    case "Chargeable Department":
                      requestForPaymentFormMethods?.onDepartmentChange(
                        value,
                        prevValue as string | null
                      );
                      pettyCashVoucherFormMethods?.onProjectOrDepartmentNameChange();
                      liquidationReimbursementFormMethods?.onProjectOrDepartmentNameChange();
                      break;
                    case "Type of Transfer":
                      personnelTransferRequisitionMethods?.onTypeOfTransferChange(
                        value
                      );
                      break;
                    case "Manner of Transfer":
                      personnelTransferRequisitionMethods?.onMannerOfTransferChange(
                        value,
                        prevValue as string | null
                      );
                      break;
                    case "From":
                      personnelTransferRequisitionMethods?.onFromChange(value);
                      break;
                    case "To":
                      personnelTransferRequisitionMethods?.onToChange(value);
                      break;
                    case "Purpose":
                      personnelTransferRequisitionMethods?.onPurposeChange(
                        value,
                        prevValue as string | null
                      );
                      break;
                    case "Equipment Code":
                      personnelTransferRequisitionMethods?.onEquipmentCodeChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Employee No. (HRIS)":
                      personnelTransferRequisitionMethods?.onEmployeeNumberChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Employee Status":
                      personnelTransferRequisitionMethods?.onEmployeeStatusChange(
                        value,
                        prevValue as string | null,
                        sectionIndex
                      );
                      break;
                    case "Phase of Work":
                      personnelTransferRequisitionMethods?.onPhaseOfWorkChange(
                        value,
                        sectionIndex,
                        fieldIndex
                      );
                      break;
                    case "Equipment Category":
                      equipmentServiceReportMethods?.onCategoryChange(value);
                      break;
                    case "Equipment Type":
                      equipmentServiceReportMethods?.onEquipmentTypeChange(
                        value
                      );
                      break;
                    case "Property Number":
                      equipmentServiceReportMethods?.onPropertyNumberChange(
                        value
                      );
                      break;
                    case "Action Type":
                      equipmentServiceReportMethods?.onActionTypeChange(
                        value,
                        prevValue as string | null
                      );
                      break;
                    case "Payee Type":
                      requestForPaymentFormMethods?.onPayeeTypeChange(
                        value,
                        prevValue as string | null
                      );
                      break;
                    case "Purpose of Payment":
                      requestForPaymentFormMethods?.onPurposePlanChange(
                        value,
                        prevValue as string | null
                      );
                      break;
                    case "Charge To":
                      requestForPaymentFormMethods?.onChargeToChange(value);
                      break;
                    case "Mode of Payment":
                      requestForPaymentFormMethods?.onModeOfPaymentChange(
                        value,
                        sectionIndex
                      );
                      pettyCashVoucherFormMethods?.onModeOfPaymentChange(
                        value,
                        sectionIndex
                      );
                      liquidationReimbursementFormMethods?.onModeOfPaymentChange(
                        value,
                        fieldIndex,
                        sectionIndex
                      );
                      break;
                    case "Type of Request":
                      pettyCashVoucherFormMethods?.onTypeOfRequestChange(value);
                      liquidationReimbursementFormMethods?.onTypeOfRequestChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Position applying for":
                      applicationInformationFormMethods?.onPositionChange(
                        value
                      );
                      break;
                    case "Region":
                      applicationInformationFormMethods?.onRegionChange(value);
                      break;
                    case "Province":
                      applicationInformationFormMethods?.onProvinceChange(
                        value
                      );
                      break;
                    case "City":
                      applicationInformationFormMethods?.onCityChange(value);
                      break;
                    case "Barangay":
                      applicationInformationFormMethods?.onBarangayChange(
                        value
                      );
                      break;
                    case "Highest Educational Attainment":
                      applicationInformationFormMethods?.onHighestEducationalAttainmentChange(
                        value
                      );
                      break;
                    case "Field of Study":
                      applicationInformationFormMethods?.onFieldOfStudyChange(
                        value
                      );
                    case "Particular Type":
                      pettyCashVoucherFormMethods?.onParticularTypeChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Working Advances":
                      liquidationReimbursementFormMethods?.onWorkingAdvancesChange(
                        value,
                        sectionIndex
                      );
                      break;
                    case "Material Type":
                      liquidationReimbursementFormMethods?.onMaterialTypeChange(
                        value,
                        sectionIndex
                      );
                      break;
                  }
                }}
                onDropdownOpen={() => {
                  switch (field.field_name) {
                    case "General Item Name":
                      isEdit && pedPartFormMethods?.onGeneralItemNameOpen
                        ? pedPartFormMethods.onGeneralItemNameOpen(sectionIndex)
                        : null;
                      break;
                    case "Component Category":
                      isEdit &&
                        pedPartFormMethods?.onGeneralItemNameChange(
                          getValues(
                            `sections.${sectionIndex}.section_field.${0}.field_response`
                          ) as string,
                          sectionIndex,
                          {
                            fieldId: field.field_id,
                            response: getValues(
                              `sections.${sectionIndex}.section_field.${1}.field_response`
                            ) as string,
                            dupId: field.field_section_duplicatable_id,
                          }
                        );
                      break;
                    case "Brand":
                      isEdit &&
                        pedPartFormMethods?.onComponentCategoryChange(
                          getValues(
                            `sections.${sectionIndex}.section_field.${1}.field_response`
                          ) as string,
                          sectionIndex,
                          {
                            fieldId: field.field_id,
                            response: getValues(
                              `sections.${sectionIndex}.section_field.${2}.field_response`
                            ) as string,
                            dupId: field.field_section_duplicatable_id,
                          }
                        );
                      break;
                    case "Model":
                      isEdit &&
                        pedPartFormMethods?.onBrandChange(
                          getValues(
                            `sections.${sectionIndex}.section_field.${2}.field_response`
                          ) as string,
                          sectionIndex,
                          {
                            fieldId: field.field_id,
                            response: getValues(
                              `sections.${sectionIndex}.section_field.${3}.field_response`
                            ) as string,
                            dupId: field.field_section_duplicatable_id,
                          }
                        );
                      break;
                    case "Part Number":
                      isEdit &&
                        pedPartFormMethods?.onModelChange(
                          getValues(
                            `sections.${sectionIndex}.section_field.${3}.field_response`
                          ) as string,
                          sectionIndex,
                          {
                            fieldId: field.field_id,
                            response: getValues(
                              `sections.${sectionIndex}.section_field.${4}.field_response`
                            ) as string,
                            dupId: field.field_section_duplicatable_id,
                          }
                        );
                      break;
                  }
                }}
                data={dropdownOption}
                withAsterisk={field.field_is_required}
                {...inputProps}
                clearable
                error={fieldError}
                searchable={formslyFormName !== ""}
                nothingFound="Nothing found. Try a different keyword"
                limit={SELECT_OPTION_LIMIT}
                disabled={isEdit && field.field_name === "Requesting Project"}
                readOnly={field.field_is_read_only || isLoading}
                rightSection={isLoading && <Loader size={16} />}
                dropdownPosition="bottom"
                description={
                  personnelTransferRequisitionMethods &&
                  field.field_name === "Department"
                    ? "Which department will this employee go to?"
                    : ""
                }
                itemComponent={
                  liquidationReimbursementFormMethods &&
                  field.field_name === "Type of Request"
                    ? LRFTypeOfRequestSelectItem
                    : undefined
                }
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "AUTOCOMPLETE":
        const autoCompleteOption = dropdownOptionValue.map((option) => {
          return {
            value: option.option_value,
            label: option.option_value,
          };
        });

        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                value={value as string}
                onChange={(value) => {
                  onChange(value);
                }}
                data={autoCompleteOption}
                withAsterisk={field.field_is_required}
                {...inputProps}
                error={fieldError}
                limit={SELECT_OPTION_LIMIT}
                disabled={isEdit && field.field_name === "Requesting Project"}
                readOnly={field.field_is_read_only || isLoading}
                rightSection={isLoading && <Loader size={16} />}
                dropdownPosition="bottom"
                maxDropdownHeight={220}
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "MULTISELECT":
        const multiselectOption = field.options
          .map((option) => ({
            value: option.option_value,
            label: option.option_value,
          }))
          .filter((option) => option.value);

        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                value={value as string[]}
                onChange={(value) => onChange(value)}
                searchable={
                  formslyFormName === "Technical Questionnaire" ? true : false
                }
                data={multiselectOption}
                withAsterisk={field.field_is_required}
                {...inputProps}
                error={fieldError}
                nothingFound="Nothing found. Try a different keyword"
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "DATE":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => {
              const dateValue = value ? new Date(`${value}`) : undefined;
              if (field.field_name === "Year Graduated") {
                return (
                  <YearPickerInput
                    value={dateValue}
                    onChange={onChange}
                    withAsterisk={field.field_is_required}
                    {...inputProps}
                    icon={<IconCalendar size={16} />}
                    error={fieldError}
                    readOnly={field.field_is_read_only}
                    clearable
                  />
                );
              } else {
                const minDate =
                  field.field_name === "Date Needed" ? new Date() : undefined;

                return (
                  <DateInput
                    value={dateValue}
                    onChange={onChange}
                    withAsterisk={field.field_is_required}
                    {...inputProps}
                    icon={<IconCalendar size={16} />}
                    error={fieldError}
                    minDate={minDate}
                    valueFormat="YYYY-MM-DD"
                    readOnly={field.field_is_read_only}
                    clearable
                  />
                );
              }
            }}
            rules={{ ...fieldRules }}
          />
        );

      case "TIME":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange, onBlur } }) => (
              <TimeInput
                {...inputProps}
                value={value as string}
                onChange={onChange}
                onBlur={onBlur}
                ref={timeInputRef}
                error={fieldError}
                rightSection={
                  !field.field_is_read_only && (
                    <ActionIcon
                      onClick={() => timeInputRef.current?.showPicker()}
                    >
                      <IconClock size="1rem" stroke={1.5} />
                    </ActionIcon>
                  )
                }
                icon={<IconClock size={16} />}
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "FILE":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <Flex w="100%" align="flex-end" gap="xs">
                {["Certification", "License"].includes(field.field_name) && (
                  <Checkbox
                    checked={!field.field_is_read_only}
                    mb="xs"
                    readOnly
                  />
                )}
                <FileInput
                  {...inputProps}
                  icon={<IconFile size={16} />}
                  clearable={!field.field_is_read_only}
                  multiple={false}
                  value={value as File | null | undefined}
                  onChange={onChange}
                  error={fieldError}
                  sx={{ width: prevFileLink ? "96%" : "100%" }}
                  disabled={field.field_is_read_only}
                  description={field.field_description}
                />
                {parseJSONIfValid(`${value}`) && isEdit !== undefined ? (
                  <Tooltip
                    label="Open last saved file in new tab"
                    openDelay={200}
                  >
                    <ActionIcon
                      mb={4}
                      p={4}
                      variant="light"
                      color="blue"
                      onClick={() => window.open(`${prevFileLink}`, "_blank")}
                    >
                      <IconExternalLink />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
              </Flex>
            )}
            rules={{
              ...fieldRules,
              validate: {
                fileSize: (value) => {
                  if (!value) return true;
                  const formattedValue = value as File;
                  return formattedValue.size <= MAX_FILE_SIZE
                    ? true
                    : `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`;
                },
              },
            }}
          />
        );

      case "MULTIPLE CHOICE":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <Radio.Group
                {...inputProps}
                value={value as string}
                onChange={onChange}
                mb="md"
              >
                <Stack mt="xs">
                  {field.options.map((option, optionIdx) => (
                    <Radio
                      ml="xs"
                      key={option.option_id}
                      value={option.option_value}
                      label={`${String.fromCharCode(65 + optionIdx)} ) ${
                        option.option_value
                      }`}
                      sx={{
                        input: { cursor: "pointer" },
                        label: { cursor: "pointer" },
                      }}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            )}
            rules={fieldRules}
          />
        );
    }
  };

  return <>{renderField(field)}</>;
};

export default RequestFormFields;

type LRFTypeOfRequestSelectItemProps = {
  value: string;
  label: string;
};

const LRFTypeOfRequestSelectItem = forwardRef<
  HTMLDivElement,
  LRFTypeOfRequestSelectItemProps
>(({ value, label, ...others }: LRFTypeOfRequestSelectItemProps, ref) => (
  <div ref={ref} {...others}>
    <Stack spacing={0}>
      <Text>{label}</Text>
      {value.includes("Materials") && (
        <List ml={12} fz={14}>
          <List.Item>Items</List.Item>
          <List.Item>Supplies</List.Item>
          <List.Item>Services</List.Item>
          <List.Item>Other Expenses</List.Item>
        </List>
      )}
    </Stack>
  </div>
));

LRFTypeOfRequestSelectItem.displayName = "LRFTypeOfRequestSelectItem";
