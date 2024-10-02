import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { InventoryListType, RequestListFilterValues } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Badge,
  Checkbox,
  CopyButton,
  Flex,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconCopy } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
type Props = {
  requestList: InventoryListType[];
  requestListCount: number;
  activePage: number;
  isFetchingRequestList: boolean;
  selectedFormFilter: string[] | undefined;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<RequestListFilterValues>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  setSelectedRow: (newSelectedRows: string[]) => void;
  selectedRow: string[];
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const AssetListTable = ({
  requestList,
  requestListCount,
  activePage,
  isFetchingRequestList,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  checkIfColumnIsHidden,
  showTableColumnFilter,
  selectedRow,
  setSelectedRow,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
}: Props) => {
  const activeTeam = useActiveTeam();

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);
 
  const handleRowSelect = (requestId: string, isChecked: boolean) => {
    let newSelectedRows: string[] = [...selectedRow];
    if (isChecked) {
      newSelectedRows = [...newSelectedRows, requestId];
    } else {
      newSelectedRows = newSelectedRows.filter((id) => id !== requestId);
    }
    setSelectedRow(newSelectedRows);
  };

  const isAllSelected = selectedRow.length === requestList.length;

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = requestList.map((request) => request.inventory_request_id);
      setSelectedRow(allIds);
    } else {
      setSelectedRow([]);
    }
  };
  const allKeys = Array.from(
    new Set(
      requestList.reduce((keys, current) => {
        return keys.concat(Object.keys(current));
      }, [] as string[])
    )
  );

  const dynamicColumns = allKeys
    .filter(
      (key) =>
        !tableColumnList.some((column) => column.value === key) &&
        key !== "inventory_request_id" &&
        key !== "inventory_request_status" &&
        key !== "inventory_request_created" &&
        key !== "asset_name" &&
        key !== "user_id" &&
        key !== "user_avatar" &&
        key !== "user_first_name" &&
        key !== "user_last_name" &&
        key !== "site_name"
    )
    .map((key) => ({
      accessor: key,
      title: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      render: (record: Record<string, unknown>) => {
        const value = record[key] ? String(record[key]) : "";
        const fieldsWithPesoSign = ["cost", "price"];
        const fieldWithDate = ["purchase_date"];
        if (fieldsWithPesoSign.includes(key.toLowerCase())) {
          return <Text>{value ? `₱ ${value}` : ""}</Text>;
        } else if (fieldWithDate.includes(key.toLowerCase())) {
          return <Text>{formatDate(new Date(value))}</Text>;
        }
        return <Text>{value}</Text>;
      },
    }));

  return (
    <ListTable
      idAccessor="inventory_request_id"
      records={requestList}
      fetching={isFetchingRequestList}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={requestListCount}
      recordsPerPage={DEFAULT_REQUEST_LIST_LIMIT}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "checkbox",
          title: (
            <Checkbox
              checked={isAllSelected} // Check if all rows are selected
              onChange={(e) => handleSelectAll(e.target.checked)} // Handle select/deselect all rows
            />
          ),
          width: 40,
          render: ({ inventory_request_id }) => {
            const isChecked = selectedRow.includes(
              String(inventory_request_id)
            );
            return (
              <Checkbox
                checked={isChecked}
                onChange={(e) =>
                  handleRowSelect(
                    String(inventory_request_id),
                    e.target.checked
                  )
                }
              />
            );
          },
        },
        {
          accessor: "inventory_request_id",
          title: "Asset Tag ID",
          width: 180,
          hidden: checkIfColumnIsHidden("inventory_request_id"),
          render: ({ inventory_request_id }) => (
            <Flex key={String(inventory_request_id)} justify="space-between">
              <Text truncate maw={150}>
                <Anchor
                  href={`/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/requests/${inventory_request_id}`}
                  target="_blank"
                >
                  {String(inventory_request_id)}
                </Anchor>
              </Text>
              <CopyButton
                value={`${BASE_URL}/${formatTeamNameToUrlKey(
                  activeTeam.team_name ?? ""
                )}/requests/${inventory_request_id}`}
              >
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Copied" : `Copy ${inventory_request_id}`}
                    onClick={copy}
                  >
                    <ActionIcon>
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Flex>
          ),
        },
        {
          accessor: "asset_name",
          title: "Asset Name",
          render: (record: Record<string, unknown>) => (
            <Text>
              {record["asset_name"] ? String(record["asset_name"]) : ""}
            </Text>
          ),
        },
        {
          accessor: "inventory_request_status",
          title: "Status",
          sortable: true,
          hidden: checkIfColumnIsHidden("inventory_request_status"),
          render: ({ inventory_request_status }) => (
            <Text>
              <Badge>{String(inventory_request_status)}</Badge>
            </Text>
          ),
        },
        {
          accessor: "inventory_request_created",
          title: "Date Created",
          sortable: true,
          hidden: checkIfColumnIsHidden("inventory_request_created"),
          render: ({ inventory_request_created }) => (
            <Text>
              {formatDate(new Date(String(inventory_request_created)))}
            </Text>
          ),
        },
        ...dynamicColumns,
        {
          accessor: "view",
          title: "View",
          hidden: checkIfColumnIsHidden("view"),
          textAlignment: "center",
          render: ({ inventory_request_id }) => (
            <ActionIcon
              maw={120}
              mx="auto"
              color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/requests/${inventory_request_id}`
                  )
                }
            >
              <IconArrowsMaximize size={16} />
            </ActionIcon>
          ),
        },
      ]}
      showTableColumnFilter={showTableColumnFilter}
      setShowTableColumnFilter={setShowTableColumnFilter}
      listTableColumnFilter={listTableColumnFilter}
      setListTableColumnFilter={setListTableColumnFilter}
      tableColumnList={tableColumnList}
    />
  );
};

export default AssetListTable;
