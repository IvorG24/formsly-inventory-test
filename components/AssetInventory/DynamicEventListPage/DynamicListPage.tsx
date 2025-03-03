import { getAssetSpreadsheetView, getEventDetails } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/constant";

import { useEventList } from "@/stores/useEventStore";
import {
  CategoryTableRow,
  InventoryCustomerRow,
  InventoryListType,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AssetListFilter from "../AssetListPage/AssetListFilter";
import AssetListTable from "../AssetListPage/AssetListTable";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";

type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  securityGroup: SecurityGroupData;
  customerList: InventoryCustomerRow[];
  tableColumnList: {
    label: string;
    value: string;
  }[];
  userId: string;
};

export type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  department?: string[];
  status?: string;
  assignedToPerson?: string[];
  assignedToSite?: string[];
  isAscendingSort?: boolean;
};

const DynamicListPage = ({
  userId,
  siteList,
  customerList,
  departmentList,
  tableColumnList,
  categoryList,
  securityGroup,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const eventList = useEventList();
  const router = useRouter();
  const status = router.query.statusName as string;
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: `${status}-inventory-request-list-filter`,
      defaultValue: {
        search: "",
        sites: securityGroup.asset.filter.site,
        locations: "",
        department: securityGroup.asset.filter.department,
        category: securityGroup.asset.filter.category,
        status: "",
        assignedToPerson: [],
        assignedToSite: [],
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

  const getDefaultColumnList = () => {
    const excludedColumns = [
      "Asset Tag ID",
      "Asset Name",
      "Status",
      "Assigned To",
      "Date Created",
      "Item Code",
      "Brand",
      "Model",
      "Serial No.",
      "Site",
      "Location",
      "Department",
      "Old Asset Number",
      "IT Equipment Type",
    ];

    return tableColumnList
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter((column) => !excludedColumns.includes(column.label))
      .map((column) => column.value);
  };

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: `inventory-list-${status}-table-column-filter`,
    defaultValue: getDefaultColumnList(),
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id || !status) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const {
        search,
        assignedToPerson,
        locations,
        assignedToSite,
        department,
        sites,
        category,
        isAscendingSort,
      } = getValues();

      const { data: eventStatus } = await getEventDetails(supabaseClient, {
        teamId: activeTeam.team_id,
        search: status.replace("-", " "),
      });

      const { data, count } = await getAssetSpreadsheetView(supabaseClient, {
        page: page,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        sort: isAscendingSort,
        search,
        status: eventStatus[0].event_status,
        assignedToPerson,
        assignedToSite,
        department: securityGroup.asset.filter.department || department,
        columnAccessor: sortStatus.columnAccessor,
        locations,
        sites: securityGroup.asset.filter.site || sites,
        category: securityGroup.asset.filter.category || category,
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
  }, [activeTeam, status]);
  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>
            {status
              .split("-")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}{" "}
            List Page
          </Title>
          <Text>Manage your team assets here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <AssetListFilter
              customerList={customerList}
              securityGroupData={securityGroup}
              inventoryList={inventoryList}
              type={"dynamic page"}
              selectedRow={selectedRows}
              userId={userId}
              eventList={eventList}
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
          <AssetListTable
            setSelectedRow={setSelectedRows}
            selectedRow={selectedRows}
            requestList={inventoryList}
            requestListCount={inventoryListCount}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={tableColumnList}
            defaultColumnList={getDefaultColumnList()}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default DynamicListPage;
