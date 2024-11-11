import { deleteRow } from "@/backend/api/delete";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { TeamGroupTableRow } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
  createStyles,
} from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Dispatch, SetStateAction, useState } from "react";

const useStyles = createStyles((theme) => ({
  checkbox: {
    input: { cursor: "pointer" },
  },
  flexGrow: {
    [theme.fn.smallerThan("lg")]: {
      flexGrow: 1,
    },
  },
  clickableColumn: {
    "&:hover": {
      color:
        theme.colorScheme === "dark"
          ? theme.colors.gray[7]
          : theme.colors.gray[5],
    },
    cursor: "pointer",
  },
  disabledColumn: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.gray[7]
        : theme.colors.gray[5],
    cursor: "pointer",
  },
}));

type Props = {
  groupList: TeamGroupTableRow[];
  setGroupList: Dispatch<SetStateAction<TeamGroupTableRow[]>>;
  setGroupCount: Dispatch<SetStateAction<number>>;
  setIsCreatingGroup: Dispatch<SetStateAction<boolean>>;
  setSelectedGroup: Dispatch<SetStateAction<TeamGroupTableRow | null>>;
  setIsFetchingMembers: Dispatch<SetStateAction<boolean>>;
  selectedGroup: TeamGroupTableRow | null;
  isOwnerOrAdmin: boolean;
  isLoading: boolean;
  handleFetch: (search: string, page: number) => void;
  isFetchingMembers: boolean;
  groupCount: number;
};

const GroupList = ({
  groupList,
  setGroupList,
  setIsCreatingGroup,
  setSelectedGroup,
  setIsFetchingMembers,
  selectedGroup,
  isOwnerOrAdmin,
  handleFetch,
  isLoading,
  groupCount,
  isFetchingMembers,
}: Props) => {
  const { classes } = useStyles();
  const supabaseClient = useSupabaseClient();

  const [activePage, setActivePage] = useState(1);
  const [checkList, setCheckList] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const headerCheckboxKey = generateRandomId();

  const handleCheckRow = (groupId: string) => {
    if (checkList.includes(groupId)) {
      setCheckList(checkList.filter((id) => id !== groupId));
    } else {
      setCheckList([...checkList, groupId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const groupIdList = groupList.map((group) => group.team_group_id);
      setCheckList(groupIdList);
    } else {
      setCheckList([]);
    }
  };

  const handleSearch = async (isEmpty?: boolean) => {
    if (activePage !== 1) {
      setActivePage(1);
    }
    handleFetch(isEmpty ? "" : search, 1);
  };

  const handleDelete = async () => {
    const saveCheckList = checkList;
    const savedRecord = groupList;

    try {
      setCheckList([]);
      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "team_group",
        schema: "team_schema",
      });
      handleFetch("", 1);
      setSelectedGroup(null);

      notifications.show({
        message: "Group/s deleted.",
        color: "green",
      });
    } catch {
      setGroupList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleColumnClick = (group_id: string) => {
    if (selectedGroup?.team_group_id === group_id || isFetchingMembers) return;
    setIsFetchingMembers(true);
    const newSelectedGroup = groupList.find(
      (group) => group.team_group_id === group_id
    );

    setSelectedGroup(newSelectedGroup || null);
  };

  const columnData: DataTableColumn<TeamGroupTableRow>[] = [
    {
      accessor: "checkbox",
      title: (
        <Checkbox
          key={headerCheckboxKey}
          className={classes.checkbox}
          checked={
            checkList.length > 0 && checkList.length === groupList.length
          }
          size="xs"
          onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
        />
      ),
      render: ({ team_group_id }) => (
        <Checkbox
          className={classes.checkbox}
          size="xs"
          checked={checkList.includes(team_group_id)}
          onChange={() => {
            handleCheckRow(team_group_id);
          }}
        />
      ),
      width: 40,
    },
    {
      accessor: "group_general_name",
      title: "Group Name",
      render: ({ team_group_name, team_group_id }) => (
        <Text
          className={
            isFetchingMembers ? classes.disabledColumn : classes.clickableColumn
          }
          onClick={() => {
            handleColumnClick(team_group_id);
          }}
        >
          {team_group_name}
        </Text>
      ),
    },
  ];

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            Team Groups
          </Title>
          <TextInput
            miw={250}
            placeholder="Group Name"
            rightSection={
              <ActionIcon onClick={() => search && handleSearch()}>
                <IconSearch size={16} />
              </ActionIcon>
            }
            value={search}
            onChange={async (e) => {
              setSearch(e.target.value);
              if (e.target.value === "") {
                handleSearch(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (search) {
                  handleSearch();
                }
              }
            }}
            maxLength={4000}
            className={classes.flexGrow}
          />
        </Group>
        <Group className={classes.flexGrow}>
          {checkList.length !== 0 ? (
            <Button
              variant="outline"
              rightIcon={<IconTrash size={16} />}
              className={classes.flexGrow}
              onClick={() => {
                openConfirmModal({
                  title: <Text>Please confirm your action.</Text>,
                  children: (
                    <Text size={14}>
                      Are you sure you want to delete{" "}
                      {checkList.length === 1 ? "this group?" : "these groups?"}
                    </Text>
                  ),
                  labels: { confirm: "Confirm", cancel: "Cancel" },
                  centered: true,
                  onConfirm: handleDelete,
                });
              }}
            >
              Delete
            </Button>
          ) : null}
          {isOwnerOrAdmin && (
            <Button
              rightIcon={<IconPlus size={16} />}
              className={classes.flexGrow}
              onClick={() => setIsCreatingGroup(true)}
            >
              Add
            </Button>
          )}
        </Group>
      </Flex>
      <DataTable
        idAccessor="team_group_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={groupList}
        columns={columnData.slice(isOwnerOrAdmin ? 0 : 1)}
        totalRecords={groupCount}
        recordsPerPage={ROW_PER_PAGE}
        page={activePage}
        onPageChange={(page: number) => {
          setActivePage(page);
          handleFetch(search, page);
        }}
      />
    </Box>
  );
};

export default GroupList;
