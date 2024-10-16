import { disableDrawerData } from "@/backend/api/update";
import {
  CategoryTableRow,
  InventoryFieldRow,
  LocationTableRow,
  SiteTableRow,
  SubCategory,
} from "@/utils/types";
import { Button, Group, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

type DisableModalProps = {
  opened: boolean;
  close: () => void;
  setCurrentSiteList?: React.Dispatch<React.SetStateAction<SiteTableRow[]>>;
  setCurrentLocationList?: React.Dispatch<
    React.SetStateAction<LocationTableRow[]>
  >;
  setCurrentCategoryList?: React.Dispatch<
    React.SetStateAction<CategoryTableRow[]>
  >;
  setCurrentSubCategoryList?: React.Dispatch<
    React.SetStateAction<SubCategory[]>
  >;
  setCurrentCustomFieldList?: React.Dispatch<
    React.SetStateAction<InventoryFieldRow[]>
  >;
  typeId: string;
  type: string;
};

const DisableModal = ({
  opened,
  close,
  type,
  typeId,
  setCurrentSiteList,
  setCurrentLocationList,
  setCurrentCategoryList,
  setCurrentSubCategoryList,
  setCurrentCustomFieldList,
}: DisableModalProps) => {
  const supabaseClient = useSupabaseClient();
  const handleConfirm = async () => {
    try {
      switch (type) {
        case "site":
          if (!setCurrentSiteList) return;
          await disableDrawerData(supabaseClient, {
            type: "site",
            typeId: typeId,
          });
          setCurrentSiteList((prev) =>
            prev.filter((site) => site.site_id !== typeId)
          );
          break;
        case "location":
          if (!setCurrentLocationList) return;
          await disableDrawerData(supabaseClient, {
            type: "location",
            typeId: typeId,
          });
          setCurrentLocationList((prev) =>
            prev.filter((location) => location.location_id !== typeId)
          );
        case "category":
          if (!setCurrentCategoryList) return;
          await disableDrawerData(supabaseClient, {
            type: "category",
            typeId: typeId,
          });
          setCurrentCategoryList((prev) =>
            prev.filter((location) => location.category_id !== typeId)
          );
        case "Sub Category":
          if (!setCurrentSubCategoryList) return;
          await disableDrawerData(supabaseClient, {
            type: "field",
            typeId: typeId,
          });

          setCurrentSubCategoryList((prev) =>
            prev.filter((location) => location.sub_category_id !== typeId)
          );

        case "Custom Field":
          if (!setCurrentCustomFieldList) return;
          await disableDrawerData(supabaseClient, {
            type: "field",
            typeId: typeId,
          });

          setCurrentCustomFieldList((prev) =>
            prev.filter((location) => location.field_id !== typeId)
          );
        default:
          break;
      }
      close();
      notifications.show({
        message: `${type} is deleted`,
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
      title={`Are you sure you want to disable this ${type}?`}
    >
      <p>This action cannot be undone. Do you want to proceed?</p>

      <Group position="right" mt="md">
        <Button variant="default" onClick={close}>
          Cancel
        </Button>
        <Button color="red" onClick={handleConfirm}>
          Confirm
        </Button>
      </Group>
    </Modal>
  );
};

export default DisableModal;
