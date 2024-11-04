import {
  checkItemName,
  getCSIDescriptionOptionBasedOnDivisionId,
  getItemDivisionOption,
  getItemUnitOfMeasurementOption,
} from "@/backend/api/get";
import { createItem } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { GL_ACCOUNT_CHOICES } from "@/utils/constant";
import { Database } from "@/utils/database";
import { removeDuplicates } from "@/utils/functions";
import { ItemForm } from "@/utils/types";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Loader,
  LoadingOverlay,
  MultiSelect,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import InputAddRemove from "../InputAddRemove";
import MoveUpAndDown from "../MoveUpAndDown";

type Props = {
  setIsCreatingItem: Dispatch<SetStateAction<boolean>>;
};

const CreateItem = ({ setIsCreatingItem }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();

  const [divisionIdOption, setDivisionIdOption] = useState<
    { label: string; value: string }[]
  >([]);
  const [unitOfMeasurementOption, setUnitOfMeasurementOption] = useState<
    { label: string; value: string }[]
  >([]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);
  const [divisionDescriptionOption, setDivisionDescriptionOption] = useState<
    { label: string; value: string }[]
  >([]);
  const [
    isFetchingDivisionDescriptionOption,
    setIsFetchingDivisionDescriptionOption,
  ] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsFetchingOptions(true);
        const divisionOption = await getItemDivisionOption(supabaseClient);
        divisionOption &&
          setDivisionIdOption(
            divisionOption.map((divisionId) => {
              return {
                label: `${divisionId.csi_code_division_description}`,
                value: `${divisionId.csi_code_division_id}`,
              };
            })
          );

        const unitOfMeasurementOption = await getItemUnitOfMeasurementOption(
          supabaseClient,
          { teamId: activeTeam.team_id }
        );
        unitOfMeasurementOption &&
          setUnitOfMeasurementOption(
            unitOfMeasurementOption.map((uom) => {
              return {
                label: `${uom.item_unit_of_measurement}`,
                value: `${uom.item_unit_of_measurement}`,
              };
            })
          );
      } catch {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsFetchingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const { register, getValues, formState, handleSubmit, control, setValue } =
    useForm<ItemForm>({
      defaultValues: {
        descriptions: [{ description: "", withUoM: false }],
        generalName: "",
        unit: "",
        glAccount: "",
        isAvailable: true,
        isPedItem: true,
      },
    });

  const { append, remove, fields, swap } = useFieldArray<ItemForm>({
    control,
    name: "descriptions",
    rules: { minLength: 1, maxLength: 20 },
  });

  const onAddInput = () => append({ description: "", withUoM: false });

  const onSubmit = async (data: ItemForm) => {
    try {
      if (!teamMember) throw new Error("Team member not found");
      await createItem(supabaseClient, {
        itemDescription: data.descriptions.map((description, index) => {
          return {
            description: description.description.toUpperCase().trim(),
            withUoM: description.withUoM,
            order: index + 1,
          };
        }),
        itemData: {
          item_general_name: data.generalName.toUpperCase().trim(),
          item_is_available: data.isAvailable,
          item_unit: data.unit,
          item_gl_account: data.glAccount,
          item_team_id: activeTeam.team_id,
          item_division_id_list: data.division.map((id) => `'${id}'`),
          item_level_three_description: data.divisionDescription,
          item_is_ped_item: data.isPedItem,
        },
      });

      notifications.show({
        message: "Item created.",
        color: "green",
      });
      setIsCreatingItem(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    return;
  };

  const fetchDivisionDescriptionOption = async (value: string[]) => {
    try {
      setIsFetchingDivisionDescriptionOption(true);
      setValue("divisionDescription", "");
      const data = await getCSIDescriptionOptionBasedOnDivisionId(
        supabaseClient,
        {
          divisionId: value,
        }
      );
      const divisionDescriptionOption = removeDuplicates(
        data,
        "csi_code_level_three_description"
      ).map((description) => {
        return {
          label: description.csi_code_level_three_description,
          value: description.csi_code_level_three_description,
        };
      });
      setDivisionDescriptionOption(divisionDescriptionOption);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setValue("division", []);
    } finally {
      setIsFetchingDivisionDescriptionOption(false);
    }
  };

  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting || isFetchingOptions} />
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
                      itemName: value.toUpperCase().trim(),
                      teamId: activeTeam.team_id,
                    });
                    return isExisting ? "Item already exists" : true;
                  },
                  validCharacters: (value) =>
                    value.match(/^[a-zA-Z0-9 ]*$/)
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
                  data={unitOfMeasurementOption}
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
                  onChange={(value) => {
                    fetchDivisionDescriptionOption(value);
                    onChange(value);
                  }}
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
            <Controller
              control={control}
              name="divisionDescription"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value}
                  onChange={onChange}
                  data={divisionDescriptionOption}
                  error={formState.errors.divisionDescription?.message}
                  searchable
                  clearable
                  label="Division Description"
                  disabled={divisionDescriptionOption.length === 0}
                  rightSection={
                    isFetchingDivisionDescriptionOption && <Loader size={16} />
                  }
                  required
                />
              )}
              rules={{
                required: {
                  message: "Division Description is required",
                  value: true,
                },
              }}
            />
            <Controller
              control={control}
              name="isPedItem"
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  sx={{
                    input: {
                      cursor: "pointer",
                    },
                  }}
                  label={"PED Item"}
                  checked={value}
                  onChange={onChange}
                />
              )}
            />
            {fields.map((field, index) => {
              return (
                <Flex key={field.id} gap="xs">
                  {(index !== 0 || index !== fields.length - 1) && (
                    <Box sx={{ alignSelf: "center" }}>
                      <MoveUpAndDown
                        canUp={index !== 0}
                        canDown={index !== fields.length - 1}
                        onUp={() => swap(index, index - 1)}
                        onDown={() => swap(index, index + 1)}
                      />
                    </Box>
                  )}
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
                  <Controller
                    control={control}
                    name={`descriptions.${index}.withUoM`}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox
                        sx={{
                          input: {
                            cursor: "pointer",
                          },
                        }}
                        mt={32}
                        label={"with UoM?"}
                        checked={value}
                        onChange={onChange}
                      />
                    )}
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
