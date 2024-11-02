import { disableDrawerData, updateDisableField } from "@/backend/api/update";
import { InventoryFieldRow } from "@/utils/types";
import { Button, Group, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

type DisableModalProps = {
  opened: boolean;
  close: () => void;
  setCurrentCustomFieldList?: React.Dispatch<
    React.SetStateAction<InventoryFieldRow[]>
  >;
  handleFetch?: (page: number) => void;
  activePage?: number;
  typeId: string;
  type: string;
};

const DisableModal = ({
  opened,
  close,
  type,
  typeId,
  setCurrentCustomFieldList,
  activePage,
  handleFetch,
}: DisableModalProps) => {
  const supabaseClient = useSupabaseClient();
  const handleConfirm = async () => {
    try {
      switch (type) {
        case "site":
          await disableDrawerData(supabaseClient, {
            type: "site",
            typeId: typeId,
          });
          break;
        case "location":
          await disableDrawerData(supabaseClient, {
            type: "location",
            typeId: typeId,
          });
        case "category":
          await disableDrawerData(supabaseClient, {
            type: "category",
            typeId: typeId,
          });
        case "Sub Category":
          await disableDrawerData(supabaseClient, {
            type: "sub_category",
            typeId: typeId,
          });
        case "Custom Field":
          if (!setCurrentCustomFieldList) return;
          await updateDisableField(supabaseClient, {
            fieldId: typeId,
          });
          setCurrentCustomFieldList((prev) =>
            prev.filter((location) => location.field_id !== typeId)
          );
        case "customer":
          await disableDrawerData(supabaseClient, {
            type: "customer",
            typeId: typeId,
          });
        default:
          break;
      }

      close();
      notifications.show({
        message: `${type} is deleted`,
        color: "green",
      });
      if (!handleFetch) return;
      handleFetch(activePage ?? 1);
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
