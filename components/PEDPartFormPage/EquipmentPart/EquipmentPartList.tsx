import { deleteRow } from "@/backend/api/delete";
import { getEquipmentPartList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import { EquipmentPartType, EquipmentWithCategoryType } from "@/utils/types";
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
  selectedEquipment: EquipmentWithCategoryType;
  equipmentPartList: EquipmentPartType[];
  setEquipmentPartList: Dispatch<SetStateAction<EquipmentPartType[]>>;
  equipmentPartCount: number;
  setEquipmentPartCount: Dispatch<SetStateAction<number>>;
  setIsCreatingEquipmentPart: Dispatch<SetStateAction<boolean>>;
  setEditEquipmentPart: Dispatch<SetStateAction<EquipmentPartType | null>>;
  editEquipmentPart: EquipmentPartType | null;
};

const EquipmentPartList = ({
  selectedEquipment,
  equipmentPartList,
  setEquipmentPartList,
  equipmentPartCount,
  setEquipmentPartCount,
  setIsCreatingEquipmentPart,
  setEditEquipmentPart,
  editEquipmentPart,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const { classes } = useStyles();

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
      const { data, count } = await getEquipmentPartList(supabaseClient, {
        equipmentId: selectedEquipment.equipment_id,
        search,
        limit: ROW_PER_PAGE,
        page,
      });

      setEquipmentPartList(data);
      setEquipmentPartCount(Number(count));
    } catch {
      notifications.show({
        message: "Error on fetching equipment part list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRow = (equipmentPartId: string) => {
    if (checkList.includes(equipmentPartId)) {
      setCheckList(checkList.filter((id) => id !== equipmentPartId));
    } else {
      setCheckList([...checkList, equipmentPartId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const equipmentPartIdList = equipmentPartList.map(
        (equipmentPart) => equipmentPart.equipment_part_id
      );
      setCheckList(equipmentPartIdList);
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
    const savedRecord = equipmentPartList;

    try {
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "equipment_part",
        schema: "equipment_schema",
      });
      handleFetch("", 1);

      notifications.show({
        message: "Equipment Part/s deleted.",
        color: "green",
      });
    } catch (e) {
      setEquipmentPartList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (
    equipmentPartId: string,
    value: boolean
  ) => {
    const savedRecord = equipmentPartList;
    try {
      setEquipmentPartList((prev) =>
        prev.map((equipmentPart) => {
          if (equipmentPart.equipment_part_id !== equipmentPartId)
            return equipmentPart;
          return {
            ...equipmentPart,
            equipment_part_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "equipment_part",
        id: equipmentPartId,
        status: value,
        schema: "equipment_schema",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setEquipmentPartList(savedRecord);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of Part
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
        {!editEquipmentPart && (
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
                          ? "this equipment part?"
                          : "these equipment parts?"}
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
              onClick={() => setIsCreatingEquipmentPart(true)}
            >
              Add
            </Button>
          </Group>
        )}
      </Flex>
      <DataTable
        idAccessor="equipment_part_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={equipmentPartList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 &&
                  checkList.length === equipmentPartList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: ({ equipment_part_id }) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(equipment_part_id)}
                onChange={() => {
                  handleCheckRow(equipment_part_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: "equipment_part_general_name",
            title: "Name",
            render: ({ equipment_part_general_name }) => (
              <Text>{equipment_part_general_name}</Text>
            ),
          },
          {
            accessor: "equipment_part_number",
            title: "Part Number",
            render: ({ equipment_part_number }) => (
              <Text>{equipment_part_number}</Text>
            ),
          },
          {
            accessor: "equipment_part_brand",
            title: "Equipment Brand",
            render: ({ equipment_part_brand }) => (
              <Text>{equipment_part_brand}</Text>
            ),
          },
          {
            accessor: "equipment_part_model",
            title: "Equipment Model",
            render: ({ equipment_part_model }) => (
              <Text>{equipment_part_model}</Text>
            ),
          },
          {
            accessor: "equipment_part_unit_of_measurement",
            title: "UOM",
            render: ({ equipment_part_unit_of_measurement }) => (
              <Text>{equipment_part_unit_of_measurement}</Text>
            ),
          },
          {
            accessor: "equipment_part_component_category",
            title: "Category",
            render: ({ equipment_part_component_category }) => (
              <Text>{equipment_part_component_category}</Text>
            ),
          },
          {
            accessor: "status",
            title: "Status",
            textAlignment: "center",
            render: ({ equipment_part_is_available, equipment_part_id }) => (
              <Center>
                <Checkbox
                  checked={equipment_part_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(
                      equipment_part_id,
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
            render: (equipmentPart) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditEquipmentPart(equipmentPart);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={equipmentPartCount}
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

export default EquipmentPartList;
