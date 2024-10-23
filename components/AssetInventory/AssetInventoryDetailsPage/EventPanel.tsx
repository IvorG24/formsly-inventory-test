import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryDynamicRow } from "@/utils/types";
import {
  Button,
  Flex,
  Grid,
  Group,
  Pagination,
  Paper,
  Text,
} from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
  fetchEventsPanel: (page: number) => void;
  totalRecords: number;
  eventHistoryData: InventoryDynamicRow[] | null;
  activeTab: string;
};

const formatTitle = (key: string, eventName: string) => {
  return key
    .replace("event", "")
    .replace(/_/g, " ")
    .replace(eventName.toLowerCase(), " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const EventPanel = ({
  totalRecords,
  eventHistoryData = [],
  fetchEventsPanel,
  activeTab,
}: Props) => {
  const [activePage, setActivePage] = useState(1);
  const activeTeam = useActiveTeam();
  const router = useRouter();
  useEffect(() => {
    if (!activeTeam.team_id || activeTab !== "events") return;
    fetchEventsPanel(activePage);
  }, [activePage, activeTeam.team_id, activeTab]);

  return (
    <>
      {eventHistoryData?.map((event, index) => (
        <Paper shadow="sm" p="md" withBorder key={index} mb="md">
          <Grid gutter="md">
            {Object.entries(event).map(([key, value]) => {
              if (key === "event_id" || key === "event_signature") return null;

              return (
                <Grid.Col span={6} key={key}>
                  <Group>
                    <Text size="sm" weight={500}>
                      {formatTitle(key, event.event_name)}:
                    </Text>
                    <Text size="sm">
                      {typeof value === "number"
                        ? key.toLowerCase().includes("date")
                          ? formatDate(new Date(value))
                          : new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(value)
                        : typeof value === "string" &&
                            key.toLowerCase().includes("date")
                          ? formatDate(new Date(value))
                          : value || "N/A"}
                    </Text>
                  </Group>
                </Grid.Col>
              );
            })}

            <Grid.Col span={12}>
              <Flex justify="flex-end" mt="md">
                <Button
                  size="xs"
                  onClick={() => {
                    router.push(event.event_signature);
                  }}
                  variant="filled"
                >
                  Signature
                </Button>
              </Flex>
            </Grid.Col>
          </Grid>
        </Paper>
      ))}

      <Pagination
        value={activePage}
        onChange={setActivePage}
        total={Math.ceil(totalRecords / ROW_PER_PAGE)}
        position="center"
        mt="md"
      />
    </>
  );
};

export default EventPanel;
