import { getInventoryMaintenance } from "@/backend/api/get";
import { createInventoryMaitenance } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { formatDate, maintenanceOption, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryMaintenanceList } from "@/utils/types";
import { Button, Flex, Group, MultiSelect, Stack, Text } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { InventoryFormValues } from "../../EventFormModal";
import FormModal from "../../FormModal";

type FormValues = {
  date: Date;
  status: string[];
};

type Column = {
  accessor: string;
  title: string;
  render: (row: InventoryMaintenanceList) => JSX.Element;
};
type Props = {
  activeTab: string;
  fetchHistory: (page: number) => void;
};
const MaintenancePanel = ({ activeTab, fetchHistory }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const userProfile = useUserProfile();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const [activePage, setActivePage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [maintenanceList, setMaintenanceList] = useState<
    InventoryMaintenanceList[]
  >([]);

  const [opened, { open, close }] = useDisclosure(false);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<InventoryMaintenanceList | null>(null);
  const [columns, setColumns] = useState<Column[]>([]); // Specify the type here
  const formMethods = useForm<FormValues>({
    defaultValues: {
      date: undefined,
      status: [],
    },
  });

  const assetId = router.query.assetId as string;
  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id, activeTab]);

  const handleFetchMaitenanceList = async (page: number) => {
    try {
      if (!activeTeam.team_id || activeTab !== "maintenance") return;
      const { date, status } = getValues();
      const updatedDate = date
        ? (() => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 1);
            newDate.setHours(0, 0, 0, 0);
            return newDate.toISOString();
          })()
        : "";

      const { data, totalCount } = await getInventoryMaintenance(
        supabaseClient,
        {
          date: String(updatedDate),
          tagId: assetId,
          page,
          teamId: activeTeam.team_id,
          limit: ROW_PER_PAGE,
          status: status,
        }
      );

      if (data.length > 0) {
        const generatedColumns = Object.keys(data[0])
          .filter(
            (key) =>
              key !== "inventory_maintenance_id" &&
              key !== "inventory_maintenance_request_id" &&
              key !== "inventory_maintenance_date_created" &&
              key !== "inventory_request_name" &&
              key !== "inventory_request_tag_id"
          )
          .map((key) => ({
            accessor: key,
            title: key
              .replace(/_/g, " ")
              .replace("inventory", "")
              .replace(/\b\w/g, (char) => char.toUpperCase()),

            render: (row: InventoryMaintenanceList) => {
              const value = row[key];

              const isDate = key.includes("date");
              const isString =
                typeof value === "string" && isNaN(Date.parse(value));
              const isNumber = key.includes("cost");

              return (
                <Text size="sm">
                  {isDate
                    ? formatDate(new Date(value))
                    : isNumber
                      ? new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(Number(value))
                      : isString
                        ? value
                        : ""}
                </Text>
              );
            },
          }));
        generatedColumns.push({
          accessor: "actions",
          title: "Actions",
          render: (row: InventoryMaintenanceList) => (
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
        setColumns(generatedColumns);
      }
      setMaintenanceList(data);
      setMaintenanceCount(totalCount);
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
      await handleFetchMaitenanceList(1);
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
      await handleFetchMaitenanceList(page);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (warranty: InventoryMaintenanceList) => {
    setSelectedMaintenance(null);
    setFormMode("edit");
    setSelectedMaintenance(warranty);
    open();
  };

  const handleOnSubmit = async (data: InventoryFormValues) => {
    try {
      await createInventoryMaitenance(supabaseClient, {
        maintenanceData: data,
        tagId: assetId,
        teamMemberId: teamMember?.team_member_id ?? "",
        selectedRow: selectedMaintenance?.inventory_maintenance_id,
      });
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
      close();
      handleFetchMaitenanceList(activePage);
      fetchHistory(1);
    } catch (e) {
      notifications.show({
        message: "Warranty added successfully",
        color: "green",
      });
    }
  };

  return (
    <Stack>
      {activeTab === "maintenance" && (
        <FormModal
          isOpen={opened}
          onClose={close}
          formId="ffb70d77-05e7-46de-abbf-1513002d079a"
          userId={userProfile?.user_id ?? ""}
          selectedRow={selectedMaintenance}
          onSubmit={handleOnSubmit}
          mode={formMode}
        />
      )}

      <Flex direction="column" gap="sm">
        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="end">
            <Group>
              <DatePickerInput
                label="Maintenance Completion"
                placeholder="Maintenance Completion Date"
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

                  handleFetchMaitenanceList(activePage);
                }}
              />
              <MultiSelect
                data={maintenanceOption}
                label="Maintenance Status"
                placeholder="Maintenance Status"
                {...register("date", { required: false })}
                miw={250}
                maw={320}
                clearable
                onChange={(value: string[]) => {
                  register("status").onChange({
                    target: {
                      name: "status",
                      value,
                    },
                  });
                }}
                onDropdownClose={() => handleFetchMaitenanceList(activePage)}
              />
            </Group>
            <Button
              leftIcon=<IconPlus size={16} />
              onClick={() => {
                open(), setFormMode("create"), setSelectedMaintenance(null);
              }}
            >
              Add Maintenance
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
          idAccessor="invventory_maintenance_id"
          page={activePage}
          totalRecords={maintenanceCount}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={maintenanceList}
          fetching={isLoading}
          columns={columns}
        />
      </Flex>
    </Stack>
  );
};

export default MaintenancePanel;
