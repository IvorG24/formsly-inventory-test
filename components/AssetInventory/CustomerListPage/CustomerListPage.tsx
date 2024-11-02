import { getCustomerList } from "@/backend/api/get";
import { uploadCSVFileCustomer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import {
  Column,
  InventoryCustomerList,
  InventoryCustomerRow,
  SecurityGroupData,
} from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  FileInput,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconFileImport, IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { Database } from "oneoffice-api";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DisableModal from "../DisableModal";
import CustomerDrawer from "./CustomerDrawer";

type FormValues = {
  search: string;
  isAscendingSort: boolean;
  file?: File;
};

type Props = {
  securityGroup: SecurityGroupData;
};
const CustomerListPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();

  const [activePage, setActivePage] = useState(1);
  const [customerList, setCustomerList] = useState<InventoryCustomerList[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedCustomer, setSelectedCustomer] =
    useState<InventoryCustomerList | null>(null);
  const [columns, setColumns] = useState<Column[]>([]); // Specify the type here
  const [modalOpened, setModalOpened] = useState(false);
  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
      isAscendingSort: false,
    },
  });

  const { register, handleSubmit, getValues, setValue } = formMethods;

  const canAddData = securityGroup.privileges.customer.add === true;
  const canEditData = securityGroup.privileges.customer.edit === true;
  const canDeleteData = securityGroup.privileges.customer.delete === true;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "customer_id",
    direction: "desc",
  });

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);

  const handleFetchCustomerList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search, isAscendingSort } = getValues();
      const { data, totalCount } = await getCustomerList(supabaseClient, {
        search,
        teamId: activeTeam.team_id,
        page,
        limit: ROW_PER_PAGE,
        columnAccessor: sortStatus.columnAccessor,
        isAscendingSort,
      });

      if (data.length > 0) {
        const generatedColumns = Object.keys(data[0])
          .filter((key) => key !== "customer_id" && key !== "customer_team_id")
          .map((key) => ({
            accessor: key,
            title: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase()),
            sortable: key.includes("customer"),
            width: "100%",
            render: (record: Record<string, unknown>) => (
              <Text>{(record[key] as string) || ""}</Text>
            ),
          }));
        generatedColumns.push({
          accessor: "actions",
          title: "Actions",
          sortable: false,
          width: "100%",
          render: (record: Record<string, unknown>) => (
            <Flex gap="md">
              {canEditData && (
                <Button
                  onClick={() => handleEdit(record as InventoryCustomerRow)}
                  color="blue"
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
              <Button
                onClick={() => handleDelete(record as InventoryCustomerRow)}
                color="red"
                variant="outline"
                size="sm"
              >
                Delete
              </Button>
            </Flex>
          ),
        });
        setColumns(generatedColumns);
      }
      setCustomerList(data);
      setCustomerCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      setIsLoading(true);
      await handleFetchCustomerList(1);
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
      await handleFetchCustomerList(page);
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
  const handleCSVSubmit = (data: FormValues) => {
    const file = data.file ? data.file : null;
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const parsedData = result.data as unknown as InventoryCustomerRow[];

        try {
          setIsLoading(true);
          await uploadCSVFileCustomer(supabaseClient, {
            parsedData: parsedData,
            teamId: activeTeam.team_id,
          });

          notifications.show({
            message: "Customer imported successfully!",
            color: "green",
          });

          handleFetchCustomerList(activePage);
        } catch (error) {
          notifications.show({
            message: "Error importing Customer.",
            color: "red",
          });
        } finally {
          setIsLoading(false);
        }
        modals.close("importCsv");
      },
    });
  };
  // modal
  const handleAction = () => {
    modals.open({
      modalId: "importCsv",
      title: <Text>Please upload a CSV file.</Text>,
      children: (
        <form onSubmit={handleSubmit(handleCSVSubmit)}>
          <FileInput
            accept=".csv"
            placeholder="Customer csv file"
            label="CSV File"
            withAsterisk
            {...register("file", { required: true })}
            onChange={(file) => setValue("file", file ?? undefined)}
          />
          <Flex mt="md" align="center" justify="flex-end" gap="sm">
            <Button
              variant="default"
              color="dimmed"
              onClick={() => modals.close("importCsv")}
            >
              Cancel
            </Button>
            <Button color="blue" type="submit">
              Upload
            </Button>
          </Flex>
        </form>
      ),
      centered: true,
    });
  };

  const handleEdit = (customer: InventoryCustomerRow) => {
    if (!canEditData) {
      notifications.show({
        message: "Action not allowed",
        color: "red",
      });
      return;
    }
    setSelectedCustomer(customer);
    setDrawerMode("edit");
    open();
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setDrawerMode("create");
    open();
  };

  const handleDelete = (customer: InventoryCustomerRow) => {
    if (!canDeleteData) {
      notifications.show({
        message: "Action not allowed",
        color: "red",
      });
      return;
    }
    setSelectedCustomer(customer);
    setModalOpened(true);
  };
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <Container fluid>
      <CustomerDrawer
        isOpen={opened}
        close={close}
        handleFetch={handleFetchCustomerList}
        activePage={activePage}
        mode={drawerMode}
        customerData={selectedCustomer ?? undefined}
        setCustomerData={setSelectedCustomer}
      />

      <DisableModal
        typeId={selectedCustomer?.customer_id ?? ""}
        close={() => setModalOpened(false)}
        opened={modalOpened}
        type="customer"
        handleFetch={handlePagination}
        activePage={activePage}
      />

      <Flex direction="column" gap="sm">
        <Title order={3}>List of Customers</Title>
        <Text>
          This is the list of Customer currently in the system, including their
          descriptions and available actions. You can edit or delete each site
          as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by customer name"
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
                  leftIcon={<IconFileImport size={16} />}
                  onClick={() => handleAction()}
                  variant="outline"
                >
                  Import
                </Button>

                <Button
                  leftIcon={<IconPlus size={16} />}
                  onClick={handleCreate}
                >
                  Add New Customer
                </Button>
              </Group>
            )}
          </Group>
        </form>

        {/* <FormProvider {...formMethods}></FormProvider> */}

        <DataTable
          fontSize={16}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="customer_id"
          page={activePage}
          totalRecords={customerCount}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={customerList}
          fetching={isLoading}
          columns={columns}
        />
      </Flex>
    </Container>
  );
};

export default CustomerListPage;
