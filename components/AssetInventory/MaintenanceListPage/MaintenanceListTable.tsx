import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import { BASE_URL, formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { InventoryMaintenanceList } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Button,
  CopyButton,
  Flex,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCopy, IconEdit } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "./MaintenanceListFilter";

type Props = {
  maintenanceList: InventoryMaintenanceList[];
  maintenanceListcount: number;
  activePage: number;
  isFetching: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  handleEdit: (maintenance: InventoryMaintenanceList) => void;
  setSelectedRow: (newSelectedRows: string[]) => void;
  selectedRow: string[];
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: {
    value: string;
    label: string;
    field_is_custom_field?: boolean;
  }[];
  defaulColumnList: string[];
};

const excludedColumns = [
  "inventory_maintenance_id",
  "inventory_request_name",
  "inventory_request_tag_id",
  "inventory_maintenance_request_id",
];

const MaintenanceListTable = ({
  maintenanceList,
  maintenanceListcount,
  activePage,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  handleEdit,
  checkIfColumnIsHidden,
  showTableColumnFilter,
  isFetching,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
  defaulColumnList,
}: Props) => {
  const activeTeam = useActiveTeam();

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  const dynamicColumns = tableColumnList
    .filter((column) => !excludedColumns.includes(column.value))
    .map((column) => ({
      accessor: column.value,
      title: column.label,
      sortable:
        column.value.startsWith("inventory_request") ||
        column.value.startsWith("inventory_maintenance"),
      width: "100%",
      hidden: checkIfColumnIsHidden(column.value),
      render: (record: Record<string, unknown>) => {
        const value = record[column.value];

        if (column.value.includes("date")) {
          const isDate = typeof value === "string" && !isNaN(Date.parse(value));
          if (isDate) {
            return (
              <Text size="sm">{formatDate(new Date(value as string))}</Text>
            );
          }
        }

        if (column.value.includes("cost") && typeof value === "number") {
          return (
            <Text size="sm">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(value as number)}
            </Text>
          );
        }

        return <Text>{String(value)}</Text>;
      },
    }));

  return (
    <ListTable
      idAccessor="inventory_maintenance_id"
      records={maintenanceList}
      fetching={isFetching}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={maintenanceListcount}
      recordsPerPage={ROW_PER_PAGE}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "inventory_request_tag_id",
          title: "Asset Tag ID",
          width: 180,
          sortable: true,
          hidden: checkIfColumnIsHidden("inventory_request_tag_id"),

          render: ({ inventory_request_tag_id }) => {
            return (
              <Flex
                key={String(inventory_request_tag_id)}
                justify="space-between"
              >
                <Group>
                  <Text truncate maw={150}>
                    <Anchor
                      href={`/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/inventory/${inventory_request_tag_id}`}
                      target="_blank"
                    >
                      {String(inventory_request_tag_id)}
                    </Anchor>
                  </Text>
                </Group>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/inventory/${inventory_request_tag_id}`}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={
                        copied ? "Copied" : `Copy ${inventory_request_tag_id}`
                      }
                      onClick={copy}
                    >
                      <ActionIcon>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Flex>
            );
          },
        },
        {
          accessor: "inventory_request_name",
          title: "Asset Name",
          width: 180,
          sortable: true,
          hidden: checkIfColumnIsHidden("inventory_request_name"),
          render: ({ inventory_request_name }) => {
            return <Text>{String(inventory_request_name)}</Text>;
          },
        },
        ...dynamicColumns,
        {
          accessor: "actions",
          title: "Actions",
          sortable: false,
          render: (record: Record<string, unknown>) => {
            const inventoryRecord = record as InventoryMaintenanceList;
            return (
              <Button
                onClick={() => handleEdit(inventoryRecord)}
                color="blue"
                variant="outline"
                size="sm"
                rightIcon={<IconEdit size={16} />}
              >
                Edit
              </Button>
            );
          },
        },
      ]}
      showTableColumnFilter={showTableColumnFilter}
      setShowTableColumnFilter={setShowTableColumnFilter}
      listTableColumnFilter={listTableColumnFilter}
      setListTableColumnFilter={setListTableColumnFilter}
      tableColumnList={tableColumnList}
      defaultColumnList={defaulColumnList}
      type="asset"
      handleFetch={handlePagination}
    />
  );
};

export default MaintenanceListTable;
