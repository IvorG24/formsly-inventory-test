import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";

import { getInventoryMaintenance } from "@/backend/api/get";
import { createInventoryMaitenance } from "@/backend/api/post";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { InventoryMaintenanceList, SecurityGroupData } from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FormModal, { InventoryFormValues } from "../FormModal/FormModal";
import MaintenanceListFilter from "./MaintenanceListFilter";
import MaintenanceListTable from "./MaintenanceListTable";

type Props = {
  securityGroupData: SecurityGroupData;
  tableColumnList: {
    value: string;
    label: string;
    field_is_custom_field?: boolean;
  }[];
};

type FilterSelectedValuesType = {
  status: string[];
  search: string;
  isAscendingSort: boolean;
};

const MaintenanceListPage = ({ securityGroupData, tableColumnList }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const userProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [maintenanceList, setMaintenanceList] = useState<
    InventoryMaintenanceList[]
  >([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: "maintenance-list-filter",
      defaultValue: {
        status: [],
        search: "",
        isAscendingSort: false,
      },
    });

  const [selectedMaintenance, setSelectedMaintenance] =
    useState<InventoryMaintenanceList | null>(null);
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);

  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue } = filterFormMethods;

  const getDefaultColumnList = () => {
    const excludedColumns = [
      "Asset Tag ID",
      "Asset Name",
      "Maintenance Date",
      "Title",
      "Status",
      "Completion Date",
      "Cost",
      "Maintenance By",
      "Details",
    ];
    return tableColumnList
      .filter((column) => !excludedColumns.includes(column.label))
      .map((column) => column.value);
  };

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_maintenance_date_created",
    direction: "desc",
  });

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "inventory-list-maintenance-table-column-filter",
    defaultValue: getDefaultColumnList(),
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleOnSubmit = async (data: InventoryFormValues) => {
    try {
      await createInventoryMaitenance(supabaseClient, {
        maintenanceData: data,
        tagId: selectedMaintenance?.inventory_request_tag_id,
        teamMemberId: teamMember?.team_member_id ?? "",
        selectedRow: selectedMaintenance?.inventory_maintenance_id,
      });
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
      close();
      handleFetchMaintenanceList(activePage);
    } catch (e) {
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
    }
  };

  const handleFetchMaintenanceList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const { status, search, isAscendingSort } = getValues();

      const { data, totalCount } = await getInventoryMaintenance(
        supabaseClient,
        {
          page,
          teamId: activeTeam.team_id,
          limit: ROW_PER_PAGE,
          status: status,
          isAscendingSort,
          search: search,
          columnAccessor: sortStatus.columnAccessor,
        }
      );
      setMaintenanceList(data);
      setMaintenanceCount(totalCount);
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
      await handleFetchMaintenanceList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchMaintenanceList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleEdit = (maintenance: InventoryMaintenanceList) => {
    setSelectedMaintenance(null);
    setSelectedMaintenance(maintenance);
    open();
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam]);

  return (
    <Container maw={3840} h="100%">
      <FormModal
        isOpen={opened}
        onClose={close}
        formId="ffb70d77-05e7-46de-abbf-1513002d079a"
        userId={userProfile?.user_id ?? ""}
        selectedRow={selectedMaintenance}
        onSubmit={handleOnSubmit}
        mode={"edit"}
      />

      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Maintenance List Page</Title>
          <Text>Manage your asset maintenance here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <MaintenanceListFilter
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              securityGroupData={securityGroupData}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <MaintenanceListTable
            securityGroup={securityGroupData}
            isFetching={isFetchingRequestList}
            setSelectedRow={setSelectedRows}
            selectedRow={selectedRows}
            maintenanceList={maintenanceList}
            maintenanceListcount={maintenanceCount}
            activePage={activePage}
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
            defaulColumnList={getDefaultColumnList()}
            handleEdit={handleEdit}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default MaintenanceListPage;
