import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryEventRow } from "@/utils/types";
import { Anchor, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
type Props = {
  fetchEventsPanel: (page: number) => void;
  totalRecords: number;
  eventHistoryData: InventoryEventRow[] | null;
};
const EventPanel = ({
  totalRecords,
  eventHistoryData = [],
  fetchEventsPanel,
}: Props) => {
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    fetchEventsPanel(activePage);
  }, [activePage]);

  return (
    <>
      <DataTable
        fontSize={12}
        style={{
          borderRadius: 4,
          minHeight: "300px",
        }}
        withBorder
        idAccessor="inventory_event_id"
        page={activePage}
        totalRecords={totalRecords}
        recordsPerPage={ROW_PER_PAGE}
        records={eventHistoryData || []}
        onPageChange={setActivePage}
        columns={[
          {
            accessor: "returnDate",
            title: "Event Date",
            render: (event) => (
              <Text>{`${event.inventory_event} Date ( ${formatDate(new Date(event.inventory_event_date_created || ""))} )`}</Text>
            ),
          },
          {
            accessor: "status",
            title: "Event",
            render: (event) => <Text>{event.inventory_event}</Text>,
          },

          {
            accessor: "event_notes",
            title: "Notes",
            render: (event) =>
              event.inventory_event_notes ? (
                <Text>{event.inventory_event_notes}</Text>
              ) : (
                <Text>-</Text>
              ),
          },
          {
            accessor: "event_signature",
            title: "Signature",
            render: (event) => (
              <Text>
                <Anchor
                  href={event.inventory_event_signature ?? ""}
                  target="_blank"
                >
                  Event Signature
                </Anchor>
              </Text>
            ),
          },
        ]}
      />
    </>
  );
};

export default EventPanel;
