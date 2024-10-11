import { formatDate } from "@/utils/constant";
import { InventoryHistory, InventoryListType } from "@/utils/types";
import {
  Button,
  Container,
  Group,
  Paper,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import AdditionalDetailsPanel from "./AdditionalDetailsPanel";
import EventPanel from "./EventPanel";
import HistoryPanel from "./HistoryPanel";

type Props = {
  asset_details: InventoryListType[];
  asset_history: InventoryHistory[];
};

const excludedKeys = [
  "inventory_request_name",
  "request_creator_first_name",
  "request_creator_last_name",
  "site_name",
  "inventory_assignee_team_member_id",
  "request_creator_team_member_id",
  "request_creator_user_id",
  "assignee_user_id",
  "inventory_assignee_asset_request_id",
  "request_creator_avatar",
  "assignee_team_member_id",
  "assignee_first_name",
  "assignee_last_name",
  "inventory_request_purchase_date",
  "inventory_request_purchase_from",
  "inventory_request_purchase_order",
  "inventory_request_created_by",
  "inventory_request_created",
  "inventory_request_cost",
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

const AssetInventoryDetailsPage = ({ asset_details, asset_history }: Props) => {
  return (
    <Container size="lg">
      <Paper shadow="lg" p="lg">
        {asset_details.map((detail, idx) => (
          <div key={idx}>
            <Group position="apart" mb="md">
              <Title order={3}>
                {detail.inventory_request_name || "Unknown Asset Name"}
              </Title>
              <Group>
                <Button>Edit Asset</Button>
                <Button>More Actions</Button>
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
                <Tabs.Tab value="history">History</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" mt="md">
                <AdditionalDetailsPanel detail={detail} />
              </Tabs.Panel>

              <Tabs.Panel value="events" mt="md">
                <EventPanel />
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
