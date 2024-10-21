import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_IN_MB,
  MAX_INT,
  MAX_TEXT_LENGTH,
  SELECT_OPTION_LIMIT,
} from "@/utils/constant";
import { parseJSONIfValid } from "@/utils/string";
import { FieldTableRow, OptionTableRow } from "@/utils/types";
import {
  ActionIcon,
  Autocomplete,
  Checkbox,
  FileInput,
  Flex,
  Loader,
  MultiSelect,
  NumberInput,
  Radio,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconClock,
  IconExternalLink,
  IconFile,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import isURL from "validator/lib/isURL";
import { InventoryFormValues } from "./CreateAssetPage";

type RequestFormFieldsProps = {
  field: FieldTableRow & {
    options: OptionTableRow[];
  } & {
    field_section_duplicatable_id: string | undefined;
    field_description?: string;
    field_prefix?: string | null;
  };
  sectionIndex: number;
  fieldIndex: number;
  formslyFormName?: string;
  isEdit?: boolean;
  isLoading: boolean | undefined;
  assetFormMethods?: {
    onCategoryNameChange: (index: number, value: string | null) => void;
    onSiteNameChange: (index: number, value: string | null) => void;
  };
  eventFormMethods?: {
    onCheckinCategoryChange: (index: number, value: string | null) => void;
    onSiteCategorychange: (index: number, value: string | null) => void;
  };
};

const InventoryFormFields = ({
  field,
  sectionIndex,
  fieldIndex,
  isEdit,
  isLoading,
  formslyFormName = "",
  assetFormMethods,
  eventFormMethods,
}: RequestFormFieldsProps) => {
  const {
    register,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useFormContext<InventoryFormValues>();

  const dropdownOptionValue = useWatch({
    control,
    name: `sections.${sectionIndex}.section_field.${fieldIndex}.field_option`,
  });

  const timeInputRef = useRef<HTMLInputElement>(null);

  const [prevFileLink, setPrevFileLink] = useState<string | null>(null);

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
      case "TEXT":
        return (
          <Controller
            control={control}
            name={`sections.${sectionIndex}.section_field.${fieldIndex}.field_response`}
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={(value ?? "") as string}
                onChange={(e) => {
                  const value = e.currentTarget.value;

                  onChange(value);
                }}
                withAsterisk={field.field_is_required}
                {...inputProps}
                error={fieldError}
                readOnly={field.field_is_read_only || isLoading}
                rightSection={isLoading && <Loader size={16} />}
                type={
                  field.field_name === "Email Address" ? "email" : undefined
                }
                icon={field.field_name === "Contact Number" ? "+63" : ""}
              />
            )}
            rules={{
              ...fieldRules,
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
                  ].includes(field.field_name)
                    ? 2
                    : 0
                }
                min={0}
                max={MAX_INT}
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
                withinPortal={true}
                onChange={(value) => {
                  onChange(value);
                  switch (field.field_name) {
                    case "Category":
                      assetFormMethods?.onCategoryNameChange(
                        sectionIndex,
                        value
                      );
                      break;
                    case "Site":
                      assetFormMethods?.onSiteNameChange(sectionIndex, value);
                      eventFormMethods?.onSiteCategorychange(
                        sectionIndex,
                        value
                      );
                      break;
                    case "Check in from":
                      eventFormMethods?.onCheckinCategoryChange(
                        sectionIndex,
                        value
                      );
                      break;
                    case "Check out to":
                      eventFormMethods?.onCheckinCategoryChange(
                        sectionIndex,
                        value
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

              if (field.field_name === "Return Date" || "Due Date") {
                return (
                  <DateInput
                    value={dateValue}
                    onChange={onChange}
                    withAsterisk={field.field_is_required}
                    {...inputProps}
                    popoverProps={{
                      withinPortal: true,
                      zIndex: 1000,
                    }}
                    icon={<IconCalendar size={16} />}
                    error={fieldError}
                    minDate={new Date()}
                    valueFormat="YYYY-MM-DD"
                    readOnly={field.field_is_read_only}
                    clearable
                  />
                );
              } else {
                return (
                  <DateInput
                    value={dateValue}
                    onChange={onChange}
                    popoverProps={{
                      withinPortal: true,
                      zIndex: 1000,
                    }}
                    withAsterisk={field.field_is_required}
                    {...inputProps}
                    icon={<IconCalendar size={16} />}
                    error={fieldError}
                    minDate={formslyFormName ? new Date() : undefined}
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
            render={({ field }) => (
              <TimeInput
                {...inputProps}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={timeInputRef}
                error={fieldError}
                rightSection={
                  <ActionIcon
                    onClick={() => timeInputRef.current?.showPicker()}
                  >
                    <IconClock size="1rem" stroke={1.5} />
                  </ActionIcon>
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
                  clearable
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
                      label={`${String.fromCharCode(65 + optionIdx)} ) ${option.option_value}`}
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

export default InventoryFormFields;
