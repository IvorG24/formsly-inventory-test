import {
  BASE_URL,
  DEFAULT_APPLICATION_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import {
  ApplicationListFilterValues,
  ApplicationListItemType,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Button,
  CopyButton,
  Flex,
  Indicator,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCopy, IconGraph } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import router from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import ListTable from "../ListTable/ListTable";

type Props = {
  applicationList: ApplicationListItemType[];
  applicationListCount: number;
  activePage: number;
  isFetchingApplicationList: boolean;
  handlePagination: (p: number) => void;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<ApplicationListFilterValues>;
};

const UserApplicationListTable = ({
  applicationList,
  applicationListCount,
  activePage,
  isFetchingApplicationList,
  handlePagination,
  checkIfColumnIsHidden,
  showTableColumnFilter,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
  sortStatus,
  setSortStatus,
  setValue,
}: Props) => {
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <ListTable
      idAccessor="request_id"
      records={applicationList}
      fetching={isFetchingApplicationList}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={applicationListCount}
      recordsPerPage={DEFAULT_APPLICATION_LIST_LIMIT}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "request_id",
          title: "Application ID",
          width: 180,
          hidden: checkIfColumnIsHidden("request_id"),
          render: ({ request_id, request_formsly_id }) => {
            const applicationId =
              request_formsly_id === "-" ? request_id : request_formsly_id;
            return (
              <Flex key={String(applicationId)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/user/requests/${applicationId}`}
                    target="_blank"
                  >
                    {String(applicationId)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/user/requests/${applicationId}`}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : `Copy ${applicationId}`}
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
          accessor: "",
          title: "Position",
          hidden: checkIfColumnIsHidden("request_date_created"),

          render: ({ request_application_information_position }) => (
            <Text>
              {safeParse(request_application_information_position as string)}
            </Text>
          ),
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
          width: 200,
          render: ({
            request_is_with_progress_indicator,
            request_formsly_id,
            request_id,
          }) => {
            return (
              <Flex>
                {request_is_with_progress_indicator ? (
                  <Indicator color="red" size={8} mx="auto">
                    <Button
                      variant="light"
                      rightIcon={<IconGraph size={16} />}
                      onClick={async () => {
                        const applicationId =
                          request_formsly_id === "-"
                            ? request_id
                            : request_formsly_id;
                        await router.push(
                          `/user/application-progress/${applicationId}`
                        );
                      }}
                    >
                      View Progress
                    </Button>
                  </Indicator>
                ) : (
                  <Button
                    mx="auto"
                    variant="light"
                    rightIcon={<IconGraph size={16} />}
                    onClick={async () => {
                      const applicationId =
                        request_formsly_id === "-"
                          ? request_id
                          : request_formsly_id;
                      await router.push(
                        `/user/application-progress/${applicationId}`
                      );
                    }}
                  >
                    View Progress
                  </Button>
                )}
              </Flex>
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

export default UserApplicationListTable;
