import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryDynamicRow } from "@/utils/types";
import {
  Button,
  Card,
  Divider,
  Flex,
  Grid,
  Group,
  Pagination,
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
        <Card shadow="md" p="lg" withBorder key={index} mb="lg" radius="md">
          <Grid gutter="lg">
            {Object.entries(event).map(([key, value]) => {
              if (key === "event_id" || key === "event_signature") return null;

              return (
                <Grid.Col span={6} key={key}>
                  <Group align="apart" spacing="xs">
                    <Text size="sm" weight={600}>
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
                          : typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : value || "N/A"}
                    </Text>
                  </Group>
                </Grid.Col>
              );
            })}
          </Grid>

          <Divider my="md" />

          <Flex justify="flex-end">
            <Button
              size="sm"
              onClick={() => {
                router.push(event.event_signature);
              }}
            >
              Signature
            </Button>
          </Flex>
        </Card>
      ))}

      <Pagination
        value={activePage}
        onChange={setActivePage}
        total={Math.ceil(totalRecords / ROW_PER_PAGE)}
        position="center"
        mt="md"
        size="sm"
      />
    </>
  );
};

export default EventPanel;
