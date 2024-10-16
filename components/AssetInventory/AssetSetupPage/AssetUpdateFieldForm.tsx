import { checkUniqueField } from "@/backend/api/get";
import { updateCustomFields } from "@/backend/api/update";
import {
  customFieldFormValues,
  InventoryFieldRow,
  OptionType,
} from "@/utils/types";
import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  Group,
  Paper,
  Radio,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const fieldTypes = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Select" },
  { value: "TEXTAREA", label: "Text Area" },
  { value: "MULTISELECT", label: "Multi Select" },
];

type Props = {
  setCustomFields: Dispatch<SetStateAction<InventoryFieldRow[]>>;
  setShowUpdateForm: Dispatch<SetStateAction<boolean>>;
  categoryList: OptionType[];
  customFieldForm: customFieldFormValues;
  handleClickCustomField: (fieldId: string) => void;
};
const AssetUpdateFieldForm = ({
  setCustomFields,
  setShowUpdateForm,
  categoryList,
  customFieldForm,
  handleClickCustomField,
}: Props) => {
  const { control, handleSubmit, watch, reset } =
    useForm<customFieldFormValues>({
      defaultValues: customFieldForm,
    });

  const supabaseClient = useSupabaseClient();
  const selectedType = watch("fieldType");

  const onSubmit = async (data: customFieldFormValues) => {
    try {
      const originalFieldName = customFieldForm.fieldName;

      if (data.fieldName !== originalFieldName) {
        const checkIfFieldUnique = await checkUniqueField(supabaseClient, {
          fieldName: data.fieldName,
        });

        if (checkIfFieldUnique) {
          notifications.show({
            message: "Field name already exists",
            color: "orange",
          });
          return;
        }
      }

      const customFieldData = await updateCustomFields(supabaseClient, {
        customFieldFormValues: data,
        fieldId: customFieldForm.fieldId as string,
      });

      setCustomFields((prevFields) =>
        prevFields.map((field) =>
          field.field_id === customFieldForm.fieldId ? customFieldData : field
        )
      );
      handleClickCustomField(customFieldData.field_id);
      notifications.show({
        message: "Custom field created",
        color: "green",
      });

      reset();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handlAaddOption = (
    option: string,
    field: { value: string[]; onChange: (value: string[]) => void }
  ) => {
    if (option.trim()) {
      field.onChange([...field.value, option]);
      setNewOption("");
    }
  };
  const [newOption, setNewOption] = useState<string>("");

  return (
    <Paper p={20}>
      <Group position="right">
        <ActionIcon
          onClick={() => {
            setShowUpdateForm(false), reset();
          }}
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing="sm">
          <Text weight={500} size="lg" mb="md">
            Update Custom Field
          </Text>

          <Controller
            name="fieldName"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextInput
                required
                label="Field Label"
                placeholder="Enter field label"
                {...field}
                mb="md"
              />
            )}
          />

          <Controller
            name="fieldType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Field Type"
                required
                placeholder="Select field type"
                data={fieldTypes}
                {...field}
                mb="md"
              />
            )}
          />

          <Controller
            name="fieldIsRequired"
            control={control}
            render={({ field }) => (
              <Radio.Group
                label="Is Field Required?"
                {...field}
                value={field.value ? "true" : "false"}
                onChange={(value) => field.onChange(value === "true")}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio value="true" label="Required" />
                  <Radio value="false" label="Not Required" />
                </Group>
              </Radio.Group>
            )}
          />

          {(selectedType === "SELECT" || selectedType === "MULTISELECT") && (
            <>
              <Controller
                name="fieldOption"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <>
                    <TextInput
                      label="Add Option"
                      placeholder="Enter an option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      mb="md"
                    />
                    <Group position="center">
                      <Button
                        leftIcon={<IconPlus size={16} />}
                        variant="subtle"
                        onClick={() => handlAaddOption(newOption, field)}
                      >
                        Add Option
                      </Button>
                    </Group>

                    {field.value.length > 0 && (
                      <Stack>
                        <Text>List of options</Text>
                        {field.value.map((option: string, index: number) => (
                          <Group position="apart" key={index}>
                            <Group>
                              <IconPlus size={16} />
                              <Text>{option}</Text>
                            </Group>

                            <ActionIcon
                              variant="default"
                              color="red"
                              onClick={() => {
                                field.onChange(
                                  field.value.filter(
                                    (opt: string) => opt !== option
                                  )
                                );
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </>
                )}
              />
            </>
          )}

          <Divider />
          <Text size="sm">Choose a category </Text>
          <ScrollArea h={200}>
            <Group position="center">
              <Controller
                name="fieldCategory"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Stack>
                    <Checkbox
                      label="All Categories"
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          field.onChange(categoryList.map((cat) => cat.value));
                        } else {
                          field.onChange([]);
                        }
                      }}
                      checked={field.value.length === categoryList.length}
                    />
                    {categoryList.map((cat) => (
                      <Checkbox
                        key={cat.value}
                        label={cat.label}
                        value={cat.value}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          if (checked) {
                            field.onChange([...field.value, cat.value]);
                          } else {
                            field.onChange(
                              field.value.filter((c) => c !== cat.value)
                            );
                          }
                        }}
                        checked={field.value.includes(cat.value)}
                      />
                    ))}
                  </Stack>
                )}
              />
            </Group>
          </ScrollArea>

          <Group position="center">
            <Button fullWidth type="submit">
              Update Custom Field
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};

export default AssetUpdateFieldForm;
