import { OptionType } from "@/utils/types";
import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  categoryOptionList:OptionType[];
  handleSiteSubmit: (data: CategoryFormValues) => void;
};

export type CategoryFormValues = {
  category_id: string;
  sub_category: string;
};

const LocationDrawer = ({
  isOpen,
  close,
  handleSiteSubmit,
  categoryOptionList,
}: Props) => {
  const { control, handleSubmit, reset } = useFormContext<CategoryFormValues>();
  const handleSubmitSiteForm = async (data: CategoryFormValues) => {
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
            name="category_id"
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
            name="sub_category"
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
