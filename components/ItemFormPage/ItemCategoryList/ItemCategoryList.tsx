import { deleteRow } from "@/backend/api/delete";
import { getItemCategoryList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { getAvatarColor } from "@/utils/styling";
import { ItemCategoryWithSigner } from "@/utils/types";
import {
  ActionIcon,
  Avatar,
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
  formId: string;
  itemCategoryList: ItemCategoryWithSigner[];
  setItemCategoryList: Dispatch<SetStateAction<ItemCategoryWithSigner[]>>;
  itemCategoryCount: number;
  setItemCategoryCount: Dispatch<SetStateAction<number>>;
  setIsCreatingItemCategory: Dispatch<SetStateAction<boolean>>;
  setEditItemCategory: Dispatch<SetStateAction<ItemCategoryWithSigner | null>>;
};

const ItemCategoryList = ({
  formId,
  itemCategoryList,
  setItemCategoryList,
  itemCategoryCount,
  setItemCategoryCount,
  setIsCreatingItemCategory,
  setEditItemCategory,
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
      const { data, count } = await getItemCategoryList(supabaseClient, {
        formId,
        search,
        limit: ROW_PER_PAGE,
        page,
      });
      setItemCategoryList(data as unknown as ItemCategoryWithSigner[]);
      setItemCategoryCount(Number(count));
    } catch (e) {
      notifications.show({
        message: `Error on fetching item category list`,
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
      const itemCategoryIdList = itemCategoryList.map(
        (category) => category.item_category_id
      );
      setCheckList(itemCategoryIdList);
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
    const savedRecord = itemCategoryList;

    try {
      const updatedItemCategoryList = itemCategoryList.filter(
        (itemCategory) => {
          if (!checkList.includes(itemCategory.item_category_id)) {
            return itemCategory;
          }
        }
      );
      setItemCategoryList(updatedItemCategoryList);
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "item_category",
        schema: "item_schema",
      });

      notifications.show({
        message: `Item Category deleted.`,
        color: "green",
      });
    } catch {
      setItemCategoryList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (itemCategoryId: string, value: boolean) => {
    const savedRecord = itemCategoryList;
    try {
      setIsLoading(true);
      setItemCategoryList((prev) =>
        prev.map((itemCategory) => {
          if (itemCategory.item_category_id !== itemCategoryId)
            return itemCategory;
          return {
            ...itemCategory,
            item_category_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "item_category",
        id: itemCategoryId,
        status: value,
        schema: "item_schema",
      });
      notifications.show({
        message: "Status Updated",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setItemCategoryList(savedRecord);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of Item Category
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
                      Are you sure you want to delete this item category?
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
            onClick={() => setIsCreatingItemCategory(true)}
          >
            Add
          </Button>
        </Group>
      </Flex>
      <DataTable
        idAccessor="item_category_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={itemCategoryList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 &&
                  checkList.length === itemCategoryList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: (data) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(data.item_category_id)}
                onChange={() => {
                  handleCheckRow(data.item_category_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: "item_category",
            title: "Category",
            render: (data) => <Text>{data.item_category}</Text>,
          },
          {
            accessor: "item_category_signer",
            title: "Signer",
            render: (data) => {
              const firstName =
                data.item_category_signer.signer_team_member.team_member_user
                  .user_first_name;
              const lastName =
                data.item_category_signer.signer_team_member.team_member_user
                  .user_last_name;
              const userId =
                data.item_category_signer.signer_team_member.team_member_user
                  .user_id;

              return (
                <Flex gap="md" align="center" mt="xs">
                  <Avatar
                    size="sm"
                    src={
                      data.item_category_signer.signer_team_member
                        .team_member_user.user_avatar
                    }
                    color={getAvatarColor(Number(`${userId.charCodeAt(0)}`))}
                    radius="xl"
                  >
                    {`${firstName[0]}${lastName[0]}`}
                  </Avatar>

                  <Text>{`${firstName} ${lastName}`}</Text>
                </Flex>
              );
            },
          },
          {
            accessor: "item_category_is_available",
            title: "Status",
            textAlignment: "center",
            render: (data) => (
              <Center>
                <Checkbox
                  checked={data.item_category_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(
                      data.item_category_id,
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
            render: (category) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditItemCategory(category);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={itemCategoryCount}
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

export default ItemCategoryList;
