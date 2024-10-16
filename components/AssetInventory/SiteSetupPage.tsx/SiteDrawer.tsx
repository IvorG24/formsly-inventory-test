import { InventoryAssetFormValues } from "@/utils/types";
import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleSiteSubmit: (data: InventoryAssetFormValues) => void; // Pass form data to the parent
};

const SiteDrawer = ({ isOpen, close, handleSiteSubmit }: Props) => {
  const { control, handleSubmit, reset } =
    useFormContext<InventoryAssetFormValues>();

  const handleSubmitSiteForm = async (data: InventoryAssetFormValues) => {
    handleSiteSubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Site"
      position="right"
      opened={isOpen}
      onClose={() => {
        reset(), close();
      }}
    >
      <form onSubmit={handleSubmit(handleSubmitSiteForm)}>
        <Stack spacing={8}>
          <Controller
            name="site_name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Site Name"
                placeholder="Enter site name"
                withAsterisk
                required
                {...field}
              />
            )}
          />

          <Controller
            name="site_description"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Site Description"
                placeholder="Enter site description"
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

export default SiteDrawer;
