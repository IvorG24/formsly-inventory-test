import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { getAvatarColor } from "@/utils/styling";
import { InventoryHistory, OptionType } from "@/utils/types";
import { Avatar, Flex, MultiSelect, Stack, Text } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFocusWithin } from "@mantine/hooks";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { historyFilterForms } from "../AssetInventoryDetailsPage";

type Props = {
  asset_history: InventoryHistory[] | null;
  totalRecord: number;
  statusList: OptionType[];
  fetchHistoryPanel: (page: number) => Promise<void>;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  activeTab: string;
};

const HistoryPanel = ({
  asset_history: historyDetails = [],
  totalRecord,
  fetchHistoryPanel,
  sortStatus,
  statusList,
  setSortStatus,
  activeTab,
}: Props) => {
  const [activePage, setActivePage] = useState(1);
  const teamMemberList = useTeamMemberList();
  const [isLoading, setIsLoading] = useState(false);
  const [filterSelectedValues, setFilterSelectedValues] =
    useState<historyFilterForms>({
      event: [],
      date: "",
      actionBy: [],
      isAscendingSort: false,
    });

  useEffect(() => {
    if (activeTab === "history") {
      const fetchData = async () => {
        setIsLoading(true);
        await fetchHistoryPanel(activePage);
        setIsLoading(false);
      };

      fetchData();
    }
  }, [activeTab]);

  const { ref: eventRef, focused: event } = useFocusWithin();
  const { ref: acionByRef, focused: actionBy } = useFocusWithin();
  const { ref: dateRef, focused: date } = useFocusWithin();
  const { control, setValue } = useFormContext<historyFilterForms>();

  const handleFilterChange = async (
    key: keyof historyFilterForms,
    value: string[] | boolean | string = []
  ) => {
    const filterMatch = filterSelectedValues[`${key}`];

    if (value !== filterMatch) {
      fetchHistoryPanel(1);
      setFilterSelectedValues((prev) => ({ ...prev, [`${key}`]: value }));
    }
  };
  const teamMemberOption = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    fetchHistoryPanel(activePage);
  }, [sortStatus]);

  return (
    <Stack>
      <Flex justify="space-between" wrap={"wrap"} gap={"md"}>
        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <DatePickerInput
              placeholder="Date"
              ref={dateRef}
              value={value ? new Date(value) : null}
              onChange={(value) => {
                onChange(value);
                if (!date)
                  handleFilterChange(
                    "date",
                    value ? [new Date(value).toISOString()] : []
                  );
              }}
              sx={{ flex: 1 }}
              miw={250}
              maw={320}
            />
          )}
        />
        <Controller
          control={control}
          name="event"
          render={({ field: { value, onChange } }) => (
            <MultiSelect
              data={statusList}
              placeholder="Event"
              ref={eventRef}
              value={value}
              searchable
              onChange={(value) => {
                onChange(value);
                if (!event) handleFilterChange("event", value);
              }}
              onDropdownClose={() => handleFilterChange("event", value)}
              sx={{ flex: 1 }}
              miw={250}
              maw={320}
            />
          )}
        />
        <Controller
          control={control}
          name="actionBy"
          render={({ field: { value, onChange } }) => (
            <MultiSelect
              data={teamMemberOption}
              placeholder="Action By"
              ref={acionByRef}
              value={value as string[]}
              searchable
              onChange={(value) => {
                onChange(value);
                if (!actionBy) handleFilterChange("actionBy", value);
              }}
              onDropdownClose={() => handleFilterChange("actionBy", value)}
              sx={{ flex: 1 }}
              miw={250}
              maw={320}
            />
          )}
        />
      </Flex>
      <DataTable
        fontSize={12}
        style={{
          borderRadius: 4,
          minHeight: "300px",
        }}
        withBorder
        idAccessor="inventory_history_id"
        page={activePage}
        totalRecords={totalRecord}
        recordsPerPage={ROW_PER_PAGE}
        records={historyDetails || []}
        fetching={isLoading}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        onPageChange={setActivePage}
        columns={[
          {
            accessor: "h.inventory_history_date_created",
            title: "Date",
            sortable: true,
            render: (record) => (
              <Text>
                {formatDate(
                  new Date(String(record.inventory_history_date_created))
                )}
              </Text>
            ),
          },
          {
            accessor: "h.inventory_history_event",
            title: "Event",
            sortable: true,
            render: (record) => (
              <Text>
                {String(record.inventory_history_event).toUpperCase()}
              </Text>
            ),
          },
          {
            accessor: "h.inventory_history_field",
            title: "Field",
            sortable: true,
            render: (record) => (
              <Text>
                {record.inventory_history_field !== null
                  ? String(record.inventory_history_field)
                  : null}
              </Text>
            ),
          },
          {
            accessor: "h.inventory_history_changed_from",
            title: "Changed From",
            sortable: true,
            render: (record) => (
              <Text>
                {record.inventory_history_changed_from
                  ? String(record.inventory_history_changed_from)
                  : ""}
              </Text>
            ),
          },
          {
            accessor: "h.inventory_history_changed_to",
            title: "Changed To",
            sortable: true,
            render: (record) => (
              <Text>
                {record.inventory_history_changed_to
                  ? String(record.inventory_history_changed_to)
                  : ""}
              </Text>
            ),
          },
          {
            accessor: "u.user_id",
            title: "Action By",
            sortable: true,
            render: (record) => {
              if (!record) return;
              const {
                user_id,
                user_first_name,
                user_last_name,
                team_member_id,
              } = record as {
                user_id: string;
                user_first_name: string;
                user_last_name: string;
                team_member_id: string;
              };
              return (
                <Flex px={0} gap={8} align="center">
                  <Avatar
                    color={
                      user_id
                        ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                        : undefined
                    }
                    onClick={() =>
                      team_member_id
                        ? window.open(`/member/${team_member_id}`)
                        : null
                    }
                  >{`${user_first_name[0] + user_last_name[0]}`}</Avatar>
                  <Text>{`${user_first_name + user_last_name}`}</Text>
                </Flex>
              );
            },
          },
        ]}
      />
    </Stack>
  );
};

export default HistoryPanel;
