import ListTable from "@/components/ListTable/ListTable";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor, getStatusToColor } from "@/utils/styling";
import {
  RequestListFilterValues,
  RequestListItemType,
  TeamMemberWithUserType,
} from "@/utils/types";
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
import router from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { UseFormSetValue } from "react-hook-form";

type Props = {
  requestList: RequestListItemType[];
  requestListCount: number;
  teamMemberList: TeamMemberWithUserType[];
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

const defaultAvatarProps = { color: "blue", size: "sm", radius: "xl" };

const AssetListTable = ({
  requestList,
  requestListCount,
  teamMemberList,
  activePage,
  isFetchingRequestList,
  handlePagination,
  selectedFormFilter,
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
  const { classes } = useStyles();
  const activeTeam = useActiveTeam();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  const handleRowSelect = (requestId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRows((prev) => [...prev, requestId]);
    } else {
      setSelectedRows((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const isAllSelected = selectedRows.length === requestList.length;

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = requestList.map((request) => request.request_id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };
  //   const dummyData: RequestListItemType[] = [
  //     {
  //       request_id: "1243123",
  //       request_formsly_id: "12345-abc",
  //       request_date_created: "2024-09-26T04:36:00Z",
  //       request_status: "Check out",
  //       request_jira_id: "JIRA-001",
  //       request_jira_link: "https://jira.example.com/browse/JIRA-001",
  //       request_otp_id: "OTP-12345",
  //       request_form_id: "form-12345",
  //       request_team_member_id: "321",
  //       request_signer: [
  //         {
  //           request_signer: {
  //             signer_is_primary_signer: true,
  //             signer_team_member_id: "",
  //           },
  //           request_signer_id: "",
  //           request_signer_status: "Check Out",
  //         },
  //       ],
  //       user_id: "123",
  //       user_first_name: "Mark",
  //       user_last_name: "Ivor Glorioso",
  //       user_avatar: "https://example.com/avatar.jpg", // Optional
  //       form_name: "This is a sample item",
  //       request_is_with_view_indicator: true,
  //       request_is_with_progress_indicator: false,
  //     },
  //     {
  //       request_id: "1",
  //       request_formsly_id: "12345-efg",
  //       request_date_created: "2024-09-26T04:36:00Z",
  //       request_status: "Check In",
  //       request_jira_id: "JIRA-001",
  //       request_jira_link: "https://jira.example.com/browse/JIRA-001",
  //       request_otp_id: "OTP-12345",
  //       request_form_id: "form-12345",
  //       request_team_member_id: "321",
  //       request_signer: [
  //         {
  //           request_signer: {
  //             signer_is_primary_signer: true,
  //             signer_team_member_id: "",
  //           },
  //           request_signer_id: "",
  //           request_signer_status: "Check Out",
  //         },
  //       ],
  //       user_id: "123",
  //       user_first_name: "Mark",
  //       user_last_name: "Ivor Glorioso",
  //       user_avatar: "https://example.com/avatar.jpg", // Optional
  //       form_name: "This is a sample item",
  //       request_is_with_view_indicator: true,
  //       request_is_with_progress_indicator: false,
  //     },
  //   ];

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
          accessor: "checkbox",
          title: (
            <Checkbox
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          ),
          width: 40,
          render: ({ request_id }) => {
            const isChecked = selectedRows.includes(String(request_id));
            return (
              <Checkbox
                checked={isChecked}
                onChange={(e) =>
                  handleRowSelect(String(request_id), e.target.checked)
                }
              />
            );
          },
        },
        {
          accessor: "request_id",
          title: "Asset Tag ID",
          width: 180,
          hidden: checkIfColumnIsHidden("request_id"),
          render: ({ request_id, request_formsly_id }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;

            return (
              <Flex key={String(requestId)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/requests/${requestId}`}
                    target="_blank"
                  >
                    {String(requestId)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/requests/${requestId}`}
                >
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
          title: "Description",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_form_name"),
          render: ({ form_name }) => {
            return (
              <Text truncate maw={150}>
                {String(form_name)}
              </Text>
            );
          },
        },
        {
          accessor: "request_status",
          title: "Brand",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_status"),
          render: ({ request_status }) => (
            <Flex justify="center">
              <Text>Asus</Text>
            </Flex>
          ),
        },
        {
          accessor: "request_date_created",
          title: "Purchase Date",
          hidden: checkIfColumnIsHidden("request_date_created"),
          sortable: true,
          render: ({ request_date_created }) => (
            <Text>{formatDate(new Date(String(request_date_created)))}</Text>
          ),
        },
        {
          accessor: "request_date_created",
          title: "Cost",
          hidden: checkIfColumnIsHidden("request_date_created"),
          sortable: true,
          render: ({ request_date_created }) => <Text> P 1,440</Text>,
        },

        {
          accessor: "user_id",
          title: "Created By",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_team_member_id"),
          render: (request) => {
            const {
              user_id,
              user_first_name,
              user_last_name,
              request_team_member_id,
            } = request as {
              user_id: string;
              user_first_name: string;
              user_last_name: string;
              request_team_member_id: string;
            };

            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  // src={requestor.user_avatar}
                  {...defaultAvatarProps}
                  color={
                    user_id
                      ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                      : undefined
                  }
                  className={classes.requestor}
                  onClick={() =>
                    request_team_member_id
                      ? window.open(`/member/${request_team_member_id}`)
                      : null
                  }
                >
                  {user_id ? `${user_first_name[0] + user_last_name[0]}` : ""}
                </Avatar>
                {user_id && (
                  <Anchor
                    href={`/member/${request_team_member_id}`}
                    target="_blank"
                  >
                    <Text>{`${user_first_name} ${user_last_name}`}</Text>
                  </Anchor>
                )}
                {!user_id && <Text>Public User</Text>}
              </Flex>
            );
          },
        },

        {
          accessor: "request_status",
          title: "Status",
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
          accessor: "request_date_created",
          title: "Model",
          hidden: checkIfColumnIsHidden("request_date_created"),
          sortable: true,
          render: ({ request_date_created }) => <Text>Model 001</Text>,
        },
        {
          accessor: "user_id",
          title: "Created By",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_team_member_id"),
          render: (request) => {
            const {
              user_id,
              user_first_name,
              user_last_name,
              request_team_member_id,
            } = request as {
              user_id: string;
              user_first_name: string;
              user_last_name: string;
              request_team_member_id: string;
            };

            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  // src={requestor.user_avatar}
                  {...defaultAvatarProps}
                  color={
                    user_id
                      ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                      : undefined
                  }
                  className={classes.requestor}
                  onClick={() =>
                    request_team_member_id
                      ? window.open(`/member/${request_team_member_id}`)
                      : null
                  }
                >
                  {user_id ? `${user_first_name[0] + user_last_name[0]}` : ""}
                </Avatar>
                {user_id && (
                  <Anchor
                    href={`/member/${request_team_member_id}`}
                    target="_blank"
                  >
                    <Text>{`${user_first_name} ${user_last_name}`}</Text>
                  </Anchor>
                )}
                {!user_id && <Text>Public User</Text>}
              </Flex>
            );
          },
        },
        {
          accessor: "user_id",
          title: "Assigned To",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_team_member_id"),
          render: (request) => {
            const {
              user_id,
              user_first_name,
              user_last_name,
              request_team_member_id,
            } = request as {
              user_id: string;
              user_first_name: string;
              user_last_name: string;
              request_team_member_id: string;
            };

            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  // src={requestor.user_avatar}
                  {...defaultAvatarProps}
                  color={
                    user_id
                      ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                      : undefined
                  }
                  className={classes.requestor}
                  onClick={() =>
                    request_team_member_id
                      ? window.open(`/member/${request_team_member_id}`)
                      : null
                  }
                >
                  {user_id ? `${user_first_name[0] + user_last_name[0]}` : ""}
                </Avatar>
                {user_id && (
                  <Anchor
                    href={`/member/${request_team_member_id}`}
                    target="_blank"
                  >
                    <Text>{`${user_first_name} ${user_last_name}`}</Text>
                  </Anchor>
                )}
                {!user_id && <Text>Public User</Text>}
              </Flex>
            );
          },
        },
        {
          accessor: "view",
          title: "View",
          hidden: checkIfColumnIsHidden("view"),
          textAlignment: "center",
          render: ({ request_id, request_formsly_id }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;
            return (
              <ActionIcon
                maw={120}
                mx="auto"
                color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/requests/${requestId}`
                  )
                }
              >
                <IconArrowsMaximize size={16} />
              </ActionIcon>
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

export default AssetListTable;
