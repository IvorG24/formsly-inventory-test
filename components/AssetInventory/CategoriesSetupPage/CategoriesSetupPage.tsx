import { checkUniqueValue, getCategoryOptions } from "@/backend/api/get";
import { createDataDrawer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  CategoryTableRow,
  InventoryAssetFormValues,
  SecurityGroupData,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
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
import DisableModal from "../DisableModal";
import UpdateModal from "../UpdateModal";
import CategoryDrawer from "./CategoryDrawer";

type FormValues = {
  search: string;
  category_name: string;
};
type Props = {
  securityGroup: SecurityGroupData;
};
const CategoriesSetupPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentCategoryList, setCurrentCategoryList] = useState<
    CategoryTableRow[]
  >([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [modalOpened, setModalOpened] = useState(false);
  const [categoryCount, setCategoryCount] = useState(0);
  const [isFetchingCategoryList, setIsFetchingCategoryList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);
  const [initialCategorydata, setinitialCategoryData] = useState<{
    category_name?: string;
  }>({
    category_name: "",
  });
  const [updateModalOpened, setUpdatedModalOpened] = useState(false);
  const formMethods = useForm<FormValues>({
    defaultValues: {
      category_name: "",
    },
  });

  const canAddData = securityGroup.privileges.category.add === true;
  const canDeleteData = securityGroup.privileges.category.delete === true;
  const canEditData = securityGroup.privileges.category.edit === true;

  const { register, handleSubmit, getValues } = formMethods;

  const handleFetchCategoryList = async (page: number) => {
    if (!activeTeam.team_id) return;
    try {
      const { search } = getValues();
      const { data, totalCount } = await getCategoryOptions(supabaseClient, {
        page,
        search,
        limit: ROW_PER_PAGE,
        teamId: activeTeam.team_id,
      });
      setCurrentCategoryList(data);
      setCategoryCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
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
    } finally {
      setIsFetchingCategoryList(false);
    }
  };

  const handleEdit = (category_id: string) => {
    if (!canEditData) {
      notifications.show({
        message: "Action not allowed",
        color: "red",
      });
      return;
    }
    const categoryData = currentCategoryList.find(
      (category) => category.category_id === category_id
    );

    if (category_id) {
      setCategoryId(category_id);
      setinitialCategoryData({
        category_name: categoryData?.category_name || "",
      });
      setUpdatedModalOpened(true);
    }
  };

  const handleDelete = (category_id: string) => {
    setCategoryId(category_id);
    setModalOpened(true);
  };

  const handleCategorySubmit = async (data: InventoryAssetFormValues) => {
    try {
      if (!canAddData) {
        notifications.show({
          message: "Action not allowed",
          color: "red",
        });
        return;
      }
      const { category_name } = data;
      const checkIfUniqueValue = await checkUniqueValue(supabaseClient, {
        type: "category",
        typeValue: category_name?.trim() || "",
      });
      if (checkIfUniqueValue) {
        notifications.show({
          message: "Category already exist",
          color: "red",
        });
        return;
      }
      const result = await createDataDrawer(supabaseClient, {
        type: "category",
        InventoryFormValues: data,
        teamId: activeTeam.team_id,
      });

      const newCategory = {
        category_id: result.result_id,
        category_name: category_name || "",
        category_is_disabled: false,
        category_team_id: activeTeam.team_id,
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
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);
  return (
    <Container maw={3840} h="100%">
      <DisableModal
        handleFetch={handleFetchCategoryList}
        activePage={activePage}
        typeId={categoryId}
        close={() => setModalOpened(false)}
        opened={modalOpened}
        type="category"
      />
      <UpdateModal
        typeId={categoryId}
        handleFetch={handleFetchCategoryList}
        activePage={activePage}
        initialData={initialCategorydata.category_name}
        close={() => setUpdatedModalOpened(false)}
        opened={updateModalOpened}
        type="category"
      />
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>List of Categories</Title>
          <Text>
            This is the list of categories currently in the system. You can edit
            or delete each category as needed.
          </Text>
        </Box>
      </Flex>
      <Paper p="md">
        <Stack>
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

              {canAddData === true && (
                <Button leftIcon={<IconPlus size={16} />} onClick={open}>
                  Add New Category
                </Button>
              )}
            </Group>
          </form>

          <Divider />

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
            totalRecords={categoryCount}
            recordsPerPage={ROW_PER_PAGE}
            onPageChange={handlePagination}
            records={currentCategoryList}
            fetching={isFetchingCategoryList}
            columns={[
              {
                accessor: "category_name",
                width: "90%",
                title: "Category Name",
                render: (category) => <Text>{category.category_name}</Text>,
              },
              {
                accessor: "actions",
                title: "Actions",
                render: (category) => (
                  <Group spacing="xs" noWrap>
                    {canEditData === true && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleEdit(category.category_id)}
                      >
                        Edit
                      </Button>
                    )}
                    {canDeleteData && (
                      <Button
                        size="xs"
                        variant="outline"
                        color="red"
                        onClick={() => handleDelete(category.category_id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Group>
                ),
              },
            ]}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default CategoriesSetupPage;
