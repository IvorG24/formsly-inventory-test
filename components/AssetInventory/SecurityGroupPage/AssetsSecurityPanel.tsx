import {
  CategoryTableRow,
  EventTableRow,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Grid,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Controller, useForm } from "react-hook-form";
import { Department } from "./SecurityGroupPage";

type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  eventList: EventTableRow[];
  securityGroupData: SecurityGroupData["asset"];
};
type securityGroupsFormValues = {
  viewOnly: boolean;
  addAssets: boolean;
  editAssets: boolean;
  deleteAssets: boolean;
  site: string[];
  department: string[];
  categories: string[];
  events: string[];
};
const AssetsSecurityPanel = ({
  siteList,
  departmentList,
  categoryList,
  eventList,
  securityGroupData,
}: Props) => {
  const transformSecurityGroupData = (
    securityGroupData: SecurityGroupData["asset"]
  ) => {
    const permissions = securityGroupData.permissions.reduce(
      (acc, perm) => {
        acc[perm.key] = perm.value;
        return acc;
      },
      {} as Record<string, boolean>
    );

    return {
      ...permissions,
      site: securityGroupData.filter.site || [],
      department: securityGroupData.filter.department || [],
      categories: securityGroupData.filter.categories || [],
      events: securityGroupData.filter.events || [],
    };
  };
  // Then use it in the useForm hook:
  const { handleSubmit, control } = useForm<securityGroupsFormValues>({
    defaultValues: transformSecurityGroupData(securityGroupData),
  });

  const onSubmit = (data: securityGroupsFormValues) => {
    console.log(data);
  };

  return (
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
          <Text>Allow access of assets by site, department or category :</Text>
          <Grid>
            <Grid.Col span={4}>
              <Title order={4} size="h6" mb="sm">
                Sites
              </Title>
              <ScrollArea h={400}>
                <Stack>
                  <Controller
                    name="site"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Checkbox
                          label="All Sites"
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              field.onChange(
                                siteList.map((site) => site.site_name)
                              );
                            } else {
                              field.onChange([]);
                            }
                          }}
                          checked={field.value.length === siteList.length}
                        />
                        {siteList.map((site) => (
                          <Checkbox
                            key={site.site_id}
                            label={site.site_name}
                            value={site.site_name}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;
                              if (checked) {
                                field.onChange([
                                  ...field.value,
                                  site.site_name,
                                ]); // Add site
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (s) => s !== site.site_name
                                  )
                                ); // Remove site
                              }
                            }}
                            checked={
                              field.value.includes(site.site_name) || false
                            }
                          />
                        ))}
                      </>
                    )}
                  />
                </Stack>
              </ScrollArea>
            </Grid.Col>

            <Grid.Col span={4}>
              <Title order={4} size="h6" mb="sm">
                Departments
              </Title>
              <ScrollArea h={400}>
                <Stack>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Checkbox
                          label="All Departments"
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              field.onChange(
                                departmentList.map(
                                  (department) =>
                                    department.team_department_name
                                )
                              );
                            } else {
                              field.onChange([]);
                            }
                          }}
                          checked={field.value.length === departmentList.length}
                        />
                        {departmentList.map((dept) => (
                          <Checkbox
                            key={dept.team_department_id}
                            label={dept.team_department_name}
                            value={dept.team_department_name}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;
                              if (checked) {
                                field.onChange([
                                  ...field.value,
                                  dept.team_department_name,
                                ]); // Add department
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (d) => d !== dept.team_department_name
                                  )
                                ); // Remove department
                              }
                            }}
                            checked={field.value.includes(
                              dept.team_department_name
                            )}
                          />
                        ))}
                      </>
                    )}
                  />
                </Stack>
              </ScrollArea>
            </Grid.Col>

            <Grid.Col span={4}>
              <Title order={4} size="h6" mb="sm">
                Categories
              </Title>
              <ScrollArea h={400}>
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
                              field.onChange(
                                categoryList.map(
                                  (category) => category.category_name
                                )
                              );
                            } else {
                              field.onChange([]); // Deselect all
                            }
                          }}
                          checked={field.value.length === categoryList.length}
                        />
                        {categoryList.map((category) => (
                          <Checkbox
                            key={category.category_id}
                            label={category.category_name}
                            value={category.category_name}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;
                              if (checked) {
                                field.onChange([...field.value, category]); // Add category
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (c) => c !== category.category_name
                                  )
                                ); // Remove category
                              }
                            }}
                            checked={field.value.includes(
                              category.category_name
                            )}
                          />
                        ))}
                      </>
                    )}
                  />
                </Stack>
              </ScrollArea>
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
                    {eventList.map((events) => (
                      <Checkbox
                        key={events.event_id}
                        label={events.event_name}
                        value={events.event_name}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          if (checked) {
                            field.onChange([...field.value, events.event_name]); // Add site
                          } else {
                            field.onChange(
                              field.value.filter((s) => s !== events.event_name)
                            ); // Remove site
                          }
                        }}
                        checked={
                          field.value.includes(events.event_name) || false
                        } // Ensure checked is a boolean
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
  );
};

export default AssetsSecurityPanel;
