import {
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { Controller, useForm } from "react-hook-form";
type securityGroupsFormValues = {
  viewOnly: boolean;
  addAssets: boolean;
  editAssets: boolean;
  deleteAssets: boolean;
  sites: string[];
  departments: string[];
  categories: string[];
  events: string[];
};
const SecurityGroupDetailsPage = () => {
  const { handleSubmit, control } = useForm<securityGroupsFormValues>({
    defaultValues: {
      viewOnly: false,
      addAssets: true,
      editAssets: false,
      deleteAssets: true,
      sites: [],
      departments: [],
      categories: [],
      events: ["Site 1"],
    },
  });

  const sites = ["Site 1", "Site 2"];
  const departments = ["Department 1", "Department 2"];
  const categories = [
    "Buildings",
    "Computer Equipment",
    "Equipment",
    "Furniture and Fixtures",
    "Software",
  ];
  const event = ["Check in", "Check out"];

  const onSubmit = (data: securityGroupsFormValues) => {
    console.log(data);
    // Handle form submission, e.g., save the data or make an API call
  };

  return (
    <Container>
      <Title order={2}>Edit Group: Viewer Group</Title>

      <Tabs defaultValue="assets">
        <Tabs.List>
          <Tabs.Tab value="assets">Assets</Tabs.Tab>
          <Tabs.Tab value="inventory">Inventory</Tabs.Tab>
          <Tabs.Tab value="privileges">Privileges</Tabs.Tab>
          <Tabs.Tab value="reports">Reports</Tabs.Tab>
          <Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
          <Tabs.Tab value="admin_rights">Admin Rights</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="assets">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Assets Permissions Section */}
            <Paper shadow="xs" p="md" withBorder>
              <Stack>
                <Title order={3} size="h4">
                  View and Edit Assets
                </Title>
                <Text size="sm">
                  Set user permission to add / edit / delete / view assets:
                </Text>

                <SimpleGrid cols={3} spacing="md">
                  <Controller
                    name="viewOnly"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="User can view assets."
                        {...field}
                        value={field.value ? "true" : "false"}
                        checked={field.value}
                      />
                    )}
                  />
                  <Controller
                    name="addAssets"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="User can view and create new assets."
                        {...field}
                        value={field.value ? "true" : "false"} // Ensure value is a string
                        checked={field.value}
                      />
                    )}
                  />
                  <Controller
                    name="editAssets"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="User can view and edit ANY asset."
                        {...field}
                        value={field.value ? "true" : "false"} // Ensure value is a string
                        checked={field.value}
                      />
                    )}
                  />
                </SimpleGrid>
                <Divider />
                <Title order={3} size="h4">
                  Filter Assets
                </Title>
                <Text>
                  Allow access of assets by site, department or category :
                </Text>
                <Grid>
                  <Grid.Col span={4}>
                    <Title order={4} size="h6" mb="sm">
                      Sites
                    </Title>
                    <Stack>
                      <Controller
                        name="sites"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Checkbox
                              label="All Sites"
                              onChange={(e) => {
                                if (e.currentTarget.checked) {
                                  field.onChange(sites);
                                } else {
                                  field.onChange([]);
                                }
                              }}
                              checked={field.value.length === sites.length}
                            />
                            {sites.map((site) => (
                              <Checkbox
                                key={site}
                                label={site}
                                value={site}
                                onChange={(e) => {
                                  const checked = e.currentTarget.checked;
                                  if (checked) {
                                    field.onChange([...field.value, site]); // Add site
                                  } else {
                                    field.onChange(
                                      field.value.filter((s) => s !== site)
                                    ); // Remove site
                                  }
                                }}
                                checked={field.value.includes(site) || false}
                              />
                            ))}
                          </>
                        )}
                      />
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Title order={4} size="h6" mb="sm">
                      Departments
                    </Title>
                    <Stack>
                      <Controller
                        name="departments"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Checkbox
                              label="All Departments"
                              onChange={(e) => {
                                if (e.currentTarget.checked) {
                                  field.onChange(departments); // Select all departments
                                } else {
                                  field.onChange([]); // Deselect all
                                }
                              }}
                              checked={
                                field.value.length === departments.length
                              }
                            />
                            {departments.map((dept) => (
                              <Checkbox
                                key={dept}
                                label={dept}
                                value={dept}
                                onChange={(e) => {
                                  const checked = e.currentTarget.checked;
                                  if (checked) {
                                    field.onChange([...field.value, dept]); // Add department
                                  } else {
                                    field.onChange(
                                      field.value.filter((d) => d !== dept)
                                    ); // Remove department
                                  }
                                }}
                                checked={field.value.includes(dept)}
                              />
                            ))}
                          </>
                        )}
                      />
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Title order={4} size="h6" mb="sm">
                      Categories
                    </Title>
                    <Stack>
                      <Controller
                        name="categories"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Checkbox
                              label="All Categories"
                              onChange={(e) => {
                                if (e.currentTarget.checked) {
                                  field.onChange(categories); // Select all categories
                                } else {
                                  field.onChange([]); // Deselect all
                                }
                              }}
                              checked={field.value.length === categories.length}
                            />
                            {categories.map((category) => (
                              <Checkbox
                                key={category}
                                label={category}
                                value={category}
                                onChange={(e) => {
                                  const checked = e.currentTarget.checked;
                                  if (checked) {
                                    field.onChange([...field.value, category]); // Add category
                                  } else {
                                    field.onChange(
                                      field.value.filter((c) => c !== category)
                                    ); // Remove category
                                  }
                                }}
                                checked={field.value.includes(category)}
                              />
                            ))}
                          </>
                        )}
                      />
                    </Stack>
                  </Grid.Col>
                </Grid>
                <Divider />
                <Title order={3} size="h4">
                  Assets Events
                </Title>
                <Text>Allowed actions of assets :</Text>

                <Flex direction="column">
                  <Title order={4} size="h6" mb="sm">
                    Events
                  </Title>
                  <SimpleGrid cols={3} spacing="md">
                    <Controller
                      name="events"
                      control={control}
                      render={({ field }) => (
                        <>
                          {event.map((events) => (
                            <Checkbox
                              key={events}
                              label={events}
                              value={events}
                              onChange={(e) => {
                                const checked = e.currentTarget.checked;
                                if (checked) {
                                  field.onChange([...field.value, events]); // Add site
                                } else {
                                  field.onChange(
                                    field.value.filter((s) => s !== events)
                                  ); // Remove site
                                }
                              }}
                              checked={field.value.includes(events) || false} // Ensure checked is a boolean
                            />
                          ))}
                        </>
                      )}
                    />
                  </SimpleGrid>
                </Flex>
              </Stack>
            </Paper>

            <Group position="right" mt="md">
              <Button fullWidth type="submit">
                Submit
              </Button>
            </Group>
          </form>
        </Tabs.Panel>

        {/* Placeholder Panels for Other Tabs */}
        <Tabs.Panel value="inventory">
          <Text>Inventory permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="privileges">
          <Text>Privileges permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="reports">
          <Text>Reports permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="dashboard">
          <Text>Dashboard permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="admin_rights">
          <Text>Admin Rights will be here</Text>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default SecurityGroupDetailsPage;
