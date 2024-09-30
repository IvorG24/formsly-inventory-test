import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  site_name: string;
  handleSiteSubmit: (data: SiteFormValues) => void; // Pass form data to the parent
};

export type SiteFormValues = {
  site_name: string;
  location_name: string;
};

const LocationDrawer = ({
  isOpen,
  close,
  handleSiteSubmit,
  site_name,
}: Props) => {
  const { control, handleSubmit, reset } = useFormContext<SiteFormValues>();
  const handleSubmitSiteForm = async (data: SiteFormValues) => {
    handleSiteSubmit(data);
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
      <form onSubmit={handleSubmit(handleSubmitSiteForm)}>
        <Stack spacing={8}>
          <Controller
            name="site_name"
            defaultValue={site_name}
            control={control}
            render={({ field }) => (
              <TextInput
                label="Site Name"
                variant="filled"
                readOnly
                required
                {...field}
              />
            )}
          />

          <Controller
            name="location_name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Location Name"
                placeholder="Enter location name"
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

export default LocationDrawer;
