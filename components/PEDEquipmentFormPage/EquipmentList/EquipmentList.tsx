import { deleteRow } from "@/backend/api/delete";
import { getEquipmentList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { EquipmentWithCategoryType } from "@/utils/types";
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
  equipmentList: EquipmentWithCategoryType[];
  setEquipmentList: Dispatch<SetStateAction<EquipmentWithCategoryType[]>>;
  equipmentCount: number;
  setEquipmentCount: Dispatch<SetStateAction<number>>;
  setIsCreatingEquipment: Dispatch<SetStateAction<boolean>>;
  setEditEquipment: Dispatch<SetStateAction<EquipmentWithCategoryType | null>>;
  editEquipment: EquipmentWithCategoryType | null;
};

const EquipmentList = ({
  equipmentList,
  setEquipmentList,
  equipmentCount,
  setEquipmentCount,
  setIsCreatingEquipment,
  setEditEquipment,
  editEquipment,
}: Props) => {
  const { classes } = useStyles();

  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();

  const [isLoading, setIsLoading] = useState(true);

  const [activePage, setActivePage] = useState(1);
  const [checkList, setCheckList] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const headerCheckboxKey = generateRandomId();

  useEffect(() => {
    handleFetch("", 1);
  }, [activeTeam.team_id]);

  const handleCheckRow = (equipmentId: string) => {
    if (checkList.includes(equipmentId)) {
      setCheckList(checkList.filter((id) => id !== equipmentId));
    } else {
      setCheckList([...checkList, equipmentId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const equipmentIdList = equipmentList.map(
        (equipment) => equipment.equipment_id
      );
      setCheckList(equipmentIdList);
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
      if (!activeTeam.team_id) return;
      const { data, count } = await getEquipmentList(supabaseClient, {
        teamId: activeTeam.team_id,
        search,
        limit: ROW_PER_PAGE,
        page: page,
      });
      setEquipmentList(data as EquipmentWithCategoryType[]);
      setEquipmentCount(Number(count));
    } catch {
      notifications.show({
        message: "Error on fetching equipment list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const saveCheckList = checkList;
    const savedRecord = equipmentList;

    try {
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "equipment",
        schema: "equipment_schema",
      });
      handleFetch("", 1);
      notifications.show({
        message: "Equipment/s deleted.",
        color: "green",
      });
    } catch {
      setEquipmentList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (equipmentId: string, value: boolean) => {
    const savedRecord = equipmentList;
    try {
      setIsLoading(true);
      setEquipmentList((prev) =>
        prev.map((equipment) => {
          if (equipment.equipment_id !== equipmentId) return equipment;
          return {
            ...equipment,
            equipment_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "equipment",
        id: equipmentId,
        status: value,
        schema: "equipment_schema",
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
      setEquipmentList(savedRecord);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of Equipments
          </Title>
          <TextInput
            miw={250}
            placeholder="Name"
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
        {!editEquipment && (
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
                          ? "this equipment?"
                          : "these equipments?"}
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
              onClick={() => setIsCreatingEquipment(true)}
            >
              Add
            </Button>
          </Group>
        )}
      </Flex>
      <DataTable
        idAccessor="equipment_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={equipmentList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 &&
                  checkList.length === equipmentList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: ({ equipment_id }) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(equipment_id)}
                onChange={() => {
                  handleCheckRow(equipment_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: "equipment_name",
            title: "Name",
            render: ({ equipment_name }) => <Text>{equipment_name}</Text>,
          },
          {
            accessor: "equipment_category",
            title: "Category",
            render: ({ equipment_category }) => (
              <Text>{equipment_category}</Text>
            ),
          },
          {
            accessor: "equipment_name_shorthand",
            title: "Shorthand",
            render: ({ equipment_name_shorthand }) => (
              <Text>{equipment_name_shorthand}</Text>
            ),
          },
          {
            accessor: "status",
            title: "Status",
            textAlignment: "center",
            render: ({ equipment_is_available, equipment_id }) => (
              <Center>
                <Checkbox
                  checked={equipment_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(equipment_id, e.currentTarget.checked)
                  }
                />
              </Center>
            ),
          },
          {
            accessor: "edit",
            title: "",
            textAlignment: "center",
            render: (equipment) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditEquipment(equipment);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={equipmentCount}
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

export default EquipmentList;
