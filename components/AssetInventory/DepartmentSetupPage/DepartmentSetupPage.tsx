import { getDepartmentList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
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
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DepartmentDrawer, { DepartmentFormvalues } from "./DepartmentDrawer";

export type Department = {
  team_department_id: string;
  team_department_name: string;
};

type FormValues = {
  search: string;
  department_name: string;
};

const DepartmentSetupPage = () => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentDepartment, setCurrentDepartment] = useState<Department[]>([]);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  // Initialize React Hook Form with default values for the drawer
  const formMethods = useForm<FormValues>({
    defaultValues: {
      department_name: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);

  const handleFetchDepartmentList = async (page: number) => {
    const { search } = getValues();

    const data = await getDepartmentList(supabaseClient, {
      search,
      limit: ROW_PER_PAGE,
      page,
    });
    console.log(data);

    setCurrentDepartment(data);
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(1);
      await handleFetchDepartmentList(1);
    } catch (e) {
      console.error("Error fetching filtered sites:", e);
    } finally {
      setIsFetchingSiteList(false); // Hide loading state
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(page);
      await handleFetchDepartmentList(page);
    } catch (e) {
      console.error("Error fetching paginated sites:", e);
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handleEdit = (site_id: string) => {
    console.log("Edit site with ID:", site_id);
  };

  const handleDelete = (site_id: string) => {
    console.log("Delete site with ID:", site_id);
  };

  const handleDepartmentSubmit = async (data: DepartmentFormvalues) => {
    try {
      //site logic put here
      close();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Departments</Title>
        <Text>
          This is the list of Departments currently in the system, including
          their descriptions and available actions. You can edit or delete each
          site as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by site name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Department
            </Button>
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
          idAccessor="department_id"
          page={activePage}
          totalRecords={currentDepartment.length}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentDepartment}
          fetching={isFetchingSiteList}
          columns={[
            {
              accessor: "department_id",
              width: "90%",
              title: "Department Name",
              render: (department) => (
                <Text>{department.team_department_name}</Text>
              ),
            },
            {
              accessor: "actions",
              title: "Actions",
              render: (department) => (
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(department.team_department_id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(department.team_department_id)}
                  >
                    Delete
                  </Button>
                </Group>
              ),
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default DepartmentSetupPage;
