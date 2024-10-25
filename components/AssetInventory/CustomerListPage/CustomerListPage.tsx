import { getCustomerList } from "@/backend/api/get";
import { uploadCSVFileCustomer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { InventoryCustomerRow, SecurityGroupData } from "@/utils/types";
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
import { DataTable } from "mantine-datatable";
import { Database } from "oneoffice-api";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CustomerDrawer from "./CustomerDrawer";

type FormValues = {
  search: string;
  site_name: string;
  site_description: string;
  file?: File;
};
type Props = {
  securityGroup: SecurityGroupData;
};
const CustomerListPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  console.log(securityGroup);

  const [activePage, setActivePage] = useState(1);
  const [customerList, setCustomerList] = useState<InventoryCustomerRow[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      site_name: "",
      site_description: "",
    },
  });

  const { register, handleSubmit, getValues, setValue } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);

  const handleFetchCustomerList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search } = getValues();
      const { data, totalCount } = await getCustomerList(supabaseClient, {
        search,
        teamId: activeTeam.team_id,
        page,
        limit: ROW_PER_PAGE,
      });
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

  return (
    <Container fluid>
      <CustomerDrawer
        isOpen={opened}
        close={close}
        handleFetch={handleFetchCustomerList}
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
              placeholder="Search by customer_name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
            <Group>
              <Button
                leftIcon={<IconFileImport size={16} />}
                onClick={() => handleAction()}
                variant="outline"
              >
                Import
              </Button>
              <Button leftIcon={<IconPlus size={16} />} onClick={open}>
                Add New Customer
              </Button>
              {/* {canAddData && (
                <Button leftIcon={<IconPlus size={16} />} onClick={open}>
                  Add New Site
                </Button>
              )} */}
            </Group>
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
          idAccessor="site_id"
          page={activePage}
          totalRecords={customerCount}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={customerList}
          fetching={isLoading}
          columns={[
            {
              accessor: "customer_name",
              width: "10%",
              title: "Customer Company",
              render: (customer) => <Text>{customer.customer_name}</Text>,
            },
            {
              accessor: "customer_company",
              width: "10%",
              title: "Customer Company",
              render: (customer) => <Text>{customer.customer_company}</Text>,
            },
            {
              accessor: "customer_email",
              width: "10%",
              title: "Customer Email",
              render: (customer) => <Text>{customer.customer_email}</Text>,
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default CustomerListPage;
