import { checkUniqueValue, getSubCategoryList } from "@/backend/api/get";
import { createDataDrawer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  CategoryTableRow,
  InventoryAssetFormValues,
  SubCategory,
} from "@/utils/types";
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
import { Controller, FormProvider, useForm } from "react-hook-form";
import DisableModal from "../DisableModal";
import UpdateModal from "../UpdateModal";
import SubCategoryDrawer from "./SubCategoriesDrawer";
type FormValues = {
  category_id: string;
  category_name: string;
};

type Props = {
  categoryOptions: CategoryTableRow[];
};
const SubCategoriesSetupPage = ({ categoryOptions }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [subCategory, setSubCategory] = useState<SubCategory[]>([]);
  const [subCategoryCount, setSubCategoryCount] = useState(0);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string>("");
  const [modalOpened, setModalOpened] = useState(false);
  const categoryOptionList = categoryOptions.map((option) => ({
    label: option.category_name,
    value: option.category_id,
  }));
  const [isFetchingCategoryList, setIsFetchingCategoryList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      category_name: categoryOptionList[0].label,
      category_id: categoryOptionList[0].value,
    },
  });

  const { control, handleSubmit, getValues } = formMethods;

  const handleFetchCategoryList = async (
    page: number,
    value: string | null
  ) => {
    try {
      const { category_id } = getValues();
      const categoryId = value ? value : category_id;

      const data = await getSubCategoryList(supabaseClient, {
        page,
        search: categoryId,
        limit: ROW_PER_PAGE,
      });
      setSubCategory(data.data);
      setSubCategoryCount(data.totalCount);
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
    } finally {
      setIsFetchingCategoryList(false); // Hide loading state
    }
  };

  const handlePagination = async (page: number) => {
    try {
      const { category_id } = getValues();
      setIsFetchingCategoryList(true);
      setActivePage(page);
      await handleFetchCategoryList(page, category_id);
    } catch (e) {
    } finally {
      setIsFetchingCategoryList(false);
    }
  };

  const handleEdit = (subCategory_id: string) => {
    console.log("Edit category with ID:", subCategory_id);
  };

  const handleDelete = (subCategory_id: string) => {
    setSubCategoryToDelete(subCategory_id);
    setModalOpened(true);
  };

  const handleSubCategorySubmit = async (data: InventoryAssetFormValues) => {
    try {
      if (!activeTeam.team_id) return;
      const checkIfUniqueValue = await checkUniqueValue(supabaseClient, {
        type: "field",
        typeValue: data.sub_category?.trim() || "",
      });
      if (checkIfUniqueValue) {
        notifications.show({
          message: "Sub Category already exist",
          color: "red",
        });
        return;
      }
      const result = await createDataDrawer(supabaseClient, {
        type: "sub-category",
        InventoryFormValues: data,
        teamId: activeTeam.team_id,
      });

      const newData = {
        category_name: result.result_category_name,
        sub_category_id: result.result_id,
        sub_category_name: result.result_name || "",
      };

      setSubCategory((prev) => [...prev, newData] as SubCategory[]);

      notifications.show({
        message: "Category added successfully",
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);
  return (
    <Container fluid>
      <DisableModal
        setCurrentSubCategoryList={setSubCategory}
        typeId={subCategoryToDelete}
        close={() => setModalOpened(false)}
        opened={modalOpened}
        type="Sub Category"
      />

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
            <Controller
              name="category_id"
              control={control}
              defaultValue={getValues("category_name")}
              render={({ field }) => (
                <Select
                  placeholder="Search by category name"
                  data={categoryOptionList}
                  searchable
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    handleFilterForms(value);
                  }}
                  rightSection={
                    <ActionIcon size="xs" type="submit">
                      <IconCategory />
                    </ActionIcon>
                  }
                />
              )}
            />

            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Sub Category
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <SubCategoryDrawer
            handleFetchCategoryList={handleFetchCategoryList}
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
          totalRecords={subCategoryCount}
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
                <Group spacing="xs" noWrap>
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
