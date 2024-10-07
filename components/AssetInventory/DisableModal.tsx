import { Button, Group, Modal } from "@mantine/core";

type DisableModalProps = {
  opened: boolean;
  close: () => void;
  type: string;
  request_id: string | null;
};

const DisableModal = ({
  opened,
  close,
  type,
  request_id,
}: DisableModalProps) => {
  const handleConfirm = async () => {
    request_id;
    console.log("Confirmed!");
    close(); // Close the modal after confirming
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
