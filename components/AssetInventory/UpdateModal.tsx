import { checkUniqueValue } from "@/backend/api/get";
import { updateDrawerData } from "@/backend/api/update";
import {
  CategoryTableRow,
  InventoryLocationSiteRow,
  SiteTableRow,
  SubCategory,
} from "@/utils/types";
import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type UpdateModalProps = {
  opened: boolean;
  close: () => void;
  typeId: string;
  type: "site" | "location" | "team_department" | "category" | "field";
  initialData?: string;
  initialDescription?: string;
  initialtypeId?: string;
  typeOption?: { value: string; label: string }[];
  setCurrentSiteList?: React.Dispatch<React.SetStateAction<SiteTableRow[]>>;
  setCurrentLocationList?: React.Dispatch<
    React.SetStateAction<InventoryLocationSiteRow[]>
  >;
  setCurrentCategoryList?: React.Dispatch<
    React.SetStateAction<CategoryTableRow[]>
  >;
  setCurrentSubCategoryList?: React.Dispatch<
    React.SetStateAction<SubCategory[]>
  >;
};

type FormValues = {
  siteId: string;
  categoryId: string;
  typeName: string;
  typeDescription: string;
};

const UpdateModal = ({
  opened,
  close,
  type,
  typeId,
  setCurrentSiteList,
  setCurrentLocationList,
  setCurrentCategoryList,
  setCurrentSubCategoryList,
  typeOption,
  initialtypeId = "",
  initialData = "",
  initialDescription = "",
}: UpdateModalProps) => {
  const supabaseClient = useSupabaseClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      typeName: initialData,
      typeDescription: initialDescription ? initialDescription : "",
      siteId: initialtypeId ? initialtypeId : "",
    },
  });

  useEffect(() => {
    if (opened) {
      reset({
        typeName: initialData,
        typeDescription: initialDescription ? initialDescription : "",
      });
    }
  }, [opened, initialData, reset]);

  const handleUpdate = async (data: FormValues) => {
    try {
      const { typeName } = data;
      if (initialData !== typeName) {
        const checkIfUniqueValue = await checkUniqueValue(supabaseClient, {
          type: type,
          typeValue: typeName.trim() || "",
        });
        if (checkIfUniqueValue) {
          notifications.show({
            message: `${type} already exist`,
            color: "red",
          });
          return;
        }
      }

      close();
      switch (type) {
        case "site":
          const updatedSite = await updateDrawerData(supabaseClient, {
            typeId: typeId,
            typeData: data,
            type: type,
          });
          if (setCurrentSiteList) {
            setCurrentSiteList((prev) => {
              const siteIndex = prev.findIndex(
                (site) => site.site_id === typeId
              );

              if (siteIndex !== -1) {
                const updatedList = [...prev];

                updatedList[siteIndex] = {
                  ...updatedList[siteIndex],
                  site_name: updatedSite.type_name,
                  site_description:
                    updatedSite.type_description ||
                    updatedList[siteIndex].site_description,
                };

                return updatedList;
              }
              return prev;
            });
          }
          break;
        case "location":
          const updatedLocation = await updateDrawerData(supabaseClient, {
            typeId: typeId,
            typeData: data,
            type: type,
          });
          if (setCurrentLocationList) {
            setCurrentLocationList((prev) => {
              const locationIndex = prev.findIndex(
                (location) => location.location_id === typeId
              );

              if (locationIndex !== -1) {
                const updatedList = [...prev];

                updatedList[locationIndex] = {
                  ...updatedList[locationIndex],
                  location_name: updatedLocation.type_name,
                };

                return updatedList;
              }
              return prev;
            });
          }
          break;
        case "category":
          const updatedCategory = await updateDrawerData(supabaseClient, {
            typeId: typeId,
            typeData: data,
            type: type,
          });
          if (setCurrentCategoryList) {
            setCurrentCategoryList((prev) => {
              const categoryIndex = prev.findIndex(
                (category) => category.category_id === typeId
              );

              if (categoryIndex !== -1) {
                const updatedList = [...prev];

                updatedList[categoryIndex] = {
                  ...updatedList[categoryIndex],
                  category_name: updatedCategory.type_name,
                };

                return updatedList;
              }
              return prev;
            });
          }
          break;
        case "field":
          const updatedSubCategory = await updateDrawerData(supabaseClient, {
            typeId: typeId,
            typeData: data,
            type: type,
          });
          if (setCurrentSubCategoryList) {
            setCurrentSubCategoryList((prev) => {
              const subCategoryIndexx = prev.findIndex(
                (subCategory) => subCategory.sub_category_id === typeId
              );

              if (subCategoryIndexx !== -1) {
                const updatedList = [...prev];

                updatedList[subCategoryIndexx] = {
                  ...updatedList[subCategoryIndexx],
                  sub_category_name: updatedSubCategory.type_name,
                };

                return updatedList;
              }
              return prev;
            });
          }
          break;
      }

      notifications.show({
        message: `${type} updated successfully`,
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: `Something went wrong`,
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      size="xl"
      withinPortal
      title={`Update ${type}`}
    >
      <form onSubmit={handleSubmit(handleUpdate)}>
        <Stack spacing="sm">
          {initialtypeId && type === "location" && (
            <Controller
              name="siteId"
              control={control}
              defaultValue={initialtypeId}
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <Select
                  data={typeOption || []}
                  label={"Site"}
                  withinPortal
                  placeholder={`Enter new ${type} name`}
                  error={errors.typeName?.message}
                  required
                  {...field}
                />
              )}
            />
          )}
          {initialtypeId && type === "field" && (
            <Controller
              name="categoryId"
              control={control}
              defaultValue={initialtypeId}
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <Select
                  data={typeOption || []}
                  label={"Category"}
                  withinPortal
                  placeholder={`Enter new ${type} name`}
                  error={errors.typeName?.message}
                  required
                  {...field}
                />
              )}
            />
          )}
          <Controller
            name="typeName"
            control={control}
            rules={{ required: "This field is required" }}
            render={({ field }) => (
              <TextInput
                label={`${type === "field" ? "Sub Category" : type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Name`}
                placeholder={`Enter new ${type} name`}
                error={errors.typeName?.message}
                required
                {...field}
              />
            )}
          />
          {initialDescription && (
            <Controller
              name="typeDescription"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <TextInput
                  label={`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} Description`}
                  placeholder={`Enter new ${type} name`}
                  error={errors.typeName?.message}
                  required
                  {...field}
                />
              )}
            />
          )}

          <Group position="right" mt="md">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button color="blue" type="submit">
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default UpdateModal;
