import { getMemoList } from "@/backend/api/get";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import {
  DEFAULT_REQUEST_LIST_LIMIT,
  DEFAULT_TICKET_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor } from "@/utils/styling";
import { MemoListItemType } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  CopyButton,
  Divider,
  Flex,
  Group,
  MultiSelect,
  Paper,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure, useFocusWithin, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconArrowsMaximize,
  IconCopy,
  IconEyeFilled,
  IconReload,
  IconSearch,
} from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ListTable from "../ListTable/ListTable";
import MemoFormatEditor from "../MemoFormatEditor/MemoFormatEditor";
import MemoItemListSignerList from "./MemoListItemSignerList";

type Props = {
  memoList: MemoListItemType[];
  memoListCount: number;
};

type FilterFormValues = {
  authorFilter: string[];
  approverFilter: string[];
  status: string[] | undefined;
  isAscendingSort: boolean;
  searchFilter: string;
};

export const getMemoStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "green";

    case "PENDING":
      return "blue";

    case "REJECTED":
      return "red";

    default:
      break;
  }
};

const MemoListPage = ({
  memoList: initialMemoList,
  memoListCount: initialMemoListCount,
}: Props) => {
  const router = useRouter();
  const userTeamMemberData = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const [isFilter, setIsfilter] = useState(false);
  const teamMemberList = useTeamMemberList();
  // filter data
  const { ref: authorRef, focused: authorRefFocused } = useFocusWithin();
  const { ref: approverRef, focused: approverRefFocused } = useFocusWithin();
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();

  const authorList = teamMemberList.map((member) => ({
    value: member.team_member_user.user_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const approverList = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const statusList = [
    { value: "APPROVED", label: "Approved" },
    { value: "PENDING", label: "Pending" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const defaultAvatarProps = { color: "blue", size: "sm", radius: "xl" };

  const [
    memoFormatEditorIsOpened,
    { open: openMemoFormatEditor, close: closeMemoFormatEditor },
  ] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [memoListCount, setMemoListCount] = useState(initialMemoListCount);
  const [memoList, setMemoList] = useState(initialMemoList);
  const [filter, setFilter] = useState<FilterFormValues>({
    authorFilter: [],
    approverFilter: [],
    status: undefined,
    isAscendingSort: false,
    searchFilter: "",
  });
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "memo_date_created",
    direction: "desc",
  });

  const { handleSubmit, getValues, control, register, setValue } =
    useForm<FilterFormValues>({
      defaultValues: filter,
    });

  const columnAccessor = () => {
    if (sortStatus.columnAccessor === "memo_author_user_id") {
      return `user_table.user_first_name ${sortStatus.direction.toUpperCase()}, user_table.user_last_name `;
    }
    return sortStatus.columnAccessor;
  };
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);
  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "memo-list-table-column-filter",
    defaultValue: [],
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const tableColumnList = [
    { value: "memo_id", label: "Memo ID" },
    { value: "memo_subject", label: "Subject" },
    { value: "memo_status", label: "Status" },
    { value: "memo_author_user_id", label: "Author" },
    { value: "memo_signer_list", label: "Approver" },
    { value: "memo_date_created", label: "Date Created" },
    { value: "view", label: "View" },
  ];

  const handlePagination = async ({
    overidePage,
  }: { overidePage?: number } = {}) => {
    try {
      if (!activeTeam.team_id) return;
      setIsLoading(true);

      const {
        approverFilter,
        authorFilter,
        isAscendingSort,
        searchFilter,
        status,
      } = getValues();

      const { data, count } = await getMemoList(supabaseClient, {
        teamId: activeTeam.team_id,
        page: overidePage !== undefined ? overidePage : activePage || 1,
        limit: DEFAULT_TICKET_LIST_LIMIT,
        authorFilter:
          authorFilter && authorFilter.length > 0 ? authorFilter : undefined,
        approverFilter:
          approverFilter && approverFilter.length > 0
            ? approverFilter
            : undefined,
        columnAccessor: columnAccessor(),
        searchFilter,
        sort: isAscendingSort
          ? "ascending"
          : ("descending" as "ascending" | "descending"),
        status,
      });

      setMemoList(data);
      setMemoListCount(count || 0);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (
    key: keyof FilterFormValues,
    value: string[] | boolean = []
  ) => {
    const filterMatch = filter[`${key}`];

    if (value !== filterMatch) {
      handlePagination({ overidePage: 1 });
      setActivePage(1);
      setFilter((prev) => ({ ...prev, [`${key}`]: value }));
    }
  };

  // sorting
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    setFilter((prev) => {
      return {
        ...prev,
        isAscendingSort: sortStatus.direction === "asc" ? false : true,
      };
    });

    handlePagination();
  }, [sortStatus]);

  return (
    <Container maw={3840} h="100%">
      <Group pb="sm">
        <Box>
          <Title order={4}>Memo List Page</Title>
          <Text>Manage your team memo here.</Text>
        </Box>
        {["OWNER", "ADMIN"].includes(
          `${userTeamMemberData?.team_member_role}`
        ) && (
          <Button variant="light" onClick={openMemoFormatEditor}>
            Manage Memo Format
          </Button>
        )}
      </Group>
      {/* memo filters */}
      <Paper p="md">
        <form
          onSubmit={handleSubmit(() => {
            handlePagination({ overidePage: 1 });
            setActivePage(1);
          })}
        >
          <Flex gap="sm" wrap="wrap" align="center">
            <TextInput
              placeholder="Search memo"
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              {...register("searchFilter")}
              sx={{ flex: 2 }}
              miw={250}
              maw={320}
            />
            <Button
              variant="light"
              leftIcon={<IconReload size={16} />}
              onClick={() => {
                setActivePage(1);
                handlePagination();
              }}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Flex gap="sm" wrap="wrap" align="center">
              <p>Show/Hide Table Columns</p>
              <Switch
                onLabel={<IconEyeFilled size="14" />}
                checked={showTableColumnFilter}
                onChange={(event) =>
                  setShowTableColumnFilter(event.currentTarget.checked)
                }
              />
            </Flex>
            <Flex gap="sm" wrap="wrap" align="center">
              <p>Filter</p>
              <Switch
                onLabel={<IconEyeFilled size="14" />}
                checked={isFilter}
                onChange={(event) => setIsfilter(event.currentTarget.checked)}
              />
            </Flex>
          </Flex>
          <Divider my="md" />
          {isFilter && (
            <Flex gap="sm" wrap="wrap" align="center" mb="sm">
              <Controller
                control={control}
                name="status"
                render={({ field: { value, onChange } }) => (
                  <MultiSelect
                    data={statusList}
                    placeholder="Status"
                    ref={statusRef}
                    value={value}
                    onChange={(value) => {
                      onChange(value);
                      if (!statusRefFocused)
                        handleFilterChange("status", value);
                    }}
                    onDropdownClose={() =>
                      handleFilterChange("status", value as string[])
                    }
                    miw={250}
                    maw={320}
                  />
                )}
              />
              <Controller
                control={control}
                name="authorFilter"
                render={({ field: { value, onChange } }) => (
                  <MultiSelect
                    searchable
                    clearable
                    data={authorList}
                    placeholder="Author"
                    ref={authorRef}
                    value={value}
                    onChange={(value) => {
                      onChange(value);
                      if (!authorRefFocused)
                        handleFilterChange("authorFilter", value);
                    }}
                    onDropdownClose={() =>
                      handleFilterChange("authorFilter", value as string[])
                    }
                    miw={250}
                    maw={320}
                  />
                )}
              />

              <Controller
                control={control}
                name="approverFilter"
                render={({ field: { value, onChange } }) => (
                  <MultiSelect
                    searchable
                    clearable
                    data={approverList}
                    placeholder="Approver"
                    ref={approverRef}
                    value={value}
                    onChange={(value) => {
                      onChange(value);
                      if (!approverRefFocused)
                        handleFilterChange("approverFilter", value);
                    }}
                    onDropdownClose={() =>
                      handleFilterChange("approverFilter", value as string[])
                    }
                    miw={250}
                    maw={320}
                  />
                )}
              />
            </Flex>
          )}
        </form>

        <Box h="fit-content" pos="relative">
          {/* memo list */}
          <ListTable
            idAccessor="memo_id"
            records={memoList}
            fetching={isLoading}
            page={activePage}
            onPageChange={(page) => {
              setActivePage(page);
              handlePagination({ overidePage: page });
            }}
            totalRecords={memoListCount}
            recordsPerPage={DEFAULT_REQUEST_LIST_LIMIT}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            columns={[
              {
                accessor: "memo_id",
                title: "ID",
                width: 180,
                hidden: checkIfColumnIsHidden("memo_id"),
                render: ({ memo_id, memo_reference_number }) => {
                  return (
                    <Flex gap="md" align="center">
                      <Text truncate maw={150}>
                        <Anchor
                          href={`/${formatTeamNameToUrlKey(
                            activeTeam.team_name ?? ""
                          )}/memo/${memo_id}`}
                          target="_blank"
                          color="blue"
                        >
                          {String(memo_reference_number)}
                        </Anchor>
                      </Text>

                      <CopyButton value={String(memo_reference_number)}>
                        {({ copied, copy }) => (
                          <Tooltip
                            label={
                              copied
                                ? "Copied"
                                : `Copy ${memo_reference_number}`
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
                accessor: "memo_subject",
                title: "Subject",
                hidden: checkIfColumnIsHidden("memo_subject"),
                sortable: true,
              },
              {
                accessor: "memo_status",
                title: "Status",
                sortable: true,
                hidden: checkIfColumnIsHidden("memo_status"),
                render: ({ memo_status }) => {
                  return (
                    <Flex justify="center">
                      <Badge
                        variant="filled"
                        color={getMemoStatusColor(String(memo_status))}
                      >
                        {String(memo_status)}
                      </Badge>
                    </Flex>
                  );
                },
              },
              {
                accessor: "memo_author_user_id",
                title: "Author",
                hidden: checkIfColumnIsHidden("memo_author_user_id"),
                sortable: true,
                render: (memo) => {
                  const { memo_author_user } = memo as {
                    memo_author_user: {
                      user_first_name: string;
                      user_last_name: string;
                      user_avatar: string | null;
                      user_id: string;
                    };
                    memo_author_user_id: string;
                  };
                  const {
                    user_first_name,
                    user_last_name,
                    user_avatar,
                    user_id,
                  } = memo_author_user;

                  return (
                    <Flex px={0} gap={8} align="center">
                      <Avatar
                        {...defaultAvatarProps}
                        color={getAvatarColor(
                          Number(`${user_id.charCodeAt(0)}`)
                        )}
                        src={user_avatar}
                      >
                        {(user_first_name[0] + user_last_name[0]).toUpperCase()}
                      </Avatar>
                      <Text>{`${user_first_name} ${user_last_name}`}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessor: "memo_signer_list",
                title: "Approver",
                hidden: checkIfColumnIsHidden("memo_signer_list"),
                render: (memo) => {
                  const { memo_signer_list } = memo as MemoListItemType;
                  return (
                    <MemoItemListSignerList signerList={memo_signer_list} />
                  );
                },
              },
              {
                accessor: "memo_date_created",
                title: "Date Created",
                sortable: true,
                hidden: checkIfColumnIsHidden("memo_date_created"),
                render: ({ memo_date_created }) => {
                  if (!memo_date_created) {
                    return null;
                  }

                  return (
                    <Flex justify="center">
                      <Text>
                        {formatDate(new Date(String(memo_date_created)))}
                      </Text>
                    </Flex>
                  );
                },
              },
              {
                accessor: "view",
                title: "View",
                hidden: checkIfColumnIsHidden("view"),
                render: ({ memo_id }) => {
                  return (
                    <Flex justify="center">
                      <ActionIcon
                        color="blue"
                        onClick={() =>
                          router.push(
                            `/${formatTeamNameToUrlKey(
                              activeTeam.team_name ?? ""
                            )}/memo/${memo_id}`
                          )
                        }
                      >
                        <IconArrowsMaximize size={16} />
                      </ActionIcon>
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
        </Box>
        <MemoFormatEditor
          opened={memoFormatEditorIsOpened}
          close={closeMemoFormatEditor}
        />
      </Paper>
    </Container>
  );
};

export default MemoListPage;
