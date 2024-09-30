import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleCategorySubmit: (data: CategoryFormValues) => void; // Pass form data to the parent
};

export type CategoryFormValues = {
  category_name: string;
};

const CategoryDrawer = ({ isOpen, close, handleCategorySubmit }: Props) => {
  const { control, handleSubmit, reset } = useFormContext<CategoryFormValues>();

  const handleSubmitSiteForm = async (data: CategoryFormValues) => {
    handleCategorySubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Category"
      position="right"
      overlayProps={{ opacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
    >
      <form onSubmit={handleSubmit(handleSubmitSiteForm)}>
        <Stack spacing={8}>
          <Controller
            name="category_name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Category Name"
                placeholder="Enter category name"
                required
                {...field}
              />
            )}
          />
          <Group mt="md">
            <Button fullWidth type="submit">
              Save Site
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default CategoryDrawer;
