import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleSiteSubmit: (data: SiteFormValues) => void; // Pass form data to the parent
};

export type SiteFormValues = {
  site_name: string;
  site_description: string;
};

const SiteDrawer = ({ isOpen, close, handleSiteSubmit }: Props) => {
  const { control, handleSubmit, reset } = useFormContext<SiteFormValues>();

  const handleSubmitSiteForm = async (data: SiteFormValues) => {
    handleSiteSubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Site"
      position="right"
      overlayProps={{ opacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
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
