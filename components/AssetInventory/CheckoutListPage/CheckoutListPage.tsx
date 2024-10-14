import { getAssetSpreadsheetView, getEventDetails } from "@/backend/api/get";
import { useFormList } from "@/stores/useFormStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  DEFAULT_REQUEST_LIST_LIMIT,
  REQUEST_LIST_HIDDEN_FORMS,
} from "@/utils/constant";

import {
  CategoryTableRow,
  InventoryListType,
  OptionType,
  SiteTableRow,
  TeamMemberWithUserType,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import AssetListFilter from "../AssetListPage/AssetListFilter";
import AssetListTable from "../AssetListPage/AssetListTable";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";

type Props = {
  teamMemberList: TeamMemberWithUserType[];
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  tableColumnList: {
    label: string;
    value: string;
  }[];
  userId: string;
};

type FilterSelectedValuesType = {
  search?: string;
  sites?: string;
  locations?: string;
  category?: string;
  department?: string;
  status?: string;
  isAscendingSort?: boolean;
  assignedToPerson?: string[];
  assignedToSite?: string[];
};

const CheckoutListPage = ({
  teamMemberList,
  userId,
  siteList,
  departmentList,
  tableColumnList,
  categoryList,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const formList = useFormList();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [optionsEvent, setOptionsEvent] = useState<OptionType[]>([]);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: "request-list-filter",
      defaultValue: {
        search: "",
        sites: "",
        locations: "",
        department: "",
        category: "",
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

  const filteredFormList = formList
    .filter(
      ({ form_name, form_is_public_form }) =>
        !REQUEST_LIST_HIDDEN_FORMS.includes(form_name) && !form_is_public_form
    )
    .map(({ form_name: label, form_id: value }) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const { handleSubmit, getValues, control, setValue } = filterFormMethods;

  const selectedFormFilter = useWatch({ name: "sites", control });

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "request_date_created",
    direction: "desc",
  });
  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "inventory-list-checkout-table-column-filter",
    defaultValue: tableColumnList
      .filter(
        (column) =>
          ![
            "Asset Tag Id",
            "Asset Name",
            "Status",
            "Date Created",
            "Item Code",
            "Brand",
            "Model",
            "Serial No.",
            "Site",
            "Location",
            "Department",
          ].includes(column.label)
      )
      .map((column) => column.value),
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
        assignedToSite,
        department,
        sites,
        category,
        isAscendingSort,
      } = getValues();

      const newData = await getAssetSpreadsheetView(supabaseClient, {
        page: page,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        sort: isAscendingSort,
        search,
        status: "CHECKED OUT",
        assignedToPerson,
        assignedToSite,
        department,
        locations,
        sites,
        category,
      });

      setInventoryList(newData);
      setInventoryListCount(newData.length);
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
    const getEventOptions = async () => {
      if (!activeTeam.team_id) return;
      const eventOptions = await getEventDetails(
        supabaseClient,
        activeTeam.team_id
      );

      const initialEventOptions: OptionType[] = eventOptions.map((event) => ({
        label: event.event_name,
        value: event.event_id,
      }));

      setOptionsEvent(initialEventOptions);
    };

    getEventOptions();
    handlePagination(activePage);
  }, [activeTeam.team_id, activePage]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={4}>Check out List Page</Title>
          <Text>Manage your team assets here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <AssetListFilter
              inventoryList={inventoryList}
              type={"check out"}
              selectedRow={selectedRows}
              userId={userId}
              eventOptions={optionsEvent}
              siteList={siteList}
              categoryList={categoryList}
              departmentList={departmentList}
              teamMemberList={teamMemberList}
              handleFilterForms={handleFilterForms}
              formList={filteredFormList}
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
            selectedFormFilter={selectedFormFilter}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
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

export default CheckoutListPage;
