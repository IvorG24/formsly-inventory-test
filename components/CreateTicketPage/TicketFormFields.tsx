import { MAX_FILE_SIZE, MAX_FILE_SIZE_IN_MB } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { formatCSICode } from "@/utils/string";
import { CreateTicketFormValues, TicketSection } from "@/utils/types";
import {
  Autocomplete,
  Checkbox,
  FileInput,
  Loader,
  MultiSelect,
  Select,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconFile } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  category: string;
  isLoading: boolean | undefined;
  ticketField: TicketSection["ticket_section_fields"][0];
  ticketFieldIdx: number;
  ticketSectionIdx: number;
  isEdit?: boolean;
  requestItemCSIMethods?: {
    onCSICodeChange: (sectionIndex: number, value: string | null) => void;
  };
  requestItemOptionMethods?: {
    onItemNameChange: (sectionIndex: number, value: string | null) => void;
    onItemDescriptionChange: (
      sectionIndex: number,
      value: string | null
    ) => void;
  };
  itemRequestMethods?: {
    onGeneralNameBlur: (value: string | null) => void;
    onDivisionBlur: (value: string[] | null) => void;
    onPEDItemChange: (value: boolean) => void;
    onITAssetItemChange: (value: boolean) => void;
  };
};

const TicketFormFields = ({
  category,
  isLoading,
  ticketField,
  ticketFieldIdx,
  ticketSectionIdx,
  requestItemCSIMethods,
  requestItemOptionMethods,
  itemRequestMethods,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateTicketFormValues>();

  const fieldError =
    errors.ticket_sections?.[ticketSectionIdx]?.ticket_section_fields?.[
      ticketFieldIdx
    ]?.ticket_field_response?.message;

  const inputProps = {
    label: ticketField.ticket_field_name,
    readOnly: ticketField.ticket_field_is_read_only,
    variant: ticketField.ticket_field_is_read_only ? "filled" : "default",
    error: fieldError,
  };

  const fieldRules = {
    required: {
      value: ticketField.ticket_field_is_required,
      message: `${ticketField.ticket_field_name.replace(
        /\?/g,
        ""
      )} is required`,
    },
  };

  const renderField = (field: TicketSection["ticket_section_fields"][0]) => {
    switch (field.ticket_field_type) {
      case "TEXT":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field: { value, onChange } }) => (
              <TextInput
                {...inputProps}
                value={`${value}`}
                onChange={(e) => {
                  let value = e.currentTarget.value;

                  if (
                    category === "Request Custom CSI" &&
                    ticketField.ticket_field_name === "CSI Code"
                  ) {
                    value = formatCSICode(value);
                  } else if (
                    ["Part Number", "General Name", "Description"].includes(
                      ticketField.ticket_field_name
                    )
                  ) {
                    value = value.toUpperCase();
                  }

                  onChange(value);
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.value;
                  switch (field.ticket_field_name) {
                    case "General Name":
                      itemRequestMethods &&
                        itemRequestMethods.onGeneralNameBlur(value);
                      break;
                  }
                }}
                error={fieldError}
                withAsterisk={field.ticket_field_is_required}
                rightSection={isLoading && <Loader size={16} />}
                readOnly={field.ticket_field_is_read_only || isLoading}
                variant={
                  field.ticket_field_is_read_only || isLoading
                    ? "filled"
                    : "default"
                }
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "TEXTAREA":
        return (
          <Textarea
            {...inputProps}
            {...register(
              `ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`,
              {
                ...fieldRules,
              }
            )}
            minRows={3}
            error={fieldError}
            withAsterisk={field.ticket_field_is_required}
            rightSection={isLoading && <Loader size={16} />}
            readOnly={field.ticket_field_is_read_only || isLoading}
            variant={
              field.ticket_field_is_read_only || isLoading
                ? "filled"
                : "default"
            }
          />
        );

      case "SELECT":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field: { value, onChange } }) => (
              <Select
                value={value as string}
                onChange={(value) => {
                  onChange(value);
                  if (ticketField.ticket_field_name === "CSI Code Description")
                    requestItemCSIMethods?.onCSICodeChange(
                      ticketSectionIdx,
                      value
                    );
                  else if (ticketField.ticket_field_name === "Item Name")
                    requestItemOptionMethods?.onItemNameChange(
                      ticketSectionIdx,
                      value
                    );
                  else if (ticketField.ticket_field_name === "Item Description")
                    requestItemOptionMethods?.onItemDescriptionChange(
                      ticketSectionIdx,
                      value
                    );
                }}
                data={ticketField.ticket_field_option}
                limit={250}
                nothingFound={<Text>Nothing found!</Text>}
                withAsterisk={field.ticket_field_is_required}
                {...inputProps}
                sx={{
                  display: Boolean(ticketField.ticket_field_hidden)
                    ? "none"
                    : "inline",
                }}
                clearable
                error={fieldError}
                searchable
                rightSection={isLoading && <Loader size={16} />}
                readOnly={field.ticket_field_is_read_only || isLoading}
                variant={
                  field.ticket_field_is_read_only || isLoading
                    ? "filled"
                    : "default"
                }
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "MULTISELECT":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                value={value as string[]}
                onChange={onChange}
                onBlur={() => {
                  switch (field.ticket_field_name) {
                    case "Division":
                      itemRequestMethods &&
                        itemRequestMethods.onDivisionBlur(
                          value as string[] | null
                        );
                      break;
                  }
                }}
                data={ticketField.ticket_field_option}
                limit={250}
                nothingFound={<Text>Nothing found!</Text>}
                withAsterisk={field.ticket_field_is_required}
                {...inputProps}
                sx={{
                  display: Boolean(ticketField.ticket_field_hidden)
                    ? "none"
                    : "inline",
                }}
                clearable
                error={fieldError}
                searchable
                rightSection={isLoading && <Loader size={16} />}
                readOnly={field.ticket_field_is_read_only || isLoading}
                variant={
                  field.ticket_field_is_read_only || isLoading
                    ? "filled"
                    : "default"
                }
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "FILE":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field }) => (
              <FileInput
                {...inputProps}
                icon={<IconFile size={16} />}
                value={field.value as File | null}
                clearable
                multiple={false}
                onChange={field.onChange}
                error={fieldError}
              />
            )}
            rules={{
              ...fieldRules,
              validate: {
                fileSize: (value) => {
                  if (!value) return true;
                  const formattedValue = value as File;
                  return formattedValue.size !== undefined
                    ? formattedValue.size <= MAX_FILE_SIZE ||
                        `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`
                    : true;
                },
              },
            }}
          />
        );

      case "AUTOCOMPLETE":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                data={ticketField.ticket_field_option}
                value={value as string}
                onChange={(value) => {
                  if (ticketField.ticket_field_name === "Unit of Measure") {
                    onChange(value);
                  } else {
                    onChange(value.toUpperCase());
                  }
                }}
                withAsterisk={field.ticket_field_is_required}
                limit={250}
                maxDropdownHeight={200}
                sx={{ style: "upperCase" }}
                {...inputProps}
                rightSection={isLoading && <Loader size={16} />}
                readOnly={field.ticket_field_is_read_only || isLoading}
                variant={
                  field.ticket_field_is_read_only || isLoading
                    ? "filled"
                    : "default"
                }
              />
            )}
            rules={{ ...fieldRules }}
          />
        );

      case "CHECKBOX":
        return (
          <Controller
            control={control}
            name={`ticket_sections.${ticketSectionIdx}.ticket_section_fields.${ticketFieldIdx}.ticket_field_response`}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                {...inputProps}
                checked={safeParse(value as string) as boolean}
                onChange={(e) => {
                  const value = e.currentTarget.checked;
                  switch (field.ticket_field_name) {
                    case "PED Item":
                      itemRequestMethods &&
                        itemRequestMethods.onPEDItemChange(value);
                      break;
                    case "IT Asset Item":
                      itemRequestMethods &&
                        itemRequestMethods.onITAssetItemChange(value);
                      break;
                  }
                  onChange(value);
                }}
                error={fieldError}
                sx={{ input: { cursor: "pointer" } }}
              />
            )}
            rules={{ ...fieldRules }}
          />
        );
    }
  };

  return <>{renderField(ticketField)}</>;
};

export default TicketFormFields;
