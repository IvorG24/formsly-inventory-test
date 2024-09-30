import { getCategoryOptions } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { OptionTableRow } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import CategoryDrawer, { CategoryFormValues } from "./CategoryDrawer";

type FormValues = {
  search: string;
  category_name: string;
};

const CategoriesSetupPage = () => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentCategoryList, setCurrentCategoryList] = useState<
    OptionTableRow[]
  >([]);

  const [isFetchingCategoryList, setIsFetchingCategoryList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  // Initialize React Hook Form with default values for the drawer
  const formMethods = useForm<FormValues>({
    defaultValues: {
      category_name: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  const handleFetchCategoryList = async (page: number) => {
    const { search } = getValues();
    const data = await getCategoryOptions(supabaseClient, {
      page,
      search,
      limit: ROW_PER_PAGE,
    });
    setCurrentCategoryList(data);
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingCategoryList(true);
      setActivePage(1);
      await handleFetchCategoryList(1);
    } catch (e) {
      console.error("Error fetching filtered categories:", e);
    } finally {
      setIsFetchingCategoryList(false); // Hide loading state
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingCategoryList(true);
      setActivePage(page);
      await handleFetchCategoryList(page);
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

  const handleCategorySubmit = async (data: CategoryFormValues) => {
    try {
      const { category_name } = data;
      const newCategory: OptionTableRow = {
        option_id: uuidv4(),
        option_value: category_name,
        option_order: 4,
        option_field_id: "913b5928-38ee-45eb-a808-6c1b5dd2a8cb",
      };

      setCurrentCategoryList((prev) => [...prev, newCategory]);
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

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);
  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Categories</Title>
        <Text>
          This is the list of categories currently in the system. You can edit
          or delete each category as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by category name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Category
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <CategoryDrawer
            handleCategorySubmit={handleCategorySubmit}
            isOpen={opened}
            close={close}
          />
        </FormProvider>

        <DataTable
          fontSize={16}
          style={{ borderRadius: 4, minHeight: "300px" }}
          withBorder
          idAccessor="category_id"
          page={activePage}
          totalRecords={currentCategoryList.length}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentCategoryList}
          fetching={isFetchingCategoryList}
          columns={[
            {
              accessor: "category_name",
              width: "90%",
              title: "Category Name",
              render: (category) => <Text>{category.option_value}</Text>,
            },
            {
              accessor: "actions",
              title: "Actions",
              render: (category) => (
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(category.option_id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(category.option_id)}
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

export default CategoriesSetupPage;
