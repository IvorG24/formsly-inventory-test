import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleDepartmentSubmit: (data: DepartmentFormvalues) => void; // Pass form data to the parent
};

export type DepartmentFormvalues = {
  department_name: string;
};

const DepartmentDrawer = ({ isOpen, close, handleDepartmentSubmit }: Props) => {
  const { control, handleSubmit, reset } =
    useFormContext<DepartmentFormvalues>();
  const handleDepartmentSubmitForm = async (data: DepartmentFormvalues) => {
    handleDepartmentSubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Location"
      position="right"
      overlayProps={{ opacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
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
              Save Location
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default DepartmentDrawer;
