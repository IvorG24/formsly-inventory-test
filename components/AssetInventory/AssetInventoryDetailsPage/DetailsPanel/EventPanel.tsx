import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { formatCurrency } from "@/utils/functions";
import { InventoryDynamicRow } from "@/utils/types";
import {
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Pagination,
  Text,
} from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

type Props = {
  fetchEventsPanel: (page: number) => void;
  totalRecords: number;
  eventHistoryData: InventoryDynamicRow[] | null;
  activeTab: string;
};

const formatTitle = (key: string, eventName: string) =>
  key
    .replace("event", "")
    .replace(/_/g, " ")
    .replace(eventName.toLowerCase(), " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (key: string, value: string) => {
  if (typeof value === "number") {
    return key.toLowerCase().includes("date")
      ? formatDate(new Date(value))
      : formatCurrency(value);
  }
  if (typeof value === "string" && key.toLowerCase().includes("date")) {
    return formatDate(new Date(value));
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value || "";
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

  const totalPages = useMemo(
    () => Math.ceil(totalRecords / ROW_PER_PAGE),
    [totalRecords]
  );

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
              if (["event_id", "event_signature"].includes(key)) return null;

              return (
                <Grid.Col span={6} key={key}>
                  <Group align="apart" spacing="xs">
                    <Text size="sm" weight={600}>
                      {formatTitle(key, event.event_name)}:
                    </Text>
                    <Text size="sm">{formatValue(key, value)}</Text>
                  </Group>
                </Grid.Col>
              );
            })}
          </Grid>

          <Divider my="md" />

          <Group position="right">
            {event.event_signature && (
              <Button
                size="sm"
                onClick={() => router.push(event.event_signature)}
              >
                Signature
              </Button>
            )}
          </Group>
        </Card>
      ))}

      <Pagination
        value={activePage}
        onChange={setActivePage}
        total={totalPages}
        position="center"
        mt="md"
        size="sm"
      />
    </>
  );
};

export default EventPanel;
