import { InventoryAssetFormValues } from "@/utils/types";
import { Button, Drawer, Group, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control
type Props = {
  isOpen: boolean;
  close: () => void;
  handleSiteSubmit: (data: InventoryAssetFormValues) => void; // Pass form data to the parent
};

const SiteDrawer = ({ isOpen, close, handleSiteSubmit }: Props) => {
  //   const supabaseClient = createPagesBrowserClient<Database>();
  const { control, handleSubmit, reset } =
    useFormContext<InventoryAssetFormValues>();

  const handleSubmitSiteForm = async (data: InventoryAssetFormValues) => {
    handleSiteSubmit(data);
    reset();
  };
  //   const [regionOptionList, setRegionOptionsList] = useState<
  //     { region_id: string; region: string }[]
  //   >([]);
  //   const [provinceOptionList, setProvinceOptionList] = useState<
  //     { province_id: string; province: string }[]
  //   >([]);
  //   const [cityOptionList, setCityOptionList] = useState<
  //     { city_id: string; city: string }[]
  //   >([]);

  //   useEffect(() => {
  //     const fetchLocations = async () => {
  //       try {
  //         const regionData = await fetchRegion(
  //           supabaseClient as unknown as SupabaseClient<
  //             OneOfficeDatabase["address_schema"]
  //           >
  //         );
  //

  //         if (!regionData) throw new Error("Failed to fetch regions");
  //         setRegionOptionsList(regionData);
  //       } catch (error) {
  //         console.error("Error fetching regions:", error);
  //       }
  //     };

  //     fetchLocations();
  //   }, []);

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
          {/* <Controller
            name="site_region"
            control={control}
            render={({ field }) => (
              <Select
                label="Region"
                placeholder="Select region"
                required
                data={regionOptionList.map((region) => ({
                  value: region.region_id,
                  label: region.region,
                }))}
                {...field}
              />
            )}
          /> */}

          {/* <Controller
            name="site_city"
            control={control}
            render={({ field }) => (
              <TextInput
                label="State"
                placeholder="Enter site description"
                required
                {...field}
              />
            )}
          />
          <Controller
            name="site_postal_code"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Postal Code"
                placeholder="Enter site description"
                required
                {...field}
              />
            )}
          /> */}

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
