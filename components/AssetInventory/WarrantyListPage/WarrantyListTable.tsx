import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import { BASE_URL, formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { formatCurrency } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { InventoryWarrantyList, SecurityGroupData } from "@/utils/types";
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
import { IconCheck, IconCopy, IconEdit, IconX } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "./WarrantyListFilter";

type Props = {
  warrantyList: InventoryWarrantyList[];
  securityGroup: SecurityGroupData;
  warrantyListCount: number;
  activePage: number;
  isFetching: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  setSelectedRow: (newSelectedRows: string[]) => void;
  handleEdit: (maintenance: InventoryWarrantyList) => void;
  selectedRow: string[];
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
  defaultColumnList: string[];
};

const excludedColumns = [
  "inventory_warranty_id",
  "inventory_request_name",
  "inventory_request_tag_id",
  "inventory_warranty_request_id",
  "inventory_warranty_status",
];

const WarrantyListTable = ({
  warrantyList,
  warrantyListCount,
  activePage,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  showTableColumnFilter,
  isFetching,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  checkIfColumnIsHidden,
  tableColumnList,
  handleEdit,
  defaultColumnList,
  securityGroup,
}: Props) => {
  const activeTeam = useActiveTeam();

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  const canEdit =
    securityGroup?.asset?.permissions.find(
      (permission) => permission.key === "editAssets"
    )?.value ?? false;

  const dynamicColumns = tableColumnList
    .filter((column) => !excludedColumns.includes(column.value))
    .map((column) => ({
      accessor: column.value,
      title: column.label,
      sortable:
        column.value.startsWith("inventory_request") ||
        column.value.startsWith("inventory_warranty"),
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

        if (column.value.includes("length") && typeof value === "number") {
          return (
            <Text size="sm">
              {value} {value === 1 ? "month" : "months"}
            </Text>
          );
        }

        if (typeof value === "number") {
          return <Text size="sm">{formatCurrency(Number(value))}</Text>;
        }

        return <Text>{String(value)}</Text>;
      },
    }));

  return (
    <ListTable
      idAccessor="inventory_warranty_id"
      records={warrantyList}
      fetching={isFetching}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={warrantyListCount}
      recordsPerPage={ROW_PER_PAGE}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      defaultColumnList={defaultColumnList}
      columns={[
        {
          accessor: "inventory_warranty_status",
          title: "Active",
          sortable: true,
          hidden: checkIfColumnIsHidden("inventory_warranty_status"),
          render: ({ inventory_warranty_status }) => {
            const isActive = inventory_warranty_status === "ACTIVE";
            return (
              <Group position="center">
                {isActive ? (
                  <IconCheck size={16} color="green" />
                ) : (
                  <IconX size={16} color="red" />
                )}
              </Group>
            );
          },
        },
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
            const inventoryRecord = record as InventoryWarrantyList;
            return (
              <>
                {canEdit && (
                  <Button
                    onClick={() => handleEdit(inventoryRecord)}
                    color="blue"
                    variant="outline"
                    size="sm"
                    rightIcon={<IconEdit size={16} />}
                  >
                    Edit
                  </Button>
                )}
              </>
            );
          },
        },
      ]}
      showTableColumnFilter={showTableColumnFilter}
      setShowTableColumnFilter={setShowTableColumnFilter}
      listTableColumnFilter={listTableColumnFilter}
      setListTableColumnFilter={setListTableColumnFilter}
      tableColumnList={tableColumnList}
      handleFetch={handlePagination}
      type="asset"
    />
  );
};

export default WarrantyListTable;
