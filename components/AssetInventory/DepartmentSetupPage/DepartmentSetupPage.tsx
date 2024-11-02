import { checkUniqueValue, getDepartmentList } from "@/backend/api/get";
import { createDataDrawer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { InventoryAssetFormValues, SecurityGroupData } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DepartmentDrawer from "./DepartmentDrawer";

export type Department = {
  team_department_id: string;
  team_department_name: string;
};

type FormValues = {
  search: string;
  department_name: string;
};
type Props = {
  securityGroup: SecurityGroupData;
};
const DepartmentSetupPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentDepartment, setCurrentDepartment] = useState<Department[]>([]);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const canAddData = securityGroup.privileges.department.add === true;

  // Initialize React Hook Form with default values for the drawer
  const formMethods = useForm<FormValues>({
    defaultValues: {
      department_name: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage]);

  const handleFetchDepartmentList = async (page: number) => {
    try {
      const { search } = getValues();
      const { data, totalCount } = await getDepartmentList(supabaseClient, {
        search,
        limit: ROW_PER_PAGE,
        page,
      });
      setCurrentDepartment(data);
      setDepartmentCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Someting went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(1);
      await handleFetchDepartmentList(1);
    } catch (e) {
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(page);
      await handleFetchDepartmentList(page);
    } catch (e) {
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handleDepartmentSubmit = async (data: InventoryAssetFormValues) => {
    try {
      if (!activeTeam.team_id || !canAddData) return;
      const checkIfUniqueValue = await checkUniqueValue(supabaseClient, {
        type: "team_department",
        typeValue: data.site_name?.trim() || "",
      });
      if (checkIfUniqueValue) {
        notifications.show({
          message: "Site already exist",
          color: "red",
        });
        return;
      }
      const result = await createDataDrawer(supabaseClient, {
        type: "department",
        InventoryFormValues: data,
        teamId: activeTeam.team_id,
      });

      const newData = {
        team_department_id: result.result_id,
        team_department_name: result.result_name,
      };

      setCurrentDepartment((prev) => [...prev, newData]);

      notifications.show({
        message: "Category added successfully",
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={3}>List of Departments</Title>
        <Text>
          This is the list of Departments currently in the system, including
          their descriptions and available actions. You can edit or delete each
          site as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by department name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
            {canAddData && (
              <Button leftIcon={<IconPlus size={16} />} onClick={open}>
                Add New Department
              </Button>
            )}
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <DepartmentDrawer
            handleDepartmentSubmit={handleDepartmentSubmit}
            isOpen={opened}
            close={close}
          />
        </FormProvider>

        <DataTable
          fontSize={16}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="team_department_id"
          page={activePage}
          totalRecords={departmentCount}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentDepartment}
          fetching={isFetchingSiteList}
          columns={[
            {
              accessor: "team_department_id",
              width: "90%",
              title: "Department Name",
              render: (department) => (
                <Text fw={600}>{department.team_department_name}</Text>
              ),
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default DepartmentSetupPage;
