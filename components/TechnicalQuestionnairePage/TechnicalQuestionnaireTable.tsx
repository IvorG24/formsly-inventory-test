import { useActiveTeam } from "@/stores/useTeamStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor } from "@/utils/styling";
import {
  TechnicalAssessmentFilterValues,
  TechnicalAssessmentTableRow,
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

type Props = {
  questionnairList: TechnicalAssessmentTableRow[];
  questionnairListCount: number;
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

const TechnicalQuestionnaireTable = ({
  questionnairList,
  questionnairListCount,
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
      idAccessor="questionnaire_id"
      records={questionnairList}
      fetching={isFetchingRequestList}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={questionnairListCount}
      recordsPerPage={DEFAULT_REQUEST_LIST_LIMIT}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "questionnaire_id",
          title: "Questionnaire ID",
          width: 180,
          hidden: checkIfColumnIsHidden("questionnaire_id"),
          render: ({ questionnaire_id }) => {
            return (
              <Flex key={String(questionnaire_id)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/technical-question/${questionnaire_id}`}
                    target="_blank"
                  >
                    {String(questionnaire_id)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/technical-question/${questionnaire_id}`}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : `Copy ${questionnaire_id}`}
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
          accessor: "questionnaire_name",
          title: "Questionnaire Name",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_status"),
          render: ({ questionnaire_name }) => (
            <Flex justify="left">
              <Text>{String(questionnaire_name)}</Text>
            </Flex>
          ),
        },

        {
          accessor: "questionnaire_date_created",
          title: "Date Created",
          hidden: checkIfColumnIsHidden("questionnaire_date_created"),
          sortable: true,
          render: ({ questionnaire_date_created }) => (
            <Text>
              {formatDate(new Date(String(questionnaire_date_created)))}
            </Text>
          ),
        },
        {
          accessor: "questionnaire_created_by",
          title: "Created By",
          sortable: true,
          hidden: checkIfColumnIsHidden("questionnaire_created_by"),
          render: (questionnaire) => {
            if (!questionnaire) {
              return null;
            }
            const {
              user_id: user_id,
              user_first_name: user_first_name,
              user_last_name: user_last_name,
              team_member_id,
            } = questionnaire.questionnaire_created_by as {
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
          accessor: "questionnaire_date_updated",
          title: "Date Updated",
          hidden: checkIfColumnIsHidden("questionnaire_date_updated"),
          sortable: true,
          render: ({ questionnaire_date_updated }) => {
            // Check if the date is a valid date string
            const dateUpdated = questionnaire_date_updated
              ? new Date(String(questionnaire_date_updated))
              : null;
            return <Text>{dateUpdated ? formatDate(dateUpdated) : null}</Text>;
          },
        },
        {
          accessor: "questionnaire_updated_by",
          title: "Updated By",
          sortable: true,
          hidden: checkIfColumnIsHidden("questionnaire_updated_by"),
          render: (questionnaire) => {
            if (!questionnaire.questionnaire_updated_by) {
              return null;
            }
            const {
              user_id: user_id,
              user_first_name: user_first_name,
              user_last_name: user_last_name,
              team_member_id,
            } = questionnaire.questionnaire_updated_by as {
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
          render: ({ questionnaire_id }) => {
            return (
              <ActionIcon
                maw={120}
                mx="auto"
                color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/technical-question/${questionnaire_id}`
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

export default TechnicalQuestionnaireTable;
