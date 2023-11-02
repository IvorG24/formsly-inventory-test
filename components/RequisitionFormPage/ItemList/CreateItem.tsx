import { checkItemName, getItemDivisionOption } from "@/backend/api/get";
import { createItem } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { GL_ACCOUNT_CHOICES, ITEM_UNIT_CHOICES } from "@/utils/constant";
import { Database } from "@/utils/database";
import { ItemForm, ItemWithDescriptionType } from "@/utils/types";
import {
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  MultiSelect,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import InputAddRemove from "../InputAddRemove";

type Props = {
  setIsCreatingItem: Dispatch<SetStateAction<boolean>>;
  setItemList: Dispatch<SetStateAction<ItemWithDescriptionType[]>>;
  setItemCount: Dispatch<SetStateAction<number>>;
};

const CreateItem = ({
  setIsCreatingItem,
  setItemList,
  setItemCount,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const formId = router.query.formId as string;

  const activeTeam = useActiveTeam();

  const [divisionIdOption, setDivisionIdOption] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const fetchDivisionOption = async () => {
      try {
        const option = await getItemDivisionOption(supabaseClient);

        option &&
          setDivisionIdOption(
            option.map((divisionId) => {
              return {
                label: `${divisionId.csi_code_division_description}`,
                value: `${divisionId.csi_code_division_id}`,
              };
            })
          );
      } catch {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      }
    };
    fetchDivisionOption();
  }, []);

  const { register, getValues, formState, handleSubmit, control } =
    useForm<ItemForm>({
      defaultValues: {
        descriptions: [{ description: "", withUoM: false }],
        generalName: "",
        unit: "",
        isAvailable: true,
      },
    });

  const { append, remove, fields } = useFieldArray<ItemForm>({
    control,
    name: "descriptions",
    rules: { minLength: 1, maxLength: 20 },
  });

  const onAddInput = () => append({ description: "", withUoM: false });

  const onSubmit = async (data: ItemForm) => {
    try {
      const newItem = await createItem(supabaseClient, {
        itemDescription: data.descriptions.map((description) => {
          return {
            description: description.description.toUpperCase(),
            withUoM: description.withUoM,
          };
        }),
        itemData: {
          item_general_name: data.generalName.toUpperCase(),
          item_is_available: data.isAvailable,
          item_unit: data.unit,
          item_gl_account: data.glAccount,
          item_team_id: activeTeam.team_id,
          item_division_id_list: data.division.map((id) => `'${id}'`),
        },
        formId: formId,
      });
      setItemList((prev) => {
        prev.unshift(newItem);
        return prev;
      });
      setItemCount((prev) => prev + 1);
      notifications.show({
        message: "Item created.",
        color: "green",
      });
      setIsCreatingItem(false);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    return;
  };

  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting} />
      <Stack spacing={16}>
        <Title m={0} p={0} order={3}>
          Add Item
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap={16}>
            <TextInput
              {...register("generalName", {
                required: { message: "General Name is required", value: true },
                minLength: {
                  message: "General Name must have atleast 3 characters",
                  value: 3,
                },
                maxLength: {
                  message: "General Name must be shorter than 500 characters",
                  value: 500,
                },
                validate: {
                  duplicate: async (value) => {
                    const isExisting = await checkItemName(supabaseClient, {
                      itemName: value.toUpperCase(),
                      teamId: activeTeam.team_id,
                    });
                    return isExisting ? "Item already exists" : true;
                  },
                  validCharacters: (value) =>
                    value.match(/^[a-zA-Z ]*$/)
                      ? true
                      : "General name must not include invalid character/s",
                },
              })}
              withAsterisk
              w="100%"
              label="General Name"
              sx={{
                input: {
                  textTransform: "uppercase",
                },
              }}
              error={formState.errors.generalName?.message}
            />
            <Controller
              control={control}
              name="unit"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value as string}
                  onChange={onChange}
                  data={ITEM_UNIT_CHOICES}
                  withAsterisk
                  error={formState.errors.unit?.message}
                  searchable
                  clearable
                  label="Base Unit of Measurement"
                />
              )}
              rules={{
                required: {
                  message: "Base Unit of Measurement is required",
                  value: true,
                },
              }}
            />
            <Controller
              control={control}
              name="glAccount"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value as string}
                  onChange={onChange}
                  data={GL_ACCOUNT_CHOICES}
                  withAsterisk
                  error={formState.errors.glAccount?.message}
                  searchable
                  clearable
                  label="GL Account"
                />
              )}
              rules={{
                required: {
                  message: "GL Account is required",
                  value: true,
                },
              }}
            />
            <Controller
              control={control}
              name="division"
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  value={value as string[]}
                  onChange={onChange}
                  data={divisionIdOption}
                  withAsterisk
                  error={formState.errors.division?.message}
                  searchable
                  clearable
                  label="Division"
                />
              )}
              rules={{
                required: {
                  message: "Division is required",
                  value: true,
                },
              }}
            />
            {fields.map((field, index) => {
              return (
                <Flex key={field.id} gap="xs">
                  <TextInput
                    withAsterisk
                    label={`Description #${index + 1}`}
                    {...register(`descriptions.${index}.description`, {
                      required: `Description #${index + 1} is required`,
                      minLength: {
                        message: "Description must be at least 3 characters",
                        value: 3,
                      },
                      validate: {
                        isDuplicate: (value) => {
                          let count = 0;
                          getValues("descriptions").map(
                            ({ description }: { description: string }) => {
                              if (description === value) {
                                count += 1;
                              }
                            }
                          );
                          if (count > 1) {
                            return "Invalid Duplicate Description";
                          } else {
                            return true;
                          }
                        },
                      },
                    })}
                    sx={{
                      input: {
                        textTransform: "uppercase",
                      },
                      flex: 1,
                    }}
                    error={
                      formState.errors.descriptions !== undefined &&
                      formState.errors.descriptions[index]?.description?.message
                    }
                  />
                  <Checkbox
                    {...register(`descriptions.${index}.withUoM`)}
                    sx={{
                      input: {
                        cursor: "pointer",
                      },
                    }}
                    mt={32}
                    label={"with UoM?"}
                  />
                </Flex>
              );
            })}
            <InputAddRemove
              canAdd={fields.length < 20}
              onAdd={onAddInput}
              canRemove={fields.length > 1}
              onRemove={() => remove(fields.length - 1)}
            />
            <Checkbox
              label="Available"
              {...register("isAvailable")}
              sx={{ input: { cursor: "pointer" } }}
            />
          </Flex>

          <Button type="submit" miw={100} mt={30} mr={14}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            miw={100}
            mt={30}
            mr={14}
            onClick={() => setIsCreatingItem(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateItem;
