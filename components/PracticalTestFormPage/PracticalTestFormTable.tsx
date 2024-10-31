import { useActiveTeam } from "@/stores/useTeamStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor } from "@/utils/styling";
import {
  PracticalTestType,
  TechnicalAssessmentFilterValues,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Avatar,
  CopyButton,
  createStyles,
  Flex,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconCopy } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import router from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import ListTable from "../ListTable/ListTable";

const useStyles = createStyles(() => ({
  creator: {
    border: "solid 2px white",
    cursor: "pointer",
  },
  clickable: {
    cursor: "pointer",
  },
}));

const defaultAvatarProps = { color: "blue", size: "sm", radius: "xl" };

type Props = {
  practicalTestList: PracticalTestType[];
  practicalTestCount: number;
  activePage: number;
  isFetchingRequestList: boolean;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<TechnicalAssessmentFilterValues>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const PracticalTestFormTable = ({
  practicalTestList,
  practicalTestCount,
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
  const activeTeam = useActiveTeam();
  const { classes } = useStyles();

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <ListTable
      idAccessor="practical_test_id"
      records={practicalTestList}
      fetching={isFetchingRequestList}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={practicalTestCount}
      recordsPerPage={DEFAULT_REQUEST_LIST_LIMIT}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "practical_test_id",
          title: "ID",
          width: 180,
          hidden: checkIfColumnIsHidden("practical_test_id"),
          render: ({ practical_test_id }) => {
            return (
              <Flex key={String(practical_test_id)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/practical-test-form/${practical_test_id}`}
                    target="_blank"
                  >
                    {String(practical_test_id)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/practical-test-form/${practical_test_id}`}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : `Copy ${practical_test_id}`}
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
          accessor: "practical_test_label",
          title: "Label",
          sortable: true,
          hidden: checkIfColumnIsHidden("practical_test_label"),
          render: ({ practical_test_label }) => (
            <Text>{String(practical_test_label)}</Text>
          ),
        },
        {
          accessor: "practical_test_passing_score",
          title: "Passing Score",
          sortable: true,
          hidden: checkIfColumnIsHidden("practical_test_passing_score"),
          render: ({ practical_test_passing_score }) => (
            <Text>{String(practical_test_passing_score)}</Text>
          ),
        },
        {
          accessor: "practical_test_date_created",
          title: "Date Created",
          hidden: checkIfColumnIsHidden("practical_test_date_created"),
          sortable: true,
          render: ({ practical_test_date_created }) => (
            <Text>
              {formatDate(new Date(String(practical_test_date_created)))}
            </Text>
          ),
        },
        {
          accessor: "practical_test_created_by",
          title: "Created By",
          sortable: true,
          hidden: checkIfColumnIsHidden("practical_test_created_by"),
          render: (practical_test) => {
            if (!practical_test) {
              return null;
            }
            const {
              user_id: user_id,
              user_first_name: user_first_name,
              user_last_name: user_last_name,
              team_member_id,
            } = practical_test.practical_test_created_by_user as {
              user_id: string;
              user_first_name: string;
              user_last_name: string;
              team_member_id: string;
            };
            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  {...defaultAvatarProps}
                  color={getAvatarColor(Number(`${user_id.charCodeAt(0)}`))}
                  className={classes.creator}
                  onClick={() => window.open(`/member/${team_member_id}`)}
                >
                  {user_first_name[0] + user_last_name[0]}
                </Avatar>
                <Anchor href={`/member/${team_member_id}`} target="_blank">
                  <Text>{`${user_first_name} ${user_last_name}`}</Text>
                </Anchor>
              </Flex>
            );
          },
        },
        {
          accessor: "practical_test_date_updated",
          title: "Date Updated",
          hidden: checkIfColumnIsHidden("practical_test_date_updated"),
          sortable: true,
          render: ({ practical_test_date_updated }) => {
            // Check if the date is a valid date string
            const dateUpdated = practical_test_date_updated
              ? new Date(String(practical_test_date_updated))
              : null;
            return <Text>{dateUpdated ? formatDate(dateUpdated) : null}</Text>;
          },
        },
        {
          accessor: "practical_test_updated_by_user",
          title: "Updated By",
          sortable: true,
          hidden: checkIfColumnIsHidden("practical_test_updated_by"),
          render: (practical_test) => {
            if (!practical_test.practical_test_updated_by_user) {
              return null;
            }
            const {
              user_id: user_id,
              user_first_name: user_first_name,
              user_last_name: user_last_name,
              team_member_id,
            } = practical_test.practical_test_updated_by_user as {
              user_id: string;
              user_first_name: string;
              user_last_name: string;
              team_member_id: string;
            };
            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  {...defaultAvatarProps}
                  color={getAvatarColor(Number(`${user_id.charCodeAt(0)}`))}
                  className={classes.creator}
                  onClick={() => window.open(`/member/${team_member_id}`)}
                >
                  {user_first_name[0] + user_last_name[0]}
                </Avatar>
                <Anchor href={`/member/${team_member_id}`} target="_blank">
                  <Text>{`${user_first_name} ${user_last_name}`}</Text>
                </Anchor>
              </Flex>
            );
          },
        },
        {
          accessor: "view",
          title: "View",
          hidden: checkIfColumnIsHidden("view"),
          textAlignment: "center",
          render: ({ practical_test_id }) => {
            return (
              <ActionIcon
                maw={120}
                mx="auto"
                color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/practical-test-form/${practical_test_id}`
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

export default PracticalTestFormTable;
