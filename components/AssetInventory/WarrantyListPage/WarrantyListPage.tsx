import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";

import { getInventoryWarranty } from "@/backend/api/get";
import { createInventoryWarranty } from "@/backend/api/post";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  Column,
  InventoryWarrantyList,
  SecurityGroupData,
} from "@/utils/types";
import {
  Anchor,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FormModal, { InventoryFormValues } from "../FormModal";
import WarrantyListFilter from "./WarrantyListFilter";
import WarrantyListTable from "./WarrantyListTable";

type Props = {
  securityGroupData: SecurityGroupData;
};

type FilterSelectedValuesType = {
  status: string[];
  search: string;
  date: Date | undefined;
  isAscendingSort: boolean;
};

const WarrantyListPage = ({ securityGroupData }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const userProfile = useUserProfile();
  const teamMember = useUserTeamMember();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [warrantyList, setWarrantyList] = useState<InventoryWarrantyList[]>([]);
  const [warrantyCount, setWarrantyCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localFilter, setLocalFilter] =
    useLocalStorage<FilterSelectedValuesType>({
      key: "warranty-list-filter",
      defaultValue: {
        status: [],
        search: "",
        isAscendingSort: false,
        date: undefined,
      },
    });
  const [selectedWarranty, setSelectedWarranty] =
    useState<InventoryWarrantyList | null>(null);
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue } = filterFormMethods;

  const columnDefaultValue = columns.map((col) => ({
    value: col.accessor,
    label: col.title,
  }));

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_warranty_date_created",
    direction: "desc",
  });

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "inventory-list-warranty-table-column-filter",
    defaultValue: columnDefaultValue.map((col) => col.value),
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);

    return isHidden;
  };

  const handleOnSubmit = async (data: InventoryFormValues) => {
    try {
      await createInventoryWarranty(supabaseClient, {
        warrantyData: data,
        tagId: selectedWarranty?.inventory_request_tag_id ?? "",
        teamMemberId: teamMember?.team_member_id ?? "",
        selectedRow: selectedWarranty?.inventory_warranty_id,
      });
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
      close();
      handleFetchWarrantyList(activePage);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFetchWarrantyList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const { status, search, isAscendingSort, date } = getValues();

      const updatedDate =
        date instanceof Date && !isNaN(date.getTime())
          ? (() => {
              const newDate = new Date(date);
              newDate.setDate(newDate.getDate() + 1);
              newDate.setHours(0, 0, 0, 0);
              return newDate.toISOString().split("T")[0];
            })()
          : "";

      const { data, totalCount } = await getInventoryWarranty(supabaseClient, {
        page,
        teamId: activeTeam.team_id,
        limit: ROW_PER_PAGE,
        status: status,
        date: updatedDate ? updatedDate : "",
        isAscendingSort,
        search: search,
        columnAccessor: sortStatus.columnAccessor,
      });

      if (data.length > 0) {
        const tagId = "inventory_request_tag_id";
        const name = "inventory_request_name";
        const active = "inventory_warranty_status";

        const generatedColumns = [
          {
            accessor: active,
            title: "Active",
            sortable: true,
            hidden: checkIfColumnIsHidden(tagId),
            render: (record: Record<string, unknown>) => {
              const isActive = record[active] === "ACTIVE";
              return (
                <Group position="center">
                  {isActive ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconX size={16} color="red" />
                  )}
                </Group>
              );
            },
          },
          {
            accessor: tagId,
            title: "Tag ID",
            sortable: true,
            hidden: checkIfColumnIsHidden(tagId),
            render: (record: Record<string, unknown>) => (
              <Text>
                <Anchor
                  href={`/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/inventory/${record[tagId]}`}
                  target="_blank"
                >
                  {String(record[tagId])}
                </Anchor>
              </Text>
            ),
          },
          {
            accessor: name,
            title: "Name",
            sortable: true,
            width: 180,
            hidden: checkIfColumnIsHidden(name),
            render: (record: Record<string, unknown>) => (
              <Text>
                <Anchor
                  href={`/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/inventory/${record[tagId]}`}
                  target="_blank"
                >
                  {String(record[name])}
                </Anchor>
              </Text>
            ),
          },
          ...Object.keys(data[0] ?? {})
            .filter(
              (key) =>
                key !== "inventory_warranty_id" &&
                key !== "inventory_warranty_request_id" &&
                key !== tagId &&
                key !== name &&
                key !== active
            )
            .map((key) => ({
              accessor: key,
              title: key
                .replace(/_/g, " ")
                .replace("inventory", "")
                .replace("request", "")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
              sortable: key.includes("warranty"),
              hidden: checkIfColumnIsHidden(key),
              render: (record: Record<string, unknown>) => {
                const value = record[key];

                if (key.includes("date")) {
                  const isDate =
                    typeof value === "string" && !isNaN(Date.parse(value));
                  if (isDate) {
                    return (
                      <Text size="sm">
                        {formatDate(new Date(value as string))}
                      </Text>
                    );
                  }
                }
                if (key.includes("length") && typeof value === "number") {
                  return (
                    <Text size="sm">
                      {value} {value === 1 ? "month" : "months"}
                    </Text>
                  );
                }

                if (typeof value === "number") {
                  return (
                    <Text size="sm">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(value as number)}
                    </Text>
                  );
                }

                return <Text>{String(value)}</Text>;
              },
            })),
          {
            accessor: "actions",
            title: "Actions",
            sortable: false,
            render: (record: Record<string, unknown>) => {
              const inventoryRecord = record as InventoryWarrantyList;
              return (
                <Button
                  onClick={() => handleEdit(inventoryRecord)}
                  color="blue"
                  variant="outline"
                  size="sm"
                  rightIcon={<IconEdit size={16} />}
                >
                  Edit
                </Button>
              );
            },
          },
        ];

        setColumns(generatedColumns);
      }
      setWarrantyList(data);
      setWarrantyCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch request list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchWarrantyList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchWarrantyList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleEdit = (warranty: InventoryWarrantyList) => {
    setSelectedWarranty(null);
    setSelectedWarranty(warranty);
    open();
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam, activePage]);

  return (
    <Container maw={3840} h="100%">
      <FormModal
        isOpen={opened}
        onClose={close}
        formId="dd3d9787-ba92-4ef7-bc9f-8c6f374cd477"
        userId={userProfile?.user_id ?? ""}
        selectedRow={selectedWarranty}
        onSubmit={handleOnSubmit}
        mode={"edit"}
      />
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Warranty List Page</Title>
          <Text>Manage your asset warranty here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <WarrantyListFilter
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              securityGroupData={securityGroupData}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <WarrantyListTable
            isFetching={isFetchingRequestList}
            setSelectedRow={setSelectedRows}
            selectedRow={selectedRows}
            warrantyList={warrantyList}
            warrantyListCount={warrantyCount}
            activePage={activePage}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
            columns={columns}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={columnDefaultValue}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default WarrantyListPage;
