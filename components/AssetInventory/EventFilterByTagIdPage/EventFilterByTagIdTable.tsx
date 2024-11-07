import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import { BASE_URL, formatDate } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { InventoryListType } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  CopyButton,
  Flex,
  Group,
  HoverCard,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconCopy,
  IconLayersLinked,
  IconLinkOff,
} from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { FilterSelectedValuesType } from "./EventFilterByTagIdFilter";

type Props = {
  requestList: InventoryListType[];
  requestListCount: number;
  activePage: number;
  eventName: string;
  isFetchingRequestList: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<FilterSelectedValuesType>;
  getValues: UseFormGetValues<FilterSelectedValuesType>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const EventFilterByTagIdTable = ({
  requestList,
  requestListCount,
  activePage,
  isFetchingRequestList,
  handlePagination,
  sortStatus,
  setSortStatus,
  setValue,
  getValues,
  checkIfColumnIsHidden,
  showTableColumnFilter,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
  eventName,
}: Props) => {
  const activeTeam = useActiveTeam();

  const router = useRouter();
  const limit = getValues("limit");
  const eventFormatted = eventName.replace(/-/g, "_");

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  const dynamicColumns = tableColumnList
    .filter(
      (column) =>
        ![
          "inventory_request_id",
          "inventory_request_status",
          "inventory_request_name",
          "inventory_request_tag_id",
          "inventory_request_cost",
          "inventory_request_created_by",
          "inventory_request_user_id",
          "inventory_request_assigned_to",
          `event_${eventFormatted}_request_id`,
          `event_${eventFormatted}_signature`,
          `event_${eventFormatted}_id`,
        ].includes(column.value)
    )
    .map((column) => ({
      accessor: column.value,
      title: column.label,
      sortable: column.value !== "inventory_request_notes",
      width: "auto",
      hidden: checkIfColumnIsHidden(column.value),
      render: (record: Record<string, unknown>) => {
        const value =
          record[column.value] !== undefined && record[column.value] !== null
            ? String(record[column.value])
            : "";

        return column.label.includes("Date") ? (
          <Text>{value ? formatDate(new Date(value)) : ""}</Text>
        ) : (
          <Text>{value}</Text>
        );
      },
    }));

  const totalCost = requestList.reduce((sum, record) => {
    const cost = Number(record.inventory_request_cost ?? 0);
    return sum + cost;
  }, 0);

  const totalCount = requestList.length;

  return (
    <>
      <ListTable
        idAccessor={`event_${eventFormatted}_id`}
        records={requestList}
        fetching={isFetchingRequestList}
        page={activePage}
        onPageChange={(page) => {
          handlePagination(page);
        }}
        totalRecords={requestListCount}
        recordsPerPage={Number(limit)}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        handleFetch={handlePagination}
        columns={[
          {
            accessor: "r.inventory_request_tag_id",
            title: "Asset Tag ID",
            width: 180,
            sortable: true,
            hidden: checkIfColumnIsHidden("inventory_request_tag_id"),
            footer: (
              <Text weight="bold" size="sm">
                Total Assets: {totalCount}
              </Text>
            ),
            render: ({ inventory_request_tag_id, relationship_type }) => {
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

                    {String(relationship_type) && (
                      <HoverCard width={280} shadow="md">
                        <HoverCard.Target>
                          <ActionIcon>
                            {relationship_type === "parent" ? (
                              <IconLayersLinked color="green" size={16} />
                            ) : relationship_type === "child" ? (
                              <IconLinkOff color="red" size={16} />
                            ) : null}
                          </ActionIcon>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                          <Text size="sm">
                            {relationship_type === "parent"
                              ? "This asset is a parent asset."
                              : "This asset is a child asset."}
                          </Text>
                        </HoverCard.Dropdown>
                      </HoverCard>
                    )}
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
            accessor: "r.inventory_request_status",
            title: "Status",
            width: 180,
            sortable: true,
            hidden: checkIfColumnIsHidden("inventory_request_status"),
            render: ({ inventory_request_status }) => {
              return <Text>{String(inventory_request_status)}</Text>;
            },
          },
          {
            accessor: "r.inventory_request_name",
            title: "Asset Name",
            width: 180,
            sortable: true,
            hidden: checkIfColumnIsHidden("inventory_request_name"),
            render: ({ inventory_request_name }) => {
              return <Text>{String(inventory_request_name)}</Text>;
            },
          },
          {
            accessor: "r.inventory_request_cost",
            title: "Cost",
            width: 250,
            sortable: true,
            hidden: checkIfColumnIsHidden("inventory_request_cost"),
            footer: (
              <Text weight="bold" size="sm">
                Total Asset Cost: ₱
                {totalCost.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ),
            render: ({ inventory_request_cost }) => {
              const costValue = Number(inventory_request_cost);
              return (
                <Text>
                  ₱
                  {Number(costValue).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              );
            },
          },
          ...dynamicColumns,
          {
            accessor: "view",
            title: "View",
            hidden: checkIfColumnIsHidden("view"),
            width: 180,
            textAlignment: "center",
            render: ({ inventory_request_tag_id }) => (
              <ActionIcon
                maw={120}
                mx="auto"
                color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/inventory/${inventory_request_tag_id}`
                  )
                }
              >
                <IconArrowsMaximize size={16} />
              </ActionIcon>
            ),
          },
        ]}
        type="asset"
        showTableColumnFilter={showTableColumnFilter}
        setShowTableColumnFilter={setShowTableColumnFilter}
        listTableColumnFilter={listTableColumnFilter}
        setListTableColumnFilter={setListTableColumnFilter}
        tableColumnList={tableColumnList}
      />
    </>
  );
};

export default EventFilterByTagIdTable;
