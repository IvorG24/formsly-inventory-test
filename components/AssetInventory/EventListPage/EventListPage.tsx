import { getEventDetails } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { EventTableRow } from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  search: string;
  site_name: string;
  site_description: string;
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
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);

  const handleFetchSiteList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search } = getValues();
      const { data, totalCount } = await getEventDetails(supabaseClient, {
        search,
        type: "list",
        teamId: activeTeam.team_id,
        page,
        limit: ROW_PER_PAGE,
      });
      setEventcount(totalCount);
      setCurrentEventList(data);
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
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={3}>List of Events</Title>
        <Text>
          This is the list of Events currently in the system, including their
          descriptions and available actions. You can edit or delete each site
          as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by site name"
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
          onPageChange={handlePagination}
          records={currentEventList}
          fetching={isFetchingSiteList}
          columns={[
            {
              accessor: "event_name",
              width: "20%",
              title: "Event Name",
              render: (event) => <Text>{event.event_name}</Text>,
            },
            {
              accessor: "event_description",
              width: "30%",
              title: "Event Description",
              render: (event) => <Text>{event.event_description}</Text>,
            },
            {
              accessor: "event_details",
              width: "20%",
              title: "Event Status",
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
              accessor: "event_is_disabled",
              width: "15%",
              title: "Is Disabled ?",
              render: (event) => (
                <Text>{event.event_is_disabled ? "Yes" : " "}</Text> // Show "False" if event_is_disabled is false
              ),
            },
            {
              accessor: "event_is_custom",
              width: "15%",
              title: "Is Custom Event ?",
              render: (event) => (
                <Text>{event.event_is_custom_event ? "Yes" : ""}</Text>
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
      </Flex>
    </Container>
  );
};

export default EventsListPage;
