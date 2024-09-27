import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { getStatusToColor } from "@/utils/styling";
import {
  RequestListItemSignerType,
  RequestListItemType,
  UserRequestListFilterValues,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Badge,
  CopyButton,
  Flex,
  Indicator,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconCopy, IconGraph } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import router from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import ListTable from "../ListTable/ListTable";
import RequestSignerList from "../RequestListPage/RequestSignerList";

type Props = {
  requestList: RequestListItemType[];
  requestListCount: number;
  activePage: number;
  isFetchingRequestList: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<UserRequestListFilterValues>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const UserRequestListTable = ({
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
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
}: Props) => {
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <ListTable
      idAccessor="request_id"
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
          accessor: "request_id",
          title: "Request ID",
          width: 180,
          hidden: checkIfColumnIsHidden("request_id"),
          render: ({ request_id, request_formsly_id }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;

            return (
              <Flex key={String(requestId)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor href={`/user/requests/${requestId}`} target="_blank">
                    {String(requestId)}
                  </Anchor>
                </Text>
                <CopyButton value={`${BASE_URL}/user/requests/${requestId}`}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : `Copy ${requestId}`}
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
          accessor: "form_name",
          title: "Form Name",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_form_name"),
          render: ({ form_name }) => {
            return (
              <Text truncate maw={250}>
                {String(form_name)}
              </Text>
            );
          },
        },
        {
          accessor: "request_status",
          title: "Formsly Status",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_status"),
          render: ({ request_status }) => (
            <Flex justify="center">
              <Badge
                variant="filled"
                color={getStatusToColor(String(request_status))}
              >
                {String(request_status)}
              </Badge>
            </Flex>
          ),
        },
        {
          accessor: "request_signer",
          title: "Approver",
          hidden: checkIfColumnIsHidden("request_signer"),
          render: (request) => {
            const { request_signer } = request as {
              request_signer: RequestListItemSignerType[];
            };

            return <RequestSignerList signerList={request_signer} />;
          },
        },

        {
          accessor: "request_date_created",
          title: "Date Created",
          hidden: checkIfColumnIsHidden("request_date_created"),
          sortable: true,
          render: ({ request_date_created }) => (
            <Text>{formatDate(new Date(String(request_date_created)))}</Text>
          ),
        },
        {
          accessor: "progress",
          title: "Progress",
          hidden: checkIfColumnIsHidden("progress"),
          textAlignment: "center",
          render: ({
            request_form_id,
            request_is_with_progress_indicator,
            request_formsly_id,
            request_id,
          }) => {
            if (request_form_id !== "16ae1f62-c553-4b0e-909a-003d92828036")
              return null;
            return (
              <Tooltip label="View Progress" openDelay={100}>
                <ActionIcon
                  maw={120}
                  mx="auto"
                  color="blue"
                  onClick={async () => {
                    const requestId =
                      request_formsly_id === "-"
                        ? request_id
                        : request_formsly_id;
                    await router.push(
                      `/user/application-progress/${requestId}`
                    );
                  }}
                >
                  {request_is_with_progress_indicator ? (
                    <Indicator color="red" size={8} offset={-4}>
                      <IconGraph size={16} />
                    </Indicator>
                  ) : (
                    <IconGraph size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            );
          },
        },
        {
          accessor: "view",
          title: "View",
          hidden: checkIfColumnIsHidden("view"),
          textAlignment: "center",
          render: ({
            request_id,
            request_formsly_id,
            request_is_with_view_indicator,
          }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;
            return (
              <Tooltip label="View Request" openDelay={100}>
                <ActionIcon
                  maw={120}
                  mx="auto"
                  color="blue"
                  onClick={async () =>
                    await router.push(`/user/requests/${requestId}`)
                  }
                >
                  {request_is_with_view_indicator ? (
                    <Indicator color="red" size={8} offset={-4}>
                      <IconArrowsMaximize size={16} />
                    </Indicator>
                  ) : (
                    <IconArrowsMaximize size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            );
          },
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

export default UserRequestListTable;
