import { OptionType } from "@/utils/types";
import { Button, Drawer, Group, Select, Stack, TextInput } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form"; // Import necessary hooks for form control

type Props = {
  isOpen: boolean;
  close: () => void;
  handleSubCategory: (data: CategoryFormValues) => void;
  categoryList: OptionType[];
};

export type CategoryFormValues = {
  category_name: string;
  sub_category: string;
};

const SubCategoryDrawer = ({
  isOpen,
  close,
  handleSubCategory,
  categoryList,
}: Props) => {
  const { control, handleSubmit, reset } = useFormContext<CategoryFormValues>();
  const handleSubmitSiteForm = async (data: CategoryFormValues) => {
    handleSubCategory(data);
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
            name="category_name"
            control={control}
            render={({ field }) => (
              <Select
                label="Category Name"
                placeholder="Search by location name"
                withAsterisk
                data={categoryList}
                searchable
                {...field}
                onChange={(value) => {
                  field.onChange(value || "");
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
