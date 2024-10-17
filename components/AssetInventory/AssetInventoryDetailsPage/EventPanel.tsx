import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryEventRow } from "@/utils/types";
import { Text } from "@mantine/core";
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
            render: (event) =>
              event.inventory_event_return_date ? (
                <Text>{`Return Date ( ${formatDate(new Date(event.inventory_event_return_date))} )`}</Text>
              ) : (
                <Text>{`Check Out Date ( ${formatDate(new Date(event.inventory_event_check_out_date || ""))} )`}</Text>
              ),
          },
          {
            accessor: "status",
            title: "Event",
            render: (event) => <Text>{event.inventory_event}</Text>,
          },

          {
            accessor: "dueDate",
            title: "Due Date",
            render: (event) =>
              event.inventory_event === "Check Out" ? (
                <Text>
                  {formatDate(new Date(event.inventory_event_due_date || ""))}
                </Text>
              ) : (
                <Text>-</Text>
              ),
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
        ]}
      />
    </>
  );
};

export default EventPanel;
