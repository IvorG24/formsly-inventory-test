import { getJobTitleList } from "@/backend/api/get";
import { createJobTitle } from "@/backend/api/post";
import { updateJobTitle } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { getPagination } from "@/utils/functions";
import {
  JobTitleTableInsert,
  JobTitleTableRow,
  JobTitleTableUpdate,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconPlus,
  IconReload,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import JobTitleLookupForm from "./JobTitleLookupForm";

const JobTitleLookupTable = () => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const [isLoading, setIsLoading] = useState(false);
  const [openJobTitleLookupFormModal, setOpenJobTitleLookupFormModal] =
    useState(false);
  const [isUpdatingJobTitle, setIsUpdatingJobTitle] = useState(false);
  const [jobTitleList, setJobTitleList] = useState<JobTitleTableRow[]>([]);
  const [jobTitleListCount, setJobTitleListCount] = useState(0);
  const [activePage, setActivePage] = useState(1);

  const searchJobTitleFormMethods = useForm<{ search: string }>();
  const updateOrCreateJobTitle = useForm<
    JobTitleTableInsert | JobTitleTableUpdate
  >();

  const handleFetchJobTitleList = async ({
    index,
    search,
  }: {
    index: number;
    search?: string;
  }) => {
    const { from, to } = getPagination(index, ROW_PER_PAGE);
    const jiraJobListData = await getJobTitleList(supabaseClient, {
      from,
      to,
      search,
    });

    return jiraJobListData;
  };

  const handleSearchJiraJobList = async (data: { search: string }) => {
    try {
      setIsLoading(true);

      const { data: jobTitleList, count } = await handleFetchJobTitleList({
        index: 0,
        search: data.search,
      });

      setJobTitleList(jobTitleList);
      setJobTitleListCount(count);
    } catch (error) {
      console.error(error);
      notifications.show({
        message: "Failed to fetch job title list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsLoading(true);
      setActivePage(page);

      const { data, count } = await handleFetchJobTitleList({
        index: page - 1,
        search: searchJobTitleFormMethods.getValues().search,
      });

      setJobTitleList(data);
      setJobTitleListCount(count);
    } catch (error) {
      console.error(error);
      notifications.show({
        message: "Failed to fetch job title list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrCreateJobTitle = async (
    data: JobTitleTableInsert | JobTitleTableUpdate
  ) => {
    try {
      const formattedData = {
        ...data,
        employee_job_title_label: data.employee_job_title_label?.toUpperCase(),
      };
      if (isUpdatingJobTitle) {
        setIsUpdatingJobTitle(false);
        await updateJobTitle(supabaseClient, formattedData);
      } else {
        const { error } = await createJobTitle(
          supabaseClient,
          formattedData as JobTitleTableInsert
        );

        if (error) {
          notifications.show({
            message: `${error}`,
            color: "red",
          });
          return;
        }
      }

      notifications.show({
        message: `Successfully ${
          isUpdatingJobTitle ? "updated" : "created"
        } job title.`,
        color: "green",
      });

      setOpenJobTitleLookupFormModal(false);
      updateOrCreateJobTitle.reset();
    } catch (error) {
      console.error(error);
      notifications.show({
        message: `Failed to ${
          isUpdatingJobTitle ? "update" : "create"
        } job title.`,
        color: "red",
      });
    }
  };

  useEffect(() => {
    const fetchJobList = async () => {
      await handlePagination(1);
    };

    fetchJobList();
  }, []);

  return (
    <Box>
      <Paper p="xl" shadow="xs" pos="relative">
        <Flex justify="space-between" align="center">
          <Group>
            <Title order={3}>Job Title List</Title>
            <form
              onSubmit={searchJobTitleFormMethods.handleSubmit(
                handleSearchJiraJobList
              )}
            >
              <TextInput
                miw={250}
                maxLength={4000}
                placeholder="Job Title"
                rightSection={
                  <ActionIcon
                    onClick={() =>
                      handleSearchJiraJobList(
                        searchJobTitleFormMethods.getValues()
                      )
                    }
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                }
                {...searchJobTitleFormMethods.register("search")}
              />
            </form>
            <Button
              variant="light"
              leftIcon={<IconReload size={16} />}
              onClick={() => handlePagination(activePage)}
            >
              Refresh
            </Button>
          </Group>

          <Button
            size="xs"
            leftIcon={<IconPlus size={14} />}
            onClick={() => {
              setOpenJobTitleLookupFormModal(true);
              setIsUpdatingJobTitle(false);
            }}
          >
            Add Job Title
          </Button>
        </Flex>
        <DataTable
          mt="xs"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={390}
          idAccessor="employee_job_title_id"
          totalRecords={jobTitleListCount}
          recordsPerPage={ROW_PER_PAGE}
          page={activePage}
          onPageChange={handlePagination}
          records={jobTitleList}
          fetching={isLoading}
          columns={[
            {
              accessor: "employee_job_title_label",
              title: "Job Title",
              render: ({ employee_job_title_label }) =>
                employee_job_title_label,
            },
            {
              accessor: "employee_job_title_id",
              title: "Action",
              width: 80,
              render: ({ employee_job_title_id, employee_job_title_label }) => (
                <ActionIcon
                  onClick={() => {
                    setOpenJobTitleLookupFormModal(true);
                    setIsUpdatingJobTitle(true);
                    updateOrCreateJobTitle.setValue(
                      "employee_job_title_id",
                      employee_job_title_id
                    );
                    updateOrCreateJobTitle.setValue(
                      "employee_job_title_label",
                      employee_job_title_label
                    );
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              ),
            },
          ]}
        />
      </Paper>
      <FormProvider {...updateOrCreateJobTitle}>
        <JobTitleLookupForm
          opened={openJobTitleLookupFormModal}
          close={() => {
            setOpenJobTitleLookupFormModal(false);
            updateOrCreateJobTitle.reset();
          }}
          onSubmit={handleUpdateOrCreateJobTitle}
          isLoading={isLoading}
          isUpdate={isUpdatingJobTitle}
        />
      </FormProvider>
    </Box>
  );
};

export default JobTitleLookupTable;
