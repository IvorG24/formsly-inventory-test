import {
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Paper,
  Table,
  Tabs,
  Text,
} from "@mantine/core";

const AssetInventoryDetailsPage = () => {
  // Example asset data, replace with dynamic data as needed
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

  // Example lists for Events and History (replace with dynamic data)
  const eventsList = ["Event 1", "Event 2", "Event 3"];
  const historyList = ["History 1", "History 2", "History 3"];

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
              <Grid mt="sm">
                <Grid.Col span={6}>
                  <Table>
                    <tbody>
                      <tr>
                        <td>
                          <Text weight={500}>Serial No</Text>
                        </td>
                        <td>{assetDetails.serialNo}</td>
                      </tr>
                      <tr>
                        <td>
                          <Text weight={500}>Purchased from</Text>
                        </td>
                        <td>{assetDetails.purchasedFrom}</td>
                      </tr>
                      <tr>
                        <td>
                          <Text weight={500}>Date Disposed</Text>
                        </td>
                        <td>{assetDetails.dateDisposed}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Table>
                    <tbody>
                      <tr>
                        <td>
                          <Text weight={500}>Dispose to</Text>
                        </td>
                        <td>{assetDetails.disposeTo}</td>
                      </tr>
                      <tr>
                        <td>
                          <Text weight={500}>Date Created</Text>
                        </td>
                        <td>{assetDetails.dateCreated}</td>
                      </tr>
                      <tr>
                        <td>
                          <Text weight={500}>Notes</Text>
                        </td>
                        <td>{assetDetails.notes}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="events" mt="md">
            <Card withBorder shadow="sm">
              <Text size="lg" weight={500}>
                Events
              </Text>
              {/* List of Events */}
              <List>
                {eventsList.map((event, index) => (
                  <List.Item key={index}>{event}</List.Item>
                ))}
              </List>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="history" mt="md">
            <Card withBorder shadow="sm">
              <Text size="lg" weight={500}>
                History
              </Text>

              <List>
                {historyList.map((history, index) => (
                  <List.Item key={index}>{history}</List.Item>
                ))}
              </List>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
