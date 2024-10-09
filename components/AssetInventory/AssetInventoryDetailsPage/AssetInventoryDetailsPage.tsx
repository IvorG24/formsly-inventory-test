import {
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import EventPanel from "./EventPanel";
import HistoryPanel from "./HistoryPanel";

const AssetInventoryDetailsPage = () => {
  const assetDetails = {
    assetTagId: "zxadz",
    purchaseDate: "09/19/2024",
    cost: "$4,444.00",
    brand: "zxcasd",
    model: "zxcasd",
    site: "Site 1",
    location: "fff",
    category: "Software",
    department: "department 1",
    status: "Disposed",
    serialNo: "asdzxcasdzxcz",
    purchasedFrom: "qweasd",
    dateDisposed: "09/26/2024",
    disposeTo: "ttweqsadz",
    dateCreated: "09/26/2024 02:17 AM",
    notes: "hey",
    createdBy: "Mark Ivor Glorioso",
  };

  return (
    <Container size="lg">
      <Paper shadow="lg" p="lg">
        <Grid>
          <Grid.Col span={6}>
            <Text size="xl" weight={500}>
              {assetDetails.assetTagId}
            </Text>
          </Grid.Col>
          <Grid.Col span={6} style={{ textAlign: "right" }}>
            <Group position="right">
              <Button>Edit Asset</Button>
              <Button>More Actions</Button>
            </Group>
          </Grid.Col>
        </Grid>

        <Grid mt="md">
          <Grid.Col span={6}>
            <Table>
              <tbody>
                <tr>
                  <td>
                    <Text weight={500}>Asset Tag ID</Text>
                  </td>
                  <td>{assetDetails.assetTagId}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Purchase Date</Text>
                  </td>
                  <td>{assetDetails.purchaseDate}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Cost</Text>
                  </td>
                  <td>{assetDetails.cost}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Brand</Text>
                  </td>
                  <td>{assetDetails.brand}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Model</Text>
                  </td>
                  <td>{assetDetails.model}</td>
                </tr>
              </tbody>
            </Table>
          </Grid.Col>

          <Grid.Col span={6}>
            <Table>
              <tbody>
                <tr>
                  <td>
                    <Text weight={500}>Site</Text>
                  </td>
                  <td>{assetDetails.site}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Location</Text>
                  </td>
                  <td>{assetDetails.location}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Category</Text>
                  </td>
                  <td>{assetDetails.category}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Department</Text>
                  </td>
                  <td>{assetDetails.department}</td>
                </tr>
                <tr>
                  <td>
                    <Text weight={500}>Status</Text>
                  </td>
                  <td>{assetDetails.status}</td>
                </tr>
              </tbody>
            </Table>
          </Grid.Col>
        </Grid>

        <Tabs mt="xl" defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="events">Events</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" mt="md">
            <Card withBorder shadow="sm">
              <Text size="lg" weight={500}>
                Asset Details
              </Text>
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="events" mt="md">
            <EventPanel />
          </Tabs.Panel>

          <Tabs.Panel value="history" mt="md">
            <HistoryPanel />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
