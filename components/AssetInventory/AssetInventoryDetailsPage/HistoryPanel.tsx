import { formatDate, ROW_PER_PAGE } from "@/utils/constant";
import { getAvatarColor } from "@/utils/styling";
import { InventoryHistory } from "@/utils/types";
import { Avatar, Flex, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { useState } from "react";

type Props = {
  asset_history: InventoryHistory[];
};

const HistoryPanel = ({ asset_history: historyDetails }: Props) => {
  const [page, setPage] = useState(1);

  return (
    <>
      <DataTable
        fontSize={12}
        style={{
          borderRadius: 4,
          minHeight: "300px",
        }}
        withBorder
        idAccessor="inventory_history_id"
        page={page} // Updated to use state
        totalRecords={historyDetails.length}
        recordsPerPage={ROW_PER_PAGE}
        records={historyDetails.slice(
          (page - 1) * ROW_PER_PAGE,
          page * ROW_PER_PAGE
        )}
        onPageChange={setPage}
        columns={[
          {
            accessor: "inventory_history_date_created",
            title: "Date",
            render: (record) => (
              <Text>
                {formatDate(
                  new Date(String(record.inventory_history_date_created))
                )}
              </Text>
            ),
          },
          {
            accessor: "inventory_history_changed_from", // Updated accessor
            title: "Changed From",
            render: (record) => (
              <Text>{String(record.inventory_history_changed_from)}</Text>
            ),
          },
          {
            accessor: "inventory_history_changed_to", // Updated accessor
            title: "Changed To",
            render: (record) => (
              <Text>{String(record.inventory_history_changed_to)}</Text>
            ),
          },
          {
            accessor: "request_creator_user_id",
            title: "Action By",
            render: (record) => {
              const {
                user_id,
                user_first_name,
                user_last_name,
                team_member_id,
              } = record as {
                user_id: string;
                user_first_name: string;
                user_last_name: string;
                team_member_id: string;
              };
              return (
                <Flex px={0} gap={8} align="center">
                  <Avatar
                    color={
                      user_id
                        ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                        : undefined
                    }
                    onClick={() =>
                      team_member_id
                        ? window.open(`/member/${team_member_id}`)
                        : null
                    }
                  >{`${user_first_name[0] + user_last_name[0]}`}</Avatar>
                  <Text>{`${user_first_name + user_last_name}`}</Text>
                </Flex>
              );
            },
          },
        ]}
      />
    </>
  );
};

export default HistoryPanel;
