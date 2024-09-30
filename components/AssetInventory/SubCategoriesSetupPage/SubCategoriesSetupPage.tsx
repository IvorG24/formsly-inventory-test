import { getSubCategoryList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { OptionTableRow, SubCategory } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Select,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconCategory, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import SubCategoryDrawer, { CategoryFormValues } from "./SubCategoriesDrawer";
type FormValues = {
  category_id: string;
  category_name: string;
};

type Props = {
  categoryOptions: OptionTableRow[];
};
const SubCategoriesSetupPage = ({ categoryOptions }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [subCategory, setSubCategory] = useState<SubCategory[]>([]);
  const categoryOptionList = categoryOptions.map((option) => ({
    label: option.option_value,
    value: option.option_value,
  }));
  const [isFetchingCategoryList, setIsFetchingCategoryList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      category_name: categoryOptionList[0].label,
      category_id: categoryOptionList[0].value,
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  const handleFetchCategoryList = async (
    page: number,
    value: string | null
  ) => {
    try {
      const { category_name } = getValues();
      const categoryName = value ? value : category_name;

      const data = await getSubCategoryList(supabaseClient, {
        page,
        search: categoryName,
        limit: ROW_PER_PAGE,
      });
      setSubCategory(data);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async (value: string | null) => {
    try {
      setIsFetchingCategoryList(true);
      setActivePage(1);
      await handleFetchCategoryList(1, value);
    } catch (e) {
      console.error("Error fetching filtered categories:", e);
    } finally {
      setIsFetchingCategoryList(false); // Hide loading state
    }
  };

  const handlePagination = async (page: number) => {
    try {
      const { category_name } = getValues();
      setIsFetchingCategoryList(true);
      setActivePage(page);
      await handleFetchCategoryList(page, category_name);
    } catch (e) {
      console.error("Error fetching paginated categories:", e);
    } finally {
      setIsFetchingCategoryList(false);
    }
  };

  const handleEdit = (category_id: string) => {
    console.log("Edit category with ID:", category_id);
  };

  const handleDelete = (category_id: string) => {
    console.log("Delete category with ID:", category_id);
  };

  const handleSubCategorySubmit = async (data: CategoryFormValues) => {
    try {
      const { sub_category, category_name } = data;
      const subCategoryData = {
        category_name: category_name,
        sub_category_id: uuidv4(),
        sub_category_name: sub_category,
      };

      setSubCategory((prev) => [...prev, subCategoryData]);
      notifications.show({
        message: "Category addedd successfully",
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "Red",
      });
    }
  };
  console.log(createPagesBrowserClient());

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);
  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Sub Categories</Title>
        <Text>
          This is the list of sub categories currently in the system. You can
          edit or delete each sub category as needed.
        </Text>

        <form
          onSubmit={handleSubmit((data) =>
            handleFilterForms(data.category_name)
          )}
        >
          <Group position="apart" align="center">
            <Select
              placeholder="Search by location name"
              data={categoryOptionList}
              defaultValue={getValues("category_id")}
              searchable
              {...register("category_name")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconCategory />
                </ActionIcon>
              }
              onChange={(value) => {
                formMethods.setValue("category_name", value || "");
                handleFilterForms(value);
              }}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Sub Category
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <SubCategoryDrawer
            categoryList={categoryOptionList}
            handleSubCategory={handleSubCategorySubmit}
            isOpen={opened}
            close={close}
          />
        </FormProvider>

        <DataTable
          fontSize={16}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="sub_category_id"
          page={activePage}
          totalRecords={subCategory.length}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={subCategory}
          fetching={isFetchingCategoryList}
          columns={[
            {
              accessor: "sub_category_id",
              width: "40%",
              title: "Sub Category Name",
              render: (subCategory) => (
                <Text>{subCategory.sub_category_name}</Text>
              ),
            },
            {
              accessor: "category_name",
              width: "40%",
              title: "Category Name",
              render: (subCategory) => <Text>{subCategory.category_name}</Text>,
            },
            {
              accessor: "actions",
              title: "Actions",
              render: (subCategory) => (
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(subCategory.sub_category_id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(subCategory.sub_category_id)}
                  >
                    Delete
                  </Button>
                </Group>
              ),
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default SubCategoriesSetupPage;
