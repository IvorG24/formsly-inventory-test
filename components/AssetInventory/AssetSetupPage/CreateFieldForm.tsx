import { checkUniqueField } from "@/backend/api/get";
import { createCustomFields } from "@/backend/api/post";
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
  setShowCustomForm: Dispatch<SetStateAction<boolean>>;
  categoryList: OptionType[];
  canAddData: boolean;
  sectionId: string;
  type: "employee" | "asset" | "customer" | "maintenance" | "warranty";
};
const CreateFieldForm = ({
  setCustomFields,
  setShowCustomForm,
  categoryList,
  canAddData,
  sectionId,
  type = "asset",
}: Props) => {
  const { control, handleSubmit, watch, reset } =
    useForm<customFieldFormValues>();
  const supabaseClient = useSupabaseClient();
  const selectedType = watch("fieldType");

  const onSubmit = async (data: customFieldFormValues) => {
    try {
      if (!canAddData) {
        notifications.show({
          message: "Action not allowed",
          color: "red",
        });
        return;
      }
      const checkIfFieldUnique = await checkUniqueField(supabaseClient, {
        fieldName: data.fieldName,
        sectionId: sectionId,
      });
      if (checkIfFieldUnique) {
        notifications.show({
          message: "Field name already exist",
          color: "orange",
        });
        return;
      }
      const customFieldData = await createCustomFields(supabaseClient, {
        customFieldFormValues: data,
        sectionId: sectionId,
      });

      setCustomFields((prev) => [...prev, customFieldData]);

      notifications.show({
        message: "Custom field created",
        color: "green",
      });
      setShowCustomForm(false);
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
            setShowCustomForm(false), reset();
          }}
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing="md">
          <Text weight={500} size="lg" mb="md">
            Create Custom Field
          </Text>

          <Controller
            name="fieldName"
            control={control}
            defaultValue=""
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
            defaultValue=""
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
            defaultValue={true}
            render={({ field }) => (
              <Checkbox
                label="Required"
                {...field}
                value={field.value ? "true" : "false"}
              />
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
                        <Text fw={500}>List of Options</Text>
                        {field.value.map((option: string, index: number) => (
                          <Group position="apart" key={index}>
                            <Group>
                              <IconPlus color="#228be6" size={16} />
                              <Text>{option}</Text>
                            </Group>

                            <ActionIcon
                              variant="filled"
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
          {type === "asset" && (
            <>
              <Divider />
              <Text fw={500}>Choose a Category</Text>
              <ScrollArea mih={100} mah={400}>
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
                              field.onChange(
                                categoryList.map((cat) => cat.value)
                              );
                            } else {
                              field.onChange([]);
                            }
                          }}
                          checked={
                            (field.value ?? []).length === categoryList.length
                          }
                        />
                        {categoryList.map((cat) => (
                          <Checkbox
                            key={cat.value}
                            label={cat.label}
                            value={cat.value}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;
                              if (checked) {
                                field.onChange([
                                  ...(field.value ?? []),
                                  cat.value,
                                ]);
                              } else {
                                field.onChange(
                                  (field.value ?? []).filter(
                                    (c) => c !== cat.value
                                  )
                                );
                              }
                            }}
                            checked={(field.value ?? []).includes(cat.value)}
                          />
                        ))}
                      </Stack>
                    )}
                  />
                </Group>
              </ScrollArea>
              <Divider />
            </>
          )}

          <Group position="center">
            <Button fullWidth type="submit">
              Create Custom Field
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};

export default CreateFieldForm;
