import { ROW_PER_PAGE } from "@/utils/constant";
import { Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
type History = {
  date: string;
  event: string;
  field: string;
  changedFrom: string;
  changedTo: string;
  actionBy: string;
};
const HistoryPanel = () => {
  const historyList: History[] = [
    {
      date: "10/07/2024 07:38 PM",
      event: "Check in",
      field: "Status",
      changedFrom: "Checked out",
      changedTo: "Available",
      actionBy: "Mark Ivor Glorioso",
    },
    {
      date: "10/07/2024 03:55 AM",
      event: "Check out",
      field: "Status",
      changedFrom: "Available",
      changedTo: "Checked out",
      actionBy: "Mark Ivor Glorioso",
    },
    {
      date: "10/07/2024 03:09 AM",
      event: "Check in",
      field: "Status",
      changedFrom: "Checked out",
      changedTo: "Available",
      actionBy: "Mark Ivor Glorioso",
    },
    {
      date: "10/07/2024 02:16 AM",
      event: "Check out",
      field: "Status",
      changedFrom: "Available",
      changedTo: "Checked out",
      actionBy: "Mark Ivor Glorioso",
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
        totalRecords={historyList.length}
        recordsPerPage={ROW_PER_PAGE}
        records={historyList}
        fetching={false}
        onPageChange={(page) => console.log(`Page changed to: ${page}`)}
        columns={[
          {
            accessor: "date",
            title: "Date",
            render: (history: History) => <Text>{history.date}</Text>,
          },
          {
            accessor: "event",
            title: "Event",
            render: (history: History) => <Text>{history.event}</Text>,
          },
          {
            accessor: "field",
            title: "Field",
            render: (history: History) => <Text>{history.field}</Text>,
          },
          {
            accessor: "changedFrom",
            title: "Changed from",
            render: (history: History) => <Text>{history.changedFrom}</Text>,
          },
          {
            accessor: "changedTo",
            title: "Changed to",
            render: (history: History) => <Text>{history.changedTo}</Text>,
          },
          {
            accessor: "actionBy",
            title: "Action by",
            render: (history: History) => <Text>{history.actionBy}</Text>,
          },
        ]}
      />
    </>
  );
};

export default HistoryPanel;
