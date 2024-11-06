import { getEmployeeInventoryList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { InventoryEmployeeList, SecurityGroupData } from "@/utils/types";
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
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import EmployeeDrawer from "./EmployeeDrawer";

type FormValues = {
  search: string;
  isAscendingSort?: boolean;
  columnAccessor?: string;
  file?: File;
};
type Props = {
  securityGroup: SecurityGroupData;
};
type Column = {
  accessor: string;
  title: string;
  render: (row: InventoryEmployeeList) => JSX.Element;
};

const EmployeeListPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [columns, setColumns] = useState<Column[]>([]); // Specify the type here

  const [activePage, setActivePage] = useState(1);
  const [currentEmployeeList, setCurrentEmployeeList] = useState<
    InventoryEmployeeList[]
  >([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [currentEmployeeCount, setCurrentEmployeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<InventoryEmployeeList | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const canAddData = securityGroup.privileges.employee.add === true;
  const canEditData = securityGroup.privileges.customer.edit === true;
  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
    },
  });

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "scic_employee_id",
    direction: "desc",
  });

  const { register, handleSubmit, getValues, setValue } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam.team_id]);

  const handleFetchEmployeeList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search, isAscendingSort } = getValues();
      const { data, totalCount } = await getEmployeeInventoryList(
        supabaseClient,
        {
          search,
          teamID: activeTeam.team_id,
          page,
          limit: ROW_PER_PAGE,
          columnAccessor: sortStatus.columnAccessor,
          isAscendingSort,
        }
      );

      if (data.length > 0) {
        const generatedColumns = [
          ...Object.keys(data[0])
            .filter((key) => key !== "scic_employee_id")
            .map((key) => ({
              accessor: key,
              title: key
                .replace(/scic_employee_/gi, "")
                .replace(/NAME/gi, " ")
                .replace(/hris_id_number/gi, "HRIS ID Number")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
              sortable: ["employee", "site", "department", "location"].some(
                (keyword) => key.includes(keyword)
              ),
              render: (row: InventoryEmployeeList) => (
                <Text fw={key === "scic_employee_hris_id_number" ? 600 : 400}>
                  {row[key]}
                </Text>
              ),
            })),

          {
            accessor: "actions",
            title: "Actions",
            sortable: false,
            render: (row: InventoryEmployeeList) => (
              <>
                {canEditData && (
                  <Button
                    onClick={() => handleEdit(row)}
                    color="blue"
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                )}
              </>
            ),
          },
        ];

        setColumns(generatedColumns);
      }

      setCurrentEmployeeList(data);
      setCurrentEmployeeCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleEdit = (employee: InventoryEmployeeList) => {
    setSelectedEmployee(employee);
    setDrawerMode("edit");
    open();
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      setIsLoading(true);
      await handleFetchEmployeeList(1);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      setIsLoading(true);
      await handleFetchEmployeeList(page);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };
  //for csv employee table and connection table

  // modal

  const handleCreate = () => {
    setSelectedEmployee(null);
    setDrawerMode("create");
    open();
  };

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <Container maw={3840} h="100%">
      <EmployeeDrawer
        mode={drawerMode}
        isOpen={opened}
        close={close}
        handleFetch={handleFetchEmployeeList}
        activePage={activePage}
        employeeData={selectedEmployee ?? undefined}
      />

      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Employee List Page</Title>
          <Text>
            {" "}
            This is the list of Employee currently in the system, including
            their descriptions and available actions. You can edit or delete
            each site as needed.
          </Text>
        </Box>
      </Flex>

      <Paper p="md">
        <Stack>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <Group position="apart" align="center">
              <TextInput
                placeholder="Search by hris id"
                {...register("search")}
                rightSection={
                  <ActionIcon size="xs" type="submit">
                    <IconSearch />
                  </ActionIcon>
                }
                miw={250}
                maw={320}
              />
              {canAddData && (
                <Group>
                  <Button
                    leftIcon={<IconPlus size={16} />}
                    onClick={handleCreate}
                  >
                    Add New Employee
                  </Button>
                </Group>
              )}
            </Group>
          </form>
          <Divider />
          <DataTable
            fontSize={16}
            style={{
              borderRadius: 4,
              minHeight: "300px",
            }}
            withBorder
            idAccessor="site_id"
            page={activePage}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            totalRecords={currentEmployeeCount}
            recordsPerPage={ROW_PER_PAGE}
            onPageChange={handlePagination}
            records={currentEmployeeList}
            fetching={isLoading}
            columns={columns}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default EmployeeListPage;
