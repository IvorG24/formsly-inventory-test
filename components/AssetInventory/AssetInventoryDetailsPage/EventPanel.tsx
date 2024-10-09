import { ROW_PER_PAGE } from "@/utils/constant";
import { Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
type Event = {
  checkoutDate: string;
  returnDate: string | null;
  status: string;
  assignedTo: string;
  dueDate: string | null;
  checkoutNotes: string;
  checkinNotes: string | null;
};

const EventPanel = () => {
  const eventsList: Event[] = [
    {
      checkoutDate: "09/21/2024",
      returnDate: null,
      status: "Checked Out",
      assignedTo: "John Doe",
      dueDate: "09/30/2024",
      checkoutNotes: "Assigned for a project",
      checkinNotes: null,
    },
    {
      checkoutDate: "09/26/2024",
      returnDate: "10/01/2024",
      status: "Returned",
      assignedTo: "Jane Smith",
      dueDate: null,
      checkoutNotes: "Returned in good condition",
      checkinNotes: "Confirmed return",
    },
  ];

  return (
    <>
      <DataTable
        fontSize={12}
        style={{
          borderRadius: 4,
          minHeight: "300px",
        }}
        withBorder
        idAccessor="department_id"
        page={1}
        totalRecords={eventsList.length}
        recordsPerPage={ROW_PER_PAGE}
        records={eventsList}
        fetching={false}
        onPageChange={(page) => console.log(`Page changed to: ${page}`)} // Added onPageChange prop
        columns={[
          {
            accessor: "checkoutDate",
            title: "Return Date",
            render: (event: Event) =>
              event.returnDate ? (
                <Text>{` ${event.returnDate}`}</Text>
              ) : (
                <Text>{` ${event.checkoutDate}`}</Text>
              ),
          },
          {
            accessor: "status",
            title: "Status",
            render: (event: Event) => <Text>{event.status}</Text>,
          },
          {
            accessor: "assignedTo",
            title: "Return To",
            render: (event: Event) => <Text>{event.assignedTo}</Text>,
          },
          {
            accessor: "dueDate",
            title: "Due Date",
            render: (event: Event) =>
              event.status === "Checked Out" ? (
                <Text>{event.dueDate}</Text>
              ) : (
                <Text>-</Text>
              ),
          },
          {
            accessor: "checkoutNotes",
            title: "Checkout Notes",
            render: (event: Event) => <Text>{event.checkoutNotes}</Text>,
          },
          {
            accessor: "checkinNotes",
            title: "Check-In Notes",
            render: (event: Event) =>
              event.checkinNotes ? (
                <Text>{event.checkinNotes}</Text>
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
