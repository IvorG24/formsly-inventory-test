import { getInventoryWarranty } from "@/backend/api/get";
import { createInventoryWarranty } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryWarrantyList } from "@/utils/types";
import { Button, Flex, Group, Stack, Text } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconCheck, IconEdit, IconPlus, IconX } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { InventoryFormValues } from "../../EventFormModal";
import FormModal from "../../FormModal";

type FormValues = {
  date: Date;
};

type Column = {
  accessor: string;
  title: string;
  render: (row: InventoryWarrantyList) => JSX.Element;
};
type Props = {
  activeTab: string;
  fetchHistory: (page: number) => void;
};
const WarrantyPanel = ({ activeTab, fetchHistory }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const userProfile = useUserProfile();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const [activePage, setActivePage] = useState(1);
  const [warrantyList, setWarrantyList] = useState<InventoryWarrantyList[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [warrantyCount, setWarrantyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedWarranty, setSelectedWarranty] =
    useState<InventoryWarrantyList | null>(null);
  const [columns, setColumns] = useState<Column[]>([]); // Specify the type here
  const formMethods = useForm<FormValues>({
    defaultValues: {
      date: undefined,
    },
  });

  const assetId = router.query.assetId as string;
  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id, activeTab]);

  const handleFetchWarrantyList = async (page: number) => {
    try {
      if (!activeTeam.team_id || activeTab !== "warranty") return;
      const { date } = getValues();
      const updatedDate = date
        ? (() => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 1);
            newDate.setHours(0, 0, 0, 0);
            return newDate.toISOString();
          })()
        : "";

      const { data, totalCount } = await getInventoryWarranty(supabaseClient, {
        date: String(updatedDate),
        tagId: assetId,
        page,
        limit: ROW_PER_PAGE,
        teamId: activeTeam.team_id,
      });

      if (data.length > 0) {
        const generatedColumns = Object.keys(data[0])
          .filter(
            (key) =>
              key !== "inventory_warranty_id" &&
              key !== "inventory_warranty_request_id" &&
              key !== "inventory_warranty_date_created" &&
              key !== "inventory_warranty_status"
          )
          .map((key) => ({
            accessor: key,
            // Capitalize the first letter of each word in the title
            title: key
              .replace(/_/g, " ")
              .replace("inventory", "")
              .replace(/\b\w/g, (char) => char.toUpperCase()),

            // Format the row value if it's a date
            render: (row: InventoryWarrantyList) => {
              const value = row[key];

              const isDate = key.includes("date");

              const isNumber = key.includes("Cost");

              return (
                <Text size="sm">
                  {isDate
                    ? formatDate(new Date(value))
                    : isNumber
                      ? new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(Number(value))
                      : value}
                </Text>
              );
            },
          }));
        generatedColumns.push({
          accessor: "actions",
          title: "Actions",
          render: (row: InventoryWarrantyList) => (
            <>
              <Button
                onClick={() => handleEdit(row)}
                color="blue"
                variant="outline"
                size="sm"
                rightIcon={<IconEdit size={16} />}
              >
                Edit
              </Button>
            </>
          ),
        });
        generatedColumns.unshift({
          accessor: "active",
          title: "Warranty Active",
          render: (row: InventoryWarrantyList) => {
            const warrantyStatus = row.inventory_warranty_status;
            const isExpired = warrantyStatus === "ACTIVE";

            return (
              <>
                {isExpired ? (
                  <IconCheck size={16} color="green" />
                ) : (
                  <IconX size={16} color="red" />
                )}
              </>
            );
          },
        });
        setColumns(generatedColumns);
      }
      setWarrantyList(data);
      setWarrantyCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      setIsLoading(true);
      await handleFetchWarrantyList(1);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      setIsLoading(true);
      await handleFetchWarrantyList(page);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (warranty: InventoryWarrantyList) => {
    setSelectedWarranty(null);
    setFormMode("edit");
    setSelectedWarranty(warranty);
    open();
  };

  const handleOnSubmit = async (data: InventoryFormValues) => {
    try {
      await createInventoryWarranty(supabaseClient, {
        warrantyData: data,
        tagId: assetId,
        teamMemberId: teamMember?.team_member_id ?? "",
        selectedRow: selectedWarranty?.inventory_warranty_id,
      });
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
      close();
      handleFetchWarrantyList(activePage);
      fetchHistory(1);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      {activeTab === "warranty" && (
        <FormModal
          isOpen={opened}
          onClose={close}
          selectedRow={selectedWarranty}
          mode={formMode}
          formId="dd3d9787-ba92-4ef7-bc9f-8c6f374cd477"
          userId={userProfile?.user_id ?? ""}
          onSubmit={handleOnSubmit}
        />
      )}

      <Flex direction="column" gap="sm">
        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="end">
            <DatePickerInput
              label="Expiration Date"
              placeholder="Warranty Date Expiration"
              {...register("date", { required: false })}
              miw={250}
              maw={320}
              clearable
              onChange={(value) => {
                register("date").onChange({
                  target: {
                    name: "date",
                    value,
                  },
                });
                handleFetchWarrantyList(activePage);
              }}
            />
            <Button
              leftIcon={<IconPlus size={16} />}
              onClick={() => {
                open(), setFormMode("create"), setSelectedWarranty(null);
              }}
            >
              Add warranty
            </Button>
          </Group>
        </form>

        <DataTable
          fontSize={12}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="inventory_warranty_id"
          page={activePage}
          totalRecords={warrantyCount}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={warrantyList}
          fetching={isLoading}
          columns={columns}
        />
      </Flex>
    </Stack>
  );
};

export default WarrantyPanel;
