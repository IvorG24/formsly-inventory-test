import { deleteRow } from "@/backend/api/delete";
import { getLookupList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { LookupTable } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Center,
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
import {
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const useStyles = createStyles((theme) => ({
  checkbox: {
    input: { cursor: "pointer" },
  },
  flexGrow: {
    [theme.fn.smallerThan("lg")]: {
      flexGrow: 1,
    },
  },
}));

type Props = {
  lookup: {
    table: string;
    label: string;
    schema: string;
  };
  categoryLookupList: LookupTable[];
  setCategoryLookupList: Dispatch<SetStateAction<LookupTable[]>>;
  categoryLookupCount: number;
  setCategoryLookupCount: Dispatch<SetStateAction<number>>;
  setIsCreatingCategoryLookup: Dispatch<SetStateAction<boolean>>;
  setEditCategoryLookup: Dispatch<SetStateAction<LookupTable | null>>;
};

const CategoryLookupList = ({
  lookup,
  categoryLookupList,
  setCategoryLookupList,
  categoryLookupCount,
  setCategoryLookupCount,
  setIsCreatingCategoryLookup,
  setEditCategoryLookup,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const { classes } = useStyles();

  const team = useActiveTeam();

  const [activePage, setActivePage] = useState(1);
  const [checkList, setCheckList] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const headerCheckboxKey = generateRandomId();

  useEffect(() => {
    handleFetch("", 1);
  }, []);

  const handleFetch = async (search: string, page: number) => {
    setIsLoading(true);
    try {
      if (!team.team_id) return;
      const { data, count } = await getLookupList(supabaseClient, {
        lookup: lookup.table,
        teamId: team.team_id,
        search,
        limit: ROW_PER_PAGE,
        page,
        schema: lookup.schema,
      });
      setCategoryLookupList(data);
      setCategoryLookupCount(Number(count));
    } catch (e) {
      notifications.show({
        message: `Error on fetching ${lookup.label} list`,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRow = (categoryLookupId: string) => {
    if (checkList.includes(categoryLookupId)) {
      setCheckList(checkList.filter((id) => id !== categoryLookupId));
    } else {
      setCheckList([...checkList, categoryLookupId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const categoryLookupIdList = categoryLookupList.map(
        (categoryLookup) => categoryLookup.id
      );
      setCheckList(categoryLookupIdList);
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
    const savedRecord = categoryLookupList;

    try {
      setCheckList([]);
      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: lookup.table,
        schema: lookup.schema,
      });
      handleFetch("", 1);

      notifications.show({
        message: `${lookup.label}/s deleted.`,
        color: "green",
      });
    } catch {
      setCategoryLookupList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (
    categoryLookupId: string,
    value: boolean
  ) => {
    const savedRecord = categoryLookupList;
    try {
      setCategoryLookupList((prev) =>
        prev.map((categoryLookup) => {
          if (categoryLookup.id !== categoryLookupId) return categoryLookup;
          return {
            ...categoryLookup,
            status: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: lookup.table,
        id: categoryLookupId,
        status: value,
        schema: lookup.schema,
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setCategoryLookupList(savedRecord);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of {lookup.label}
          </Title>
          <TextInput
            miw={250}
            placeholder="Search"
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
                      {`this category ${lookup.label}/s?`}
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
          <Button
            rightIcon={<IconPlus size={16} />}
            className={classes.flexGrow}
            onClick={() => setIsCreatingCategoryLookup(true)}
          >
            Add
          </Button>
        </Group>
      </Flex>
      <DataTable
        idAccessor="id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={categoryLookupList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 &&
                  checkList.length === categoryLookupList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: (data) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(data.id)}
                onChange={() => {
                  handleCheckRow(data.id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: `${lookup.table}`,
            title: `${lookup.label}`,
            render: (data) => <Text>{data.value}</Text>,
          },
          {
            accessor: "status",
            title: "Status",
            textAlignment: "center",
            render: (data) => (
              <Center>
                <Checkbox
                  checked={data.status}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(data.id, e.currentTarget.checked)
                  }
                />
              </Center>
            ),
          },
          {
            accessor: "edit",
            title: "",
            textAlignment: "center",
            render: (category) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditCategoryLookup(category);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={categoryLookupCount}
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

export default CategoryLookupList;
