import { deleteRow } from "@/backend/api/delete";
import {
  getItemDivisionOption,
  getItemList,
  getItemUnitOfMeasurementOption,
} from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { GL_ACCOUNT_CHOICES, ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  ItemDescriptionTableRow,
  ItemWithDescriptionType,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Group,
  Menu,
  Select,
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
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

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
}));

type FilterType = {
  generalName: string;
  unitOfMeasurement: string;
  description: string;
  glAccount: string;
  division: string;
  status: string;
};

export type ItemOrderType =
  | "item_general_name"
  | "item_unit"
  | "item_is_available"
  | "item_gl_account";

type Props = {
  itemList: ItemWithDescriptionType[];
  setItemList: Dispatch<SetStateAction<ItemWithDescriptionType[]>>;
  itemCount: number;
  setItemCount: Dispatch<SetStateAction<number>>;
  setIsCreatingItem: Dispatch<SetStateAction<boolean>>;
  setSelectedItem: Dispatch<SetStateAction<ItemWithDescriptionType | null>>;
  setEditItem: Dispatch<SetStateAction<ItemWithDescriptionType | null>>;
  editItem: ItemWithDescriptionType | null;
};

const ItemList = ({
  itemList,
  setItemList,
  itemCount,
  setItemCount,
  setIsCreatingItem,
  setSelectedItem,
  setEditItem,
  editItem,
}: Props) => {
  const { classes } = useStyles();

  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  const [activePage, setActivePage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "item_general_name",
    direction: "asc",
  });
  const [checkList, setCheckList] = useState<string[]>([]);
  const [formFilterValues, setFormFilterValues] = useState<FilterType>({
    generalName: "",
    description: "",
    unitOfMeasurement: "",
    glAccount: "",
    division: "",
    status: "",
  });

  const [divisionIdOptions, setDivisionIdOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [unitOfMeasurementOptions, setUnitOfMeasurementOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [pageOptions, setPageOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const headerCheckboxKey = generateRandomId();
  const requestFormMethods = useForm<FilterType>();
  const { handleSubmit, control, register, getValues } = requestFormMethods;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        const divisionOption = await getItemDivisionOption(supabaseClient);
        divisionOption &&
          setDivisionIdOptions(
            divisionOption.map((divisionId) => {
              return {
                label: `${divisionId.csi_code_division_id}`,
                value: `${divisionId.csi_code_division_id}`,
              };
            })
          );

        const unitOfMeasurementOptions = await getItemUnitOfMeasurementOption(
          supabaseClient,
          { teamId: activeTeam.team_id }
        );
        unitOfMeasurementOptions &&
          setUnitOfMeasurementOptions(
            unitOfMeasurementOptions.map((uom) => {
              return {
                label: `${uom.item_unit_of_measurement}`,
                value: `${uom.item_unit_of_measurement}`,
              };
            })
          );
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (activeTeam.team_id) {
      fetchOptions();
    }
  }, [activeTeam]);

  useEffect(() => {
    if (activeTeam.team_id) {
      handleSort();
    }
  }, [sortStatus]);

  useEffect(() => {
    const resultArray: { label: string; value: string }[] = [];
    for (let i = 1; i <= Math.ceil(itemCount / ROW_PER_PAGE); i++) {
      resultArray.push({
        label: `${i}`,
        value: `${i}`,
      });
    }
    setPageOptions(resultArray);
  }, [itemCount]);

  useEffect(() => {
    handleFilterForms();
  }, [activeTeam.team_id]);

  const handleCheckRow = (itemId: string) => {
    if (checkList.includes(itemId)) {
      setCheckList(checkList.filter((id) => id !== itemId));
    } else {
      setCheckList([...checkList, itemId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const itemIdList = itemList.map((item) => item.item_id);
      setCheckList(itemIdList);
    } else {
      setCheckList([]);
    }
  };

  const handleDelete = async () => {
    const saveCheckList = checkList;
    const savedRecord = itemList;

    try {
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "item",
        schema: "item_schema",
      });

      setSelectedItem(null);
      handleFilterForms();
      notifications.show({
        message: "Item/s deleted.",
        color: "green",
      });
    } catch {
      setItemList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (itemId: string, value: boolean) => {
    const savedRecord = itemList;
    try {
      setItemList((prev) =>
        prev.map((item) => {
          if (item.item_id !== itemId) return item;
          return {
            ...item,
            item_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "item",
        id: itemId,
        status: value,
        schema: "item_schema",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setItemList(savedRecord);
    }
  };

  const formatItemField = (itemFieldLabel: ItemDescriptionTableRow[]) => {
    let description = "";
    itemFieldLabel.forEach((fieldLabel) => {
      description += `${fieldLabel.item_description_label}, `;
    });
    return description.slice(0, -2);
  };

  const handleColumnClick = (item_id: string) => {
    const selectedItem = itemList.find((item) => item.item_id === item_id);
    setSelectedItem(selectedItem || null);
  };

  const handleFilterForms = async (
    {
      generalName,
      description,
      unitOfMeasurement,
      glAccount,
      division,
      status,
    }: FilterType = getValues()
  ) => {
    if (!activeTeam.team_id) return;
    try {
      setIsLoading(true);

      const { data, count } = await getItemList(supabaseClient, {
        teamId: activeTeam.team_id,
        limit: ROW_PER_PAGE,
        page: 1,
        generalName,
        description,
        unitOfMeasurement,
        glAccount,
        division,
        status,
        isITAsset: true,
      });
      setItemList(data as ItemWithDescriptionType[]);
      setItemCount(Number(count));
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (
    page: number,
    {
      generalName,
      description,
      unitOfMeasurement,
      glAccount,
      division,
      status,
    }: FilterType = getValues()
  ) => {
    try {
      setIsLoading(true);

      const { data, count } = await getItemList(supabaseClient, {
        teamId: activeTeam.team_id,
        limit: ROW_PER_PAGE,
        page: page,
        generalName,
        description,
        unitOfMeasurement,
        glAccount,
        division,
        status,
        isITAsset: true,
      });
      setItemList(data as ItemWithDescriptionType[]);
      setItemCount(Number(count));
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (key: keyof FilterType, value: string) => {
    setActivePage(1);
    const filterMatch = formFilterValues[`${key}`];
    if (value !== filterMatch) {
      await handleFilterForms();
    }
    setFormFilterValues((prev) => ({ ...prev, [`${key}`]: value }));
  };

  const handleSort = async (
    {
      generalName,
      description,
      unitOfMeasurement,
      glAccount,
      division,
      status,
    }: FilterType = getValues()
  ) => {
    try {
      setIsLoading(true);

      const { data, count } = await getItemList(supabaseClient, {
        teamId: activeTeam.team_id,
        limit: ROW_PER_PAGE,
        page: activePage,
        generalName,
        description,
        unitOfMeasurement,
        glAccount,
        division,
        status,
        sortColumn: sortStatus.columnAccessor as ItemOrderType,
        sortOrder: sortStatus.direction,
        isITAsset: true,
      });
      setItemList(data as ItemWithDescriptionType[]);
      setItemCount(Number(count));
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of IT Assets
          </Title>
        </Group>

        {!editItem && (
          <Group className={classes.flexGrow}>
            <Menu shadow="xl" width={200} withArrow>
              <Menu.Target>
                <Button variant="light">Analytics</Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Analytics</Menu.Label>

                <Menu.Item
                  onClick={async () =>
                    await router.push(
                      `/${formatTeamNameToUrlKey(
                        activeTeam.team_name
                      )}/item-analytics`
                    )
                  }
                >
                  Item
                </Menu.Item>
                <Menu.Item
                  onClick={async () =>
                    await router.push(
                      `/${formatTeamNameToUrlKey(
                        activeTeam.team_name
                      )}/user-item-analytics`
                    )
                  }
                >
                  User Issued Items
                </Menu.Item>
                <Menu.Item
                  onClick={async () =>
                    await router.push(
                      `/${formatTeamNameToUrlKey(
                        activeTeam.team_name
                      )}/common-queries`
                    )
                  }
                >
                  Common Queries
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
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
                        {checkList.length === 1 ? "this item?" : "these items?"}
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
              onClick={() => setIsCreatingItem(true)}
            >
              Add
            </Button>
          </Group>
        )}
      </Flex>
      <form onSubmit={handleSubmit(handleFilterForms)}>
        <Group mt="xs" spacing="xs">
          <TextInput
            {...register("generalName")}
            placeholder="General Name"
            rightSection={
              <ActionIcon type="submit">
                <IconSearch size={16} />
              </ActionIcon>
            }
            maxLength={4000}
            className={classes.flexGrow}
          />
          <TextInput
            {...register("description")}
            placeholder="Description"
            rightSection={
              <ActionIcon type="submit">
                <IconSearch size={16} />
              </ActionIcon>
            }
            maxLength={4000}
            className={classes.flexGrow}
          />
          <Controller
            control={control}
            name="unitOfMeasurement"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Select
                value={value as string}
                onChange={(value: string) => {
                  onChange(value);
                  handleFilterChange("unitOfMeasurement", value);
                }}
                placeholder="Unit of Measurement"
                data={unitOfMeasurementOptions}
                clearable
                error={error?.message}
                className={classes.flexGrow}
                searchable
              />
            )}
          />
          <Controller
            control={control}
            name="glAccount"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Select
                value={value as string}
                onChange={(value: string) => {
                  onChange(value);
                  handleFilterChange("glAccount", value);
                }}
                placeholder="GL Account"
                data={GL_ACCOUNT_CHOICES.map((glAccount) => {
                  return {
                    value: glAccount,
                    label: glAccount,
                  };
                })}
                clearable
                error={error?.message}
                className={classes.flexGrow}
                searchable
              />
            )}
          />
          <Controller
            control={control}
            name="division"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Select
                value={value as string}
                onChange={(value: string) => {
                  onChange(value);
                  handleFilterChange("division", value);
                }}
                placeholder="Division"
                data={divisionIdOptions}
                clearable
                error={error?.message}
                className={classes.flexGrow}
                searchable
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Select
                value={value as string}
                onChange={(value: string) => {
                  onChange(value);
                  handleFilterChange("status", value);
                }}
                placeholder="Status"
                data={[
                  {
                    label: "Active",
                    value: "active",
                  },
                  {
                    label: "Inactive",
                    value: "inactive",
                  },
                ]}
                clearable
                error={error?.message}
                className={classes.flexGrow}
              />
            )}
          />

          <Select
            value={`${activePage}`}
            onChange={(value: string) => {
              setActivePage(Number(value));
              handlePagination(Number(value));
            }}
            placeholder="Page"
            data={pageOptions}
            className={classes.flexGrow}
            searchable
          />
        </Group>
      </form>

      <DataTable
        idAccessor="item_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={itemList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 && checkList.length === itemList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: ({ item_id }) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(item_id)}
                onChange={() => {
                  handleCheckRow(item_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: "item_general_name",
            title: "General Name",
            render: ({ item_general_name, item_id }) => (
              <Text
                className={classes.clickableColumn}
                onClick={() => {
                  handleColumnClick(item_id);
                }}
              >
                {item_general_name}
              </Text>
            ),
            sortable: true,
          },
          {
            accessor: "item_unit",
            title: "UoM",
            render: ({ item_unit, item_id }) => (
              <Text
                className={classes.clickableColumn}
                onClick={() => {
                  handleColumnClick(item_id);
                }}
              >
                {item_unit}
              </Text>
            ),
            sortable: true,
          },
          {
            accessor: "description",
            title: "Description",
            render: ({ item_id, item_description }) => (
              <Text
                className={classes.clickableColumn}
                onClick={() => {
                  handleColumnClick(item_id);
                }}
              >
                {formatItemField(item_description)}
              </Text>
            ),
          },
          {
            accessor: "item_gl_account",
            title: "GL Account",
            render: ({ item_gl_account, item_id }) => (
              <Text
                className={classes.clickableColumn}
                onClick={() => {
                  handleColumnClick(item_id);
                }}
              >
                {item_gl_account}
              </Text>
            ),
            sortable: true,
          },
          {
            accessor: "item_division_id_list",
            title: "Division",
            render: ({
              item_division_id_list,
              item_id,
              item_level_three_description,
            }) => (
              <Text
                className={classes.clickableColumn}
                onClick={() => {
                  handleColumnClick(item_id);
                }}
              >
                {item_level_three_description
                  ? item_level_three_description
                  : item_division_id_list.join(", ")}
              </Text>
            ),
          },
          {
            accessor: "item_is_available",
            title: "Status",
            textAlignment: "center",
            render: ({ item_is_available, item_id }) => (
              <Center>
                <Checkbox
                  checked={item_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(item_id, e.currentTarget.checked)
                  }
                />
              </Center>
            ),
            sortable: true,
          },
          {
            accessor: "edit",
            title: "",
            textAlignment: "center",
            render: (item) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditItem(item);
                    setSelectedItem(null);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={itemCount}
        recordsPerPage={ROW_PER_PAGE}
        page={activePage}
        onPageChange={(page: number) => {
          setActivePage(page);
          handlePagination(page);
        }}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
      />
    </Box>
  );
};

export default ItemList;
