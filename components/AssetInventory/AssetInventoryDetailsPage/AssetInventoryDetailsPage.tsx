import { getEventDetails } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate } from "@/utils/constant";
import {
  InventoryEventRow,
  InventoryHistory,
  InventoryListType,
  OptionType,
} from "@/utils/types";
import {
  Button,
  Container,
  Group,
  Menu,
  Paper,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconDotsVertical } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import AdditionalDetailsPanel from "./AdditionalDetailsPanel";
import AssetLinkPanel from "./AssetLinkPanel";
import EventFormModal from "./EventFormModal"; // Import EventFormModal
import EventPanel from "./EventPanel";
import HistoryPanel from "./HistoryPanel";

type Props = {
  asset_details: InventoryListType[];
  asset_history: InventoryHistory[];
  asset_event: InventoryEventRow[];
};

const excludedKeys = [
  // Excluded keys list...
];

const formatLabel = (key: string) => {
  if (key === "inventory_request_id") {
    return "Asset Tag Id";
  }
  const formattedKey = key.replace(/^inventory_request_/, "");
  return formattedKey
    .replace(/_/g, " ")
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

const AssetInventoryDetailsPage = ({
  asset_details,
  asset_history,
  asset_event,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();

  const [optionsEvent, setOptionsEvent] = useState<OptionType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null); // Track selected event

  useEffect(() => {
    const getEventOptions = async () => {
      if (!activeTeam.team_id) return;
      const eventOptions = await getEventDetails(
        supabaseClient,
        activeTeam.team_id
      );

      const initialEventOptions: OptionType[] = eventOptions.map((event) => ({
        label: event.event_name,
        value: event.event_id,
      }));

      setOptionsEvent(initialEventOptions);
    };

    getEventOptions();
  }, [activeTeam.team_id]);

  const handleMenuClick = (eventId: string) => {
    setSelectedEventId(eventId); // Set selected event and open the modal
  };

  const handleModalClose = () => {
    setSelectedEventId(null); // Reset selected event when modal is closed
  };

  return (
    <Container size="lg">
      {/* Display EventFormModal when an event is selected */}
      {selectedEventId && (
        <EventFormModal
          eventId={selectedEventId} // Pass selected event ID
          onClose={handleModalClose} // Close modal handler
        />
      )}

      <Paper shadow="lg" p="lg">
        {asset_details.map((detail, idx) => (
          <div key={idx}>
            <Group position="apart" mb="md">
              <Title order={3}>
                {detail.inventory_request_name || "Unknown Asset Name"}
              </Title>
              <Group>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button rightIcon={<IconDotsVertical size={16} />}>
                      More Actions
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Actions</Menu.Label>
                    {optionsEvent.map((event) => (
                      <Menu.Item
                        key={event.value}
                        onClick={() => handleMenuClick(event.value)} // Handle menu item click
                      >
                        {event.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <Table striped highlightOnHover withBorder withColumnBorders>
              <tbody>
                {Object.entries(detail)
                  .filter(([key]) => !excludedKeys.includes(key))
                  .reduce<JSX.Element[]>((acc, [key, value], index, array) => {
                    if (index % 2 === 0) {
                      const nextEntry = array[index + 1];
                      acc.push(
                        <tr key={key}>
                          <td>
                            <Text weight={500}>{formatLabel(key)}</Text>
                          </td>
                          <td>
                            {key === "purchase_date"
                              ? formatDate(new Date(String(value)))
                              : value || "N/A"}
                          </td>
                          {nextEntry ? (
                            <>
                              <td>
                                <Text weight={500}>
                                  {formatLabel(nextEntry[0])}
                                </Text>
                              </td>
                              <td>
                                {nextEntry[0] === "purchase_date"
                                  ? formatDate(new Date(String(nextEntry[1])))
                                  : nextEntry[1] || "N/A"}
                              </td>
                            </>
                          ) : (
                            <td colSpan={2}></td>
                          )}
                        </tr>
                      );
                    }
                    return acc;
                  }, [])}

                <tr>
                  <td>
                    <Text weight={500}>Created By</Text>
                  </td>
                  <td>
                    {detail.request_creator_first_name}{" "}
                    {detail.request_creator_last_name || "N/A"}
                  </td>
                  <td>
                    <Text weight={500}>Assigned To</Text>
                  </td>
                  <td>
                    {detail.site_name || ""}
                    {`${detail.assignee_first_name || ""} ${detail.assignee_last_name || ""}`}
                  </td>
                </tr>
              </tbody>
            </Table>

            <Tabs mt="xl" defaultValue="details">
              <Tabs.List>
                <Tabs.Tab value="details">Additional Details</Tabs.Tab>
                <Tabs.Tab value="events">Events</Tabs.Tab>
                <Tabs.Tab value="asset-link">Asset Link</Tabs.Tab>
                <Tabs.Tab value="history">History</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" mt="md">
                <AdditionalDetailsPanel detail={detail} />
              </Tabs.Panel>

              <Tabs.Panel value="events" mt="md">
                <EventPanel asset_event={asset_event} />
              </Tabs.Panel>
              <Tabs.Panel value="asset-link" mt="md">
                <AssetLinkPanel />
              </Tabs.Panel>

              <Tabs.Panel value="history" mt="md">
                <HistoryPanel asset_history={asset_history} />
              </Tabs.Panel>
            </Tabs>
          </div>
        ))}
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
