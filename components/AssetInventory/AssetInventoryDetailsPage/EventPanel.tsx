import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { InventoryEventRow } from "@/utils/types";
import { Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";

type Props = {
  asset_event: InventoryEventRow[];
};

const EventPanel = ({ asset_event }: Props) => {
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
        page={1}
        totalRecords={asset_event.length}
        recordsPerPage={ROW_PER_PAGE}
        records={asset_event}
        fetching={false}
        onPageChange={(page) => console.log(`Page changed to: ${page}`)} // Added
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
              event.inventory_event === "Check Out Form" ? (
                <Text>{event.inventory_event_due_date}</Text>
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
