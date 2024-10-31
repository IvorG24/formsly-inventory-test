import { getAssetSpreadsheetView } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";

import {
  CategoryTableRow,
  EventTableRow,
  InventoryCustomerList,
  InventoryListType,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";
import CheckOutReportListFilter from "./CheckOutReportListFilter";
import CheckOutreportListTable from "./CheckOutReportListTable";

type Props = {
  siteList: SiteTableRow[];
  eventList: EventTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  customerTableList: InventoryCustomerList[];
  securityGroupData: SecurityGroupData;
  tableColumnList: {
    label: string;
    value: string;
  }[];
};

type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  department?: string[];
  limit?: string;
  status?: string;
  isAscendingSort?: boolean;
  assignedToPerson?: string[];
  assignedToSite?: string[];
  assignedToCustomer?: string[];
};

const CheckOutReportListPage = ({
  siteList,
  eventList,
  customerTableList,
  departmentList,
  categoryList,
  tableColumnList,
  securityGroupData,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: "inventory-asset-report-list-table-filter",
      defaultValue: {
        search: "",
        sites: [],
        locations: "",
        department: [],
        category: [],
        status: "",
        limit: "",
        assignedToPerson: [],
        assignedToSite: [],
        assignedToCustomer: [],
        isAscendingSort: false,
      },
    });
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue } = filterFormMethods;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_request_created",
    direction: "desc",
  });

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "inventory-asset-report-list-table-column-filter",
    defaultValue:
      tableColumnList
        .filter(
          (column) =>
            ![
              "Asset Tag Id",
              "Asset Name",
              "Date Created",
              "Item Code",
              "Brand",
              "Model",
              "Serial No.",
              "Cost",
            ].includes(column.label)
        )
        .map((column) => column.value) || [],
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const {
        search,
        assignedToPerson,
        locations,
        status,
        assignedToSite,
        assignedToCustomer,
        department,
        sites,
        category,
        limit,
        isAscendingSort,
      } = getValues();

      const { data, count } = await getAssetSpreadsheetView(supabaseClient, {
        page: page,
        limit: Number(limit) ? Number(limit) : 10,
        sort: isAscendingSort,
        columnAccessor: sortStatus.columnAccessor,
        search,
        status,
        assignedToPerson,
        assignedToSite,
        assignedToCustomer,
        department: department,
        locations,
        sites: sites,
        category: category,
        teamId: activeTeam.team_id,
      });

      setInventoryList(data);
      setInventoryListCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch request list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchRequestList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchRequestList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Check Out Rpoert List Page</Title>
          <Text>Manage your assets reports here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <CheckOutReportListFilter
              eventList={eventList}
              customerList={customerTableList}
              securityGroupData={securityGroupData}
              siteList={siteList}
              categoryList={categoryList}
              departmentList={departmentList}
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <CheckOutreportListTable
            requestList={inventoryList}
            requestListCount={inventoryListCount}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
            getValues={getValues}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={tableColumnList}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default CheckOutReportListPage;
