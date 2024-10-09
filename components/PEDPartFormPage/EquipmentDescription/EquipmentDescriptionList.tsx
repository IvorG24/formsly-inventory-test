import { deleteRow } from "@/backend/api/delete";
import { getEquipmentDescriptionList } from "@/backend/api/get";
import { toggleStatus } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { generateRandomId } from "@/utils/functions";
import {
  EquipmentDescriptionType,
  EquipmentWithCategoryType,
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
  equipmentDescriptionList: EquipmentDescriptionType[];
  setEquipmentDescriptionList: Dispatch<
    SetStateAction<EquipmentDescriptionType[]>
  >;
  equipmentDescriptionCount: number;
  setEquipmentDescriptionCount: Dispatch<SetStateAction<number>>;
  setIsCreatingEquipmentDescription: Dispatch<SetStateAction<boolean>>;
  setEditEquipmentDescription: Dispatch<
    SetStateAction<EquipmentDescriptionType | null>
  >;
  editEquipmentDescription: EquipmentDescriptionType | null;
};

const EquipmentDescriptionList = ({
  selectedEquipment,
  equipmentDescriptionList,
  setEquipmentDescriptionList,
  equipmentDescriptionCount,
  setEquipmentDescriptionCount,
  setIsCreatingEquipmentDescription,
  setEditEquipmentDescription,
  editEquipmentDescription,
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
      const { data, count } = await getEquipmentDescriptionList(
        supabaseClient,
        {
          equipmentId: selectedEquipment.equipment_id,
          search,
          limit: ROW_PER_PAGE,
          page,
        }
      );
      setEquipmentDescriptionList(
        data as unknown as EquipmentDescriptionType[]
      );
      setEquipmentDescriptionCount(Number(count));
    } catch (e) {
      notifications.show({
        message: "Error on fetching equipment description list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRow = (equipmentDescriptionId: string) => {
    if (checkList.includes(equipmentDescriptionId)) {
      setCheckList(checkList.filter((id) => id !== equipmentDescriptionId));
    } else {
      setCheckList([...checkList, equipmentDescriptionId]);
    }
  };

  const handleCheckAllRows = (checkAll: boolean) => {
    if (checkAll) {
      const equipmentDescriptionIdList = equipmentDescriptionList.map(
        (equipmentDescription) => equipmentDescription.equipment_description_id
      );
      setCheckList(equipmentDescriptionIdList);
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
    const savedRecord = equipmentDescriptionList;

    try {
      setCheckList([]);

      await deleteRow(supabaseClient, {
        rowId: checkList,
        table: "equipment_description",
        schema: "equipment_schema",
      });
      handleFetch("", 1);

      notifications.show({
        message: "Equipment Description/s deleted.",
        color: "green",
      });
    } catch (e) {
      setEquipmentDescriptionList(savedRecord);
      setCheckList(saveCheckList);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (
    equipmentDescriptionId: string,
    value: boolean
  ) => {
    const savedRecord = equipmentDescriptionList;
    try {
      setEquipmentDescriptionList((prev) =>
        prev.map((equipmentDescription) => {
          if (
            equipmentDescription.equipment_description_id !==
            equipmentDescriptionId
          )
            return equipmentDescription;
          return {
            ...equipmentDescription,
            equipment_description_is_available: value,
          };
        })
      );
      await toggleStatus(supabaseClient, {
        table: "equipment_description",
        id: equipmentDescriptionId,
        status: value,
        schema: "equipment_schema",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setEquipmentDescriptionList(savedRecord);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            List of Description
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
        {!editEquipmentDescription && (
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
                          ? "this equipment description?"
                          : "these equipment descriptions?"}
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
              onClick={() => setIsCreatingEquipmentDescription(true)}
            >
              Add
            </Button>
          </Group>
        )}
      </Flex>
      <DataTable
        idAccessor="equipment_description_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={equipmentDescriptionList}
        columns={[
          {
            accessor: "checkbox",
            title: (
              <Checkbox
                key={headerCheckboxKey}
                className={classes.checkbox}
                checked={
                  checkList.length > 0 &&
                  checkList.length === equipmentDescriptionList.length
                }
                size="xs"
                onChange={(e) => handleCheckAllRows(e.currentTarget.checked)}
              />
            ),
            render: ({ equipment_description_id }) => (
              <Checkbox
                className={classes.checkbox}
                size="xs"
                checked={checkList.includes(equipment_description_id)}
                onChange={() => {
                  handleCheckRow(equipment_description_id);
                }}
              />
            ),
            width: 40,
          },
          {
            accessor: "equipment_description_property_number_with_prefix",
            title: "Property Number",
            render: ({ equipment_description_property_number_with_prefix }) => (
              <Text>{equipment_description_property_number_with_prefix}</Text>
            ),
          },
          {
            accessor: "equipment_description_brand",
            title: "Brand",
            render: ({ equipment_description_brand }) => (
              <Text>{equipment_description_brand}</Text>
            ),
          },
          {
            accessor: "equipment_description_model",
            title: "Model",
            render: ({ equipment_description_model }) => (
              <Text>{equipment_description_model}</Text>
            ),
          },
          {
            accessor: "equipment_description_serial_number",
            title: "Serial Number",
            render: ({ equipment_description_serial_number }) => (
              <Text>{equipment_description_serial_number}</Text>
            ),
          },
          {
            accessor: "equipment_description_acquisition_date",
            title: "Acquisition Date",
            render: ({ equipment_description_acquisition_date }) => (
              <Text>{equipment_description_acquisition_date}</Text>
            ),
          },
          {
            accessor: "status",
            title: "Status",
            textAlignment: "center",
            render: ({
              equipment_description_is_available,
              equipment_description_id,
            }) => (
              <Center>
                <Checkbox
                  checked={equipment_description_is_available}
                  className={classes.checkbox}
                  size="xs"
                  onChange={(e) =>
                    handleUpdateStatus(
                      equipment_description_id,
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
            render: (equipmentDescription) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setEditEquipmentDescription(equipmentDescription);
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={equipmentDescriptionCount}
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

export default EquipmentDescriptionList;
