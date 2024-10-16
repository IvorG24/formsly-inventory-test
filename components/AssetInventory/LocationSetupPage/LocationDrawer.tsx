import { InventoryAssetFormValues, OptionType } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconLocation } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  siteOptionList: OptionType[];
  handleFetchLocationList: (page: number, value: string | null) => void;
  handleSiteSubmit: (data: InventoryAssetFormValues) => void;
};

const LocationDrawer = ({
  isOpen,
  close,
  siteOptionList,
  handleSiteSubmit,
  handleFetchLocationList,
}: Props) => {
  const { control, handleSubmit, reset } =
    useFormContext<InventoryAssetFormValues>();
  const handleSubmitSiteForm = async (data: InventoryAssetFormValues) => {
    handleSiteSubmit(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Location"
      position="right"
      opened={isOpen}
      onClose={() => {
        reset(), close();
      }}
    >
      <form onSubmit={handleSubmit(handleSubmitSiteForm)}>
        <Stack spacing={8}>
          <Controller
            name="site_id"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Search by location name"
                data={siteOptionList}
                searchable
                clearable
                {...field}
                rightSection={
                  <ActionIcon size="xs" type="submit">
                    <IconLocation />
                  </ActionIcon>
                }
                onChange={(label) => {
                  field.onChange(label);
                  handleFetchLocationList(1, label);
                }}
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

export default LocationDrawer;
