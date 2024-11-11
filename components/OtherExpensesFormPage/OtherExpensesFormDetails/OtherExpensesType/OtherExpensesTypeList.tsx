import { deleteRow } from "@/backend/api/delete";
import { getTypeList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { OtherExpensesTypeWithCategoryType } from "@/utils/types";
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
  typeList: OtherExpensesTypeWithCategoryType[];
  setTypeList: Dispatch<SetStateAction<OtherExpensesTypeWithCategoryType[]>>;
  typeCount: number;
  setTypeCount: Dispatch<SetStateAction<number>>;
  setIsCreatingType: Dispatch<SetStateAction<boolean>>;
  setEditType: Dispatch<
    SetStateAction<OtherExpensesTypeWithCategoryType | null>
  >;
};

const OtherExpensesTypeList = ({
  typeList,
  setTypeList,
  typeCount,
  setTypeCount,
  setIsCreatingType,
  setEditType,
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
  }, [team.team_id]);

  const handleFetch = async (search: string, page: number) => {
    setIsLoading(true);
    try {
      if (!team.team_id) return;
      const { data, count } = await getTypeList(supabaseClient, {
        teamId: team.team_id,
        search,
        limit: ROW_PER_PAGE,
        page,
      });

      setTypeList(data as unknown as OtherExpensesTypeWithCategoryType[]);
      setTypeCount(Number(count));
    } catch (e) {
      notifications.show({
        message: `Error on fetching type list`,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRow = (typeId: string) => {
    if (checkList.includes(typeId)) {
      setCheckList(checkList.filter((id) => id !== typeId));
    } else {
      setCheckList([...checkList, typeId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const typeIdList = typeList.map((type) => type.other_expenses_type_id);
      setCheckList(typeIdList);
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
    const savedRecord = typeList;

    try {
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "other_expenses_type",
        schema: "other_expenses_schema",
      });
      handleFetch("", 1);

      notifications.show({
        message: `Type/s deleted.`,
        color: "green",
      });
    } catch (e) {
      setTypeList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (typeId: string, value: boolean) => {
    const savedRecord = typeList;
    try {
      setIsLoading(true);
      setTypeList((prev) =>
        prev.map((type) => {
          if (type.other_expenses_type_id !== typeId) return type;
          return {
            ...type,
            other_expenses_type_is_available: value,
          };
        })
      );

      await toggleStatus(supabaseClient, {
        table: "other_expenses_type",
        id: typeId,
        status: value,
        schema: "other_expenses_schema",
      });

      notifications.show({
        message: "Status Updated",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setTypeList(savedRecord);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of Types
          </Title>
          <TextInput
            miw={250}
            placeholder="Search"
            rightSection={
              <ActionIcon
                disabled={isLoading}
                onClick={() => search && handleSearch()}
              >
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
                      Are you sure you want to delete {`this type/s?`}
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
            onClick={() => setIsCreatingType(true)}
          >
            Add
          </Button>
        </Group>
      </Flex>
      <DataTable
        idAccessor="other_expenses_type_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={typeList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 && checkList.length === typeList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: (data) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(data.other_expenses_type_id)}
                onChange={() => {
                  handleCheckRow(data.other_expenses_type_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: `other_expenses_type_table`,
            title: `Type`,
            render: (data) => <Text>{data.other_expenses_type}</Text>,
          },
          {
            accessor: `other_expenses_category`,
            title: `Category`,
            render: (data) => <Text>{data.other_expenses_category}</Text>,
          },
          {
            accessor: "status",
            title: "Status",
            textAlignment: "center",
            render: (data) => (
              <Center>
                <Checkbox
                  checked={data.other_expenses_type_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(
                      data.other_expenses_type_id,
                      e.currentTarget.checked
                    )
                  }
                />
              </Center>
            ),
          },
          {
            accessor: "edit",
            title: "",
            textAlignment: "center",
            render: (type) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditType(type);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={typeCount}
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

export default OtherExpensesTypeList;
