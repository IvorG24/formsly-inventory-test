import { InventoryAssetFormValues, OptionType } from "@/utils/types";
import {
  Button,
  Drawer,
  Group,
  MultiSelect,
  Stack,
  TextInput,
} from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isOpen: boolean;
  close: () => void;
  handleFetchCategoryList: (page: number, value: string | null) => void;
  handleSubCategory: (data: InventoryAssetFormValues) => void;
  categoryList: OptionType[];
};

const SubCategoryDrawer = ({
  isOpen,
  close,
  handleSubCategory,
  categoryList,
}: Props) => {
  const { control, handleSubmit, reset } =
    useFormContext<InventoryAssetFormValues>();
  const handleSubmitSiteForm = async (data: InventoryAssetFormValues) => {
    handleSubCategory(data);
    reset();
  };

  return (
    <Drawer
      title="Create New Sub Category"
      position="right"
      opened={isOpen}
      onClose={() => {
        reset(), close();
      }}
    >
      <form onSubmit={handleSubmit(handleSubmitSiteForm)}>
        <Stack spacing={8}>
          <Controller
            name="category_ids"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Category Name"
                placeholder="Search by category name"
                withAsterisk
                data={categoryList}
                searchable
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                }}
              />
            )}
          />

          <Controller
            name="sub_category"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Sub Category Name"
                placeholder="Enter sub category name"
                withAsterisk
                required
                {...field}
              />
            )}
          />

          <Group mt="md">
            <Button fullWidth type="submit">
              Save Sub Category
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default SubCategoryDrawer;
