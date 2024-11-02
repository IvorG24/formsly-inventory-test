import { getEventDetails } from "@/backend/api/get";
import { updateDisabledEvent } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { EventTableRow } from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  search: string;
  isAscendingSort?: boolean;
};
// type Props = {
//   securityGroup: SecurityGroupData;
// };
const EventsListPage = () => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const [activePage, setActivePage] = useState(1);
  const [currentEventList, setCurrentEventList] = useState<EventTableRow[]>([]);
  const [eventCount, setEventcount] = useState(0);
  const [isLoading, setIsloading] = useState(false);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "event_date_created",
    direction: "desc",
  });

  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
      isAscendingSort: false,
    },
  });

  const { register, handleSubmit, getValues, setValue } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);

  const handleFetchSiteList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search, isAscendingSort } = getValues();
      const { data, totalCount } = await getEventDetails(supabaseClient, {
        search,
        type: "list",
        teamId: activeTeam.team_id,
        page,
        limit: ROW_PER_PAGE,
        isAscendingSort,
        columnAccessor: sortStatus.columnAccessor,
      });
      setEventcount(totalCount);
      setCurrentEventList(data);
      const initialCheckedState = data.reduce(
        (acc, event) => {
          acc[event.event_id] = event.event_is_disabled;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setCheckedState(initialCheckedState);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(1);
      await handleFetchSiteList(1);
      setIsFetchingSiteList(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(page);
      await handleFetchSiteList(page);
      setIsFetchingSiteList(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handleIncludeEvent = async (eventId: string, isChecked: boolean) => {
    try {
      setIsloading(true);
      await updateDisabledEvent(supabaseClient, {
        eventId: eventId,
        isDisabled: isChecked,
      });
      setCheckedState((prev) => ({
        ...prev,
        [eventId]: isChecked,
      }));
      notifications.show({
        message: "Field edited successfully",
        color: "green",
      });
      setIsloading(false);
    } catch (e) {
      setIsloading(false);
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };
  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);
  return (
    <Container maw={3840} h="100%">
      <LoadingOverlay visible={isLoading} />
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>List of Events</Title>
          <Text>
            This is the list of Events currently in the system, including their
            descriptions and available actions. You can edit or delete each site
            as needed.
          </Text>
        </Box>
      </Flex>
      <Paper p="md">
        <Stack>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <Group position="apart" align="center">
              <TextInput
                placeholder="Search by event name"
                {...register("search")}
                rightSection={
                  <ActionIcon size="xs" type="submit">
                    <IconSearch />
                  </ActionIcon>
                }
                miw={250}
                maw={320}
              />
              <Button
                leftIcon={<IconPlus size={16} />}
                onClick={() => {
                  router.push(
                    `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/events/create`
                  );
                }}
              >
                Create Custom Event
              </Button>
            </Group>
          </form>
          <Divider />
          <DataTable
            fontSize={16}
            style={{
              borderRadius: 4,
              minHeight: "300px",
            }}
            withBorder
            idAccessor="event_id"
            page={activePage}
            totalRecords={eventCount}
            recordsPerPage={ROW_PER_PAGE}
            onSortStatusChange={setSortStatus}
            sortStatus={sortStatus}
            onPageChange={handlePagination}
            records={currentEventList}
            fetching={isFetchingSiteList}
            columns={[
              {
                accessor: "event_name",
                width: "20%",
                title: "Event Name",
                sortable: true,
                render: (event) => <Text fw={600}>{event.event_name}</Text>,
              },
              {
                accessor: "event_description",
                width: "30%",
                title: "Event Description",
                sortable: true,
                render: (event) => <Text>{event.event_description}</Text>,
              },
              {
                accessor: "event_status",
                width: "20%",
                title: "Event Status",
                sortable: true,
                render: (event) => (
                  <Badge
                    sx={{
                      backgroundColor: event.event_color || "transparent",
                      color: "#fff",
                    }}
                  >
                    {event.event_status}
                  </Badge>
                ),
              },

              {
                accessor: "event_is_custom_event",
                width: "15%",
                title: "Custom Event",
                sortable: true,
                render: (event) => (
                  <Text>{event.event_is_custom_event ? "Yes" : ""}</Text>
                ),
              },
              {
                accessor: "event_is_disabled",
                width: "15%",
                title: "Event Disabled",
                sortable: true,
                render: (event) => (
                  <Group position="center">
                    <Checkbox
                      checked={checkedState[event.event_id]}
                      onChange={(e) => {
                        handleIncludeEvent(
                          event.event_id,
                          e.currentTarget.checked
                        );
                      }}
                    />
                  </Group>
                ),
              },
              {
                accessor: "actions",
                title: "Actions",
                render: (event) => (
                  <Group spacing="xs" noWrap>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        router.push(
                          `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/events/${event.event_id}/edit`
                        );
                      }}
                    >
                      Customize Event
                    </Button>
                  </Group>
                ),
              },
            ]}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default EventsListPage;
