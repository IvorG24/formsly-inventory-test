import { deleteRow } from "@/backend/api/delete";
import { getItemDescriptionFieldList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import {
  ItemDescriptionFieldTableRow,
  ItemDescriptionTableRow,
} from "@/utils/types";
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
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
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
  description: ItemDescriptionTableRow;
  records: ItemDescriptionFieldTableRow[];
  setRecords: Dispatch<SetStateAction<ItemDescriptionFieldTableRow[]>>;
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  setIsCreating: Dispatch<SetStateAction<boolean>>;
};

const ItemDescriptionFieldTable = ({
  description,
  records,
  setRecords,
  count,
  setCount,
  setIsCreating,
}: Props) => {
  const { classes } = useStyles();
  const supabaseClient = useSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);

  const [activePage, setActivePage] = useState(1);
  const [checkList, setCheckList] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const headerCheckboxKey = generateRandomId();

  useEffect(() => {
    handleFetch("", 1);
  }, [description]);

  const handleCheckRow = (descriptionId: string) => {
    if (checkList.includes(descriptionId)) {
      setCheckList(checkList.filter((id) => id !== descriptionId));
    } else {
      setCheckList([...checkList, descriptionId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const fieldList = records.map((field) => field.item_description_field_id);
      setCheckList(fieldList);
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

  const handleFetch = async (search: string, page: number) => {
    setIsLoading(true);
    try {
      const { data, count } = await getItemDescriptionFieldList(
        supabaseClient,
        {
          descriptionId: description.item_description_id,
          search: search,
          page: page,
          limit: ROW_PER_PAGE,
        }
      );
      setRecords(data);
      setCount(Number(count));
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const saveCheckList = checkList;
    const savedRecord = records;

    try {
      const updatedFieldList = records.filter((field) => {
        if (!checkList.includes(field.item_description_field_id)) {
          return field;
        }
      });
      setRecords(updatedFieldList);
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "item_description_field",
        schema: "item_schema",
      });

      notifications.show({
        message: "Field/s deleted.",
        color: "green",
      });
    } catch {
      setRecords(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (fieldId: string, value: boolean) => {
    const savedRecords = records;

    try {
      setRecords((prev) =>
        prev.map((field) => {
          if (field.item_description_field_id !== fieldId) return field;
          return {
            ...field,
            item_description_field_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "item_description_field",
        id: fieldId,
        status: value,
        schema: "item_schema",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setRecords(savedRecords);
    }
  };

  return (
    <Box mt="xl">
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of {description.item_description_label}
          </Title>
          <TextInput
            miw={250}
            placeholder="Value"
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
                      {checkList.length === 1
                        ? "this description?"
                        : "these descriptions?"}
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
            onClick={() => setIsCreating(true)}
          >
            Add
          </Button>
        </Group>
      </Flex>
      <DataTable
        idAccessor="item_description_field_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={records}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 && checkList.length === records.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: ({ item_description_field_id }) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(item_description_field_id)}
                onChange={() => {
                  handleCheckRow(item_description_field_id);
                }}
              />
            ),
            width: 40,
          },
          { accessor: "item_description_field_value", title: "Value" },
          ...(description.item_description_is_with_uom
            ? [
                {
                  accessor:
                    "item_description_field_uom.[0].item_description_field_uom",
                  title: "Base Unit of Measurement",
                },
              ]
            : []),
          {
            accessor: "item_description_field_is_available",
            title: "Status",
            textAlignment: "center",
            render: ({
              item_description_field_is_available,
              item_description_field_id,
            }) => {
              return (
                <Center>
                  <Checkbox
                    checked={item_description_field_is_available}
                    className={classes.checkbox}
                    size="xs"
                    onChange={(e) =>
                      handleUpdateStatus(
                        item_description_field_id,
                        e.currentTarget.checked
                      )
                    }
                  />
                </Center>
              );
            },
          },
        ]}
        totalRecords={count}
        recordsPerPage={ROW_PER_PAGE}
        page={activePage}
        onPageChange={(page) => {
          setActivePage(page);
          handleFetch(search, page);
        }}
      />
    </Box>
  );
};

export default ItemDescriptionFieldTable;
