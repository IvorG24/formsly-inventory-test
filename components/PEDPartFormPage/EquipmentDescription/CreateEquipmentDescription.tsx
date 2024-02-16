import {
  checkSerialNumber,
  getEquipmentBrandAndModelOption,
  getEquipmentPropertyCount,
} from "@/backend/api/get";
import { createEquipmentDescription } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import {
  EquipmentDescriptionForm,
  EquipmentDescriptionType,
  EquipmentWithCategoryType,
} from "@/utils/types";
import {
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  selectedEquipment: EquipmentWithCategoryType;
  setIsCreatingEquipmentDescription: Dispatch<SetStateAction<boolean>>;
  setEquipmentDescriptionList: Dispatch<
    SetStateAction<EquipmentDescriptionType[]>
  >;
  setEquipmentDescriptionCount: Dispatch<SetStateAction<number>>;
};

const CreateEquipmentDescription = ({
  selectedEquipment,
  setIsCreatingEquipmentDescription,
  setEquipmentDescriptionList,
  setEquipmentDescriptionCount,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();

  const [brandOption, setBrandOption] = useState<
    { label: string; value: string }[]
  >([]);
  const [modelOption, setModelOption] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const fetchBrandAndModelOption = async () => {
      try {
        const { brandList, modelList } = await getEquipmentBrandAndModelOption(
          supabaseClient
        );
        brandList &&
          setBrandOption(
            brandList.map((brand) => {
              return {
                label: `${brand.equipment_brand}`,
                value: `${brand.equipment_brand_id}`,
              };
            })
          );
        modelList &&
          setModelOption(
            modelList.map((model) => {
              return {
                label: `${model.equipment_model}`,
                value: `${model.equipment_model_id}`,
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
    fetchBrandAndModelOption();
  }, []);

  const { register, formState, handleSubmit, control } =
    useForm<EquipmentDescriptionForm>({
      defaultValues: {
        serialNumber: "",
        brand: "",
        model: "",
        isAvailable: true,
      },
    });

  const onSubmit = async (data: EquipmentDescriptionForm) => {
    try {
      const propertyNumber = await getEquipmentPropertyCount(supabaseClient);
      const newEquipmentDescription = await createEquipmentDescription(
        supabaseClient,
        {
          equipmentDescriptionData: {
            equipment_description_property_number: `${propertyNumber}`,
            equipment_description_serial_number:
              data.serialNumber.toLocaleUpperCase(),
            equipment_description_brand_id: data.brand,
            equipment_description_model_id: data.model,
            equipment_description_equipment_id: selectedEquipment.equipment_id,
            equipment_description_encoder_team_member_id:
              teamMember?.team_member_id,
            equipment_description_is_available: data.isAvailable,
          },
          brand: brandOption.find((brand) => brand.value === data.brand)
            ?.label as string,
          model: modelOption.find((model) => model.value === data.model)
            ?.label as string,
        }
      );
      setEquipmentDescriptionList((prev) => {
        prev.unshift(newEquipmentDescription);
        return prev;
      });
      setEquipmentDescriptionCount((prev) => prev + 1);
      notifications.show({
        message: "Equipment Description created.",
        color: "green",
      });
      setIsCreatingEquipmentDescription(false);
    } catch (e) {
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
          Add Equipment Description
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap={16}>
            <Controller
              control={control}
              name="brand"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value}
                  onChange={onChange}
                  data={brandOption}
                  withAsterisk
                  error={formState.errors.brand?.message}
                  searchable
                  clearable
                  label="Brand"
                />
              )}
              rules={{
                required: {
                  message: "Brand is required",
                  value: true,
                },
              }}
            />
            <Controller
              control={control}
              name="model"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value}
                  onChange={onChange}
                  data={modelOption}
                  withAsterisk
                  error={formState.errors.model?.message}
                  searchable
                  clearable
                  label="Model"
                />
              )}
              rules={{
                required: {
                  message: "Model is required",
                  value: true,
                },
              }}
            />
            <TextInput
              {...register("serialNumber", {
                required: {
                  message: "Serial number is required",
                  value: true,
                },
                validate: {
                  duplicate: async (value) => {
                    const isExisting = await checkSerialNumber(supabaseClient, {
                      serialNumber: value.toUpperCase(),
                      teamId: activeTeam.team_id,
                    });
                    return isExisting ? "Serial number already exists" : true;
                  },
                },
              })}
              withAsterisk
              w="100%"
              label="Serial Number"
              error={formState.errors.serialNumber?.message}
              sx={{
                input: {
                  textTransform: "uppercase",
                },
              }}
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
            onClick={() => setIsCreatingEquipmentDescription(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateEquipmentDescription;
