import { updateSecurityGroup } from "@/backend/api/post";
import {
  permissions,
  permissionsFormValues,
  SecurityGroupData,
} from "@/utils/types";
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
type Props = {
  privilegesGroupdata: SecurityGroupData["privileges"];
};
const PrivilegesSecurityPanel = ({ privilegesGroupdata }: Props) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const groupId = router.query.groupId as string;
  const [isLoading, setIsLoading] = useState(false);
  const priviledgesDefaultValue = {
    privileges: {
      ...privilegesGroupdata,
    },
  };
  const { handleSubmit, control, setValue } = useForm<permissionsFormValues>({
    defaultValues: priviledgesDefaultValue,
  });
  const permissionValues = useWatch({
    control,
    name: "privileges",
  });

  const toggleAll = (type: keyof permissions, checked: boolean) => {
    tables.forEach((table) => {
      setValue(`privileges.${table.name}.${type}`, checked);
    });
  };
  const tables = [
    { label: "Site", name: "site" },
    { label: "Location", name: "location" },
    { label: "Category", name: "category" },
    { label: "Sub Category", name: "subCategory" },
    { label: "Departments", name: "department" },
    { label: "Custom Field", name: "customField" },
    { label: "Employee", name: "employee" },
    { label: "Customer", name: "customer" },
  ] as const;

  const handlePrivilegesSubmit = async (data: permissionsFormValues) => {
    try {
      setIsLoading(true);
      await updateSecurityGroup(supabaseClient, {
        groupId,
        permissionsFormValues: data,
      });
      notifications.show({
        message: "Privilege Security Group Updated",
        color: "green",
      });
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handlePrivilegesSubmit)}>
      <LoadingOverlay visible={isLoading} />
      <Paper shadow="md" p="md" withBorder>
        <Stack>
          <Title order={4}>View and Edit Tables</Title>
          <Text size="sm">
            Set user permission to add / edit / delete / view records:
          </Text>

          <Grid>
            <Grid.Col span={12} sm={3}>
              <Text weight={600}>Table</Text>
            </Grid.Col>

            {/* "View All" Checkbox */}
            <Grid.Col span={6} sm={2}>
              <Checkbox
                label="View All"
                checked={tables.every(
                  (table) => permissionValues?.[table.name]?.view
                )}
                onChange={(e) => toggleAll("view", e.currentTarget.checked)}
              />
            </Grid.Col>

            {/* "Add All" Checkbox */}
            <Grid.Col span={6} sm={2}>
              <Checkbox
                label="Add All"
                checked={tables.every(
                  (table) => permissionValues?.[table.name]?.add
                )}
                onChange={(e) => toggleAll("add", e.currentTarget.checked)}
              />
            </Grid.Col>

            {/* "Edit All" Checkbox */}
            <Grid.Col span={6} sm={2}>
              <Checkbox
                label="Edit All"
                checked={tables.every(
                  (table) => permissionValues?.[table.name]?.edit
                )}
                onChange={(e) => toggleAll("edit", e.currentTarget.checked)}
              />
            </Grid.Col>

            {/* "Delete All" Checkbox */}
            <Grid.Col span={6} sm={2}>
              <Checkbox
                label="Delete All"
                checked={tables.every(
                  (table) => permissionValues?.[table.name]?.delete
                )}
                onChange={(e) => toggleAll("delete", e.currentTarget.checked)}
              />
            </Grid.Col>
          </Grid>

          <Divider />

          {tables.map((table) => (
            <Grid key={table.name}>
              <Grid.Col span={12} sm={3}>
                <Text>{table.label}</Text>
              </Grid.Col>

              <Grid.Col span={6} sm={2}>
                <Controller
                  name={`privileges.${table.name}.view`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label="View"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                    />
                  )}
                />
              </Grid.Col>

              <Grid.Col span={6} sm={2}>
                <Controller
                  name={`privileges.${table.name}.add`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label="Add"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                    />
                  )}
                />
              </Grid.Col>

              <Grid.Col span={6} sm={2}>
                <Controller
                  name={`privileges.${table.name}.edit`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label="Edit"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                    />
                  )}
                />
              </Grid.Col>

              <Grid.Col span={6} sm={2}>
                <Controller
                  name={`privileges.${table.name}.delete`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label="Delete"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                    />
                  )}
                />
              </Grid.Col>
            </Grid>
          ))}

          <Divider />

          <Group>
            <Button fullWidth type="submit">
              Save Privileges
            </Button>
          </Group>
        </Stack>
      </Paper>
    </form>
  );
};

export default PrivilegesSecurityPanel;
