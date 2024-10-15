import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor } from "@/utils/styling";
import { InventoryListType } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Checkbox,
  CopyButton,
  createStyles,
  Flex,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconCopy } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "./AssetListFilter";

type Props = {
  requestList: InventoryListType[];
  requestListCount: number;
  activePage: number;
  isFetchingRequestList: boolean;
  selectedFormFilter: string | undefined;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
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
const useStyles = createStyles(() => ({
  requestor: {
    border: "solid 2px white",
    cursor: "pointer",
  },
  clickable: {
    cursor: "pointer",
  },
}));
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

  const { classes } = useStyles();
  const router = useRouter();
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

  const dynamicColumns = tableColumnList
    .filter(
      (column) =>
        !checkIfColumnIsHidden(column.value) &&
        column.value !== "inventory_request_id" &&
        column.value !== "inventory_request_status" &&
        column.value !== "inventory_request_name"
    )
    .map((column) => ({
      accessor: column.value,
      title: column.label,
      sortable: true,
      width: 180,
      render: (record: Record<string, unknown>) => {
        const value =
          record[column.value] !== undefined && record[column.value] !== null
            ? String(record[column.value])
            : "";

        const fieldsWithPesoSign = ["inventory_request_cost"];
        const fieldWithDate = [
          "inventory_request_purchase_date",
          "inventory_request_created",
          "inventory_request_date_updated",
        ];

        if (fieldsWithPesoSign.includes(column.value)) {
          const formattedValue = value
            ? `₱ ${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "";
          return <Flex>{formattedValue}</Flex>;
        } else if (fieldWithDate.includes(column.value)) {
          return <Text>{value ? formatDate(new Date(value)) : ""}</Text>;
        }
        return <Text>{value !== null ? String(value) : ""}</Text>;
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
          title: "",
          width: 40,
          render: (record) => {
            const { inventory_request_id } = record as {
              inventory_request_id: string;
              assignee_team_member_id: string;
            };

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
          render: ({ inventory_request_id }) => {
            return (
              <Flex key={String(inventory_request_id)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/inventory/${inventory_request_id}`}
                    target="_blank"
                  >
                    {String(inventory_request_id)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/inventory/${inventory_request_id}`}
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
            );
          },
        },
        {
          accessor: "inventory_request_status",
          title: "Status",
          width: 180,
          hidden: checkIfColumnIsHidden("inventory_request_status"),
          render: ({ inventory_request_status }) => {
            return <Badge>{String(inventory_request_status)}</Badge>;
          },
        },
        {
          accessor: "inventory_request_name",
          title: "Asset",
          width: 180,
          hidden: checkIfColumnIsHidden("inventory_request_name"),
          render: ({ inventory_request_name }) => {
            return <Text>{String(inventory_request_name)}</Text>;
          },
        },

        {
          accessor: "assignee_first_name",
          title: "Assigned To",
          sortable: true,
          hidden: checkIfColumnIsHidden("assignee_first_name"),
          render: (record) => {
            const {
              site_name,
              assignee_user_id,
              assignee_first_name,
              assignee_last_name,
              assignee_team_member_d,
            } = record as {
              site_name: string;
              assignee_user_id: string | null;
              assignee_first_name: string;
              assignee_last_name: string;
              assignee_team_member_d: string;
            };

            const isAssignedUser = !!assignee_user_id;
            const avatarLabel = isAssignedUser
              ? `${assignee_first_name[0] + assignee_last_name[0]}`
              : site_name;

            return (
              <Flex px={0} gap={8} align="center">
                {assignee_user_id && (
                  <Avatar
                    color={
                      isAssignedUser
                        ? getAvatarColor(
                            Number(`${assignee_user_id?.charCodeAt(0)}`)
                          )
                        : undefined
                    }
                    className={classes.requestor}
                    onClick={() =>
                      assignee_team_member_d
                        ? window.open(`/member/${assignee_team_member_d}`)
                        : null
                    }
                  >
                    {avatarLabel}
                  </Avatar>
                )}

                {isAssignedUser ? (
                  <Anchor
                    href={`/member/${assignee_team_member_d}`}
                    target="_blank"
                  >
                    <Text>{`${assignee_first_name} ${assignee_last_name}`}</Text>
                  </Anchor>
                ) : (
                  <Text>{site_name}</Text>
                )}
              </Flex>
            );
          },
        },
        ...dynamicColumns,
        {
          accessor: "request_creator_user_id",
          title: "Created By",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_creator_user_id"),
          render: (record) => {
            const {
              request_creator_user_id,
              request_creator_first_name,
              request_creator_last_name,
              request_creator_team_member_id,
            } = record as {
              request_creator_user_id: string;
              request_creator_first_name: string;
              request_creator_last_name: string;
              request_creator_team_member_id: string;
            };

            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  color={
                    request_creator_user_id
                      ? getAvatarColor(
                          Number(`${request_creator_user_id.charCodeAt(0)}`)
                        )
                      : undefined
                  }
                  className={classes.requestor}
                  onClick={() =>
                    request_creator_team_member_id
                      ? window.open(`/member/${request_creator_team_member_id}`)
                      : null
                  }
                >
                  {request_creator_user_id
                    ? `${request_creator_first_name[0] + request_creator_last_name[0]}`
                    : ""}
                </Avatar>
                {request_creator_user_id && (
                  <Anchor
                    href={`/member/${request_creator_team_member_id}`}
                    target="_blank"
                  >
                    <Text>{`${request_creator_first_name} ${request_creator_last_name}`}</Text>
                  </Anchor>
                )}
                {!request_creator_user_id && <Text>Public User</Text>}
              </Flex>
            );
          },
        },
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
                  )}/inventory/${inventory_request_id}`
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
