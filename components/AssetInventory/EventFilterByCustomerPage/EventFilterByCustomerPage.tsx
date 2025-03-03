import { getDynamicReportView } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { dateOption, limitOption } from "@/utils/constant";
import { formatDateRange } from "@/utils/functions";
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
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";
import EventFilterByCustomerFilter, {
  FilterSelectedValuesType,
} from "./EventFilterByCustomerFilter";
import EventFilterByCustomerTable from "./EventFilterByCustomerTable";

type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  customerList: InventoryCustomerRow[];
  securityGroupData: SecurityGroupData;
  eventName: string;
  tableColumnList: {
    label: string;
    value: string;
    field_is_custom_field?: boolean;
  }[];
};

const EventFilterByCustomerPage = ({
  siteList,
  departmentList,
  categoryList,
  tableColumnList,
  securityGroupData,
  customerList,
  eventName,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [customerData, setCustomerData] = useState<InventoryCustomerRow | null>(
    null
  );
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);
  const eventTitle = eventName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: {
      search: "",
      sites: [],
      locations: "",
      department: [],
      category: [],
      status: "",
      limit: limitOption[0].value,
      assignedToSite: "",
      isAscendingSort: false,
      dateType: dateOption[0].value,
      dateStart: null,
      dateEnd: null,
    },
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue } = filterFormMethods;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_request_created",
    direction: "desc",
  });

  const getDefaultColumnList = () => {
    const excludedColumns = [
      "inventory_request_id",
      "inventory_request_name",
      "inventory_request_tag_id",
    ];

    return tableColumnList
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(
        (column) =>
          !column.value.startsWith("event") &&
          !excludedColumns.includes(column.value)
      )
      .map((column) => column.value);
  };

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: `inventory-${eventName}-byTagId-report-list-table-column-filter`,
    defaultValue: getDefaultColumnList(),
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
        locations,
        status,
        department,
        sites,
        category,
        limit,
        isAscendingSort,
        assignedToCustomer,
        dateType,
        dateStart,
        dateEnd,
      } = getValues();

      const { startDate: formattedDateStart, endDate: formattedDateEnd } =
        formatDateRange(dateStart, dateEnd, dateType);

      const { data, count, customer } = await getDynamicReportView(
        supabaseClient,
        {
          page: page,
          limit: Number(limit) ? Number(limit) : 10,
          sort: isAscendingSort,
          columnAccessor: sortStatus.columnAccessor,
          search,
          status,
          department: department,
          locations,
          sites: sites,
          category: category,
          teamId: activeTeam.team_id,
          assignedToCustomer: assignedToCustomer,
          eventName: eventName,
          type: "byCustomer",
          dateType: dateType,
          dateStart: formattedDateStart || "",
          dateEnd: formattedDateEnd || "",
        }
      );
      setCustomerData(customer ?? null);
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
  }, [activeTeam, eventName]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>
            {eventTitle} Event Report By Customer List Page
          </Title>
          <Text>Manage your assets reports here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <EventFilterByCustomerFilter
              customerList={customerList}
              eventName={eventName}
              reportList={inventoryList}
              listTableColumnFilter={listTableColumnFilter}
              tableColumnList={tableColumnList}
              securityGroupData={securityGroupData}
              siteList={siteList}
              categoryList={categoryList}
              departmentList={departmentList}
              handleFilterForms={handleFilterForms}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <EventFilterByCustomerTable
            requestList={inventoryList}
            requestListCount={inventoryListCount}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
            eventName={eventName}
            getValues={getValues}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={tableColumnList}
            customerData={customerData}
            defaultColumnList={getDefaultColumnList()}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default EventFilterByCustomerPage;
