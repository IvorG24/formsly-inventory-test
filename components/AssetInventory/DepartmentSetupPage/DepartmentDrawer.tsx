import { InventoryAssetFormValues } from "@/utils/types";
import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleDepartmentSubmit: (data: InventoryAssetFormValues) => void;
};

const DepartmentDrawer = ({ isOpen, close, handleDepartmentSubmit }: Props) => {
  const { control, handleSubmit, reset } =
    useFormContext<InventoryAssetFormValues>();
  const handleDepartmentSubmitForm = async (data: InventoryAssetFormValues) => {
    handleDepartmentSubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Location"
      position="right"
      overlayProps={{ opacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={() => {
        reset(), close();
      }}
    >
      <form onSubmit={handleSubmit(handleDepartmentSubmitForm)}>
        <Stack spacing={8}>
          <Controller
            name="department_name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Deparment Name"
                withAsterisk
                required
                {...field}
              />
            )}
          />

          <Group mt="md">
            <Button fullWidth type="submit">
              Save Department
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default DepartmentDrawer;
