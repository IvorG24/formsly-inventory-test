import { deleteJiraProject } from "@/backend/api/delete";
import { getJiraProjectList } from "@/backend/api/get";
import { createJiraProject } from "@/backend/api/post";
import { updateJiraProject } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { getPagination } from "@/utils/functions";
import {
  JiraProjectTableInsert,
  JiraProjectTableRow,
  JiraProjectTableUpdate,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconPlus,
  IconReload,
  IconSearch,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { JiraAutomationFormObject } from "../JiraSettingsPage";
import JiraProjectLookupForm from "./JiraProjectLookupForm";

type Props = {
  jiraProjectData: {
    data: JiraProjectTableRow[];
    count: number;
  };
  jiraAutomationFormData: JiraAutomationFormObject | null;
};

const JiraProjectLookupTable = ({
  jiraProjectData,
  jiraAutomationFormData,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const [isLoading, setIsLoading] = useState(false);
  const [openJiraProjectLookupFormModal, setOpenJiraProjectLookupFormModal] =
    useState(false);
  const [isUpdatingJiraProject, setIsUpdatingJiraProject] = useState(false);
  const [jiraProjectList, setJiraProjectList] = useState(
    jiraProjectData.data.slice(0, ROW_PER_PAGE)
  );
  const [jiraProjectCount, setJiraProjectCount] = useState(
    jiraProjectData.count
  );
  const [activePage, setActivePage] = useState(1);

  const searchJiraProjectFormMethods = useForm<{ search: string }>();
  const updateOrCreateJiraProjectFormMethods =
    useForm<JiraProjectTableUpdate>();

  const handleFetchJiraProjectList = async ({
    index,
    search,
  }: {
    index: number;
    search?: string;
  }) => {
    const { from, to } = getPagination(index, ROW_PER_PAGE);
    const jiraProjectData = await getJiraProjectList(supabaseClient, {
      from,
      to,
      search,
    });

    return jiraProjectData;
  };

  const handleSearchJiraProject = async (data: { search: string }) => {
    try {
      setIsLoading(true);

      const { data: projectList, count } = await handleFetchJiraProjectList({
        index: 0,
        search: data.search,
      });

      setJiraProjectList(projectList);
      setJiraProjectCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch jira project list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsLoading(true);
      setActivePage(page);

      const { data, count } = await handleFetchJiraProjectList({
        index: page - 1,
        search: searchJiraProjectFormMethods.getValues().search,
      });

      setJiraProjectList(data);
      setJiraProjectCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch jira project list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrCreateJiraProject = async (
    data: JiraProjectTableUpdate | JiraProjectTableInsert
  ) => {
    try {
      if (!jiraAutomationFormData) {
        notifications.show({
          message: "Jira Form data is empty. Please contact the dev team.",
          color: "orange",
        });
        return;
      }

      const existingJiraProjectList = jiraAutomationFormData["21"];
      // verify if jira id
      const isValid = existingJiraProjectList.choices?.find(
        (project) => project.id === data.jira_project_jira_id
      );

      if (!isValid) {
        notifications.show({
          message:
            "Jira id not found in current jira project list. Please contact IT.",
          color: "orange",
        });
        return;
      }

      if (isUpdatingJiraProject) {
        setIsUpdatingJiraProject(false);
        await updateJiraProject(supabaseClient, data);
      } else {
        const { error } = await createJiraProject(
          supabaseClient,
          data as JiraProjectTableInsert
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
          isUpdatingJiraProject ? "updated" : "created"
        } jira project.`,
        color: "green",
      });

      setOpenJiraProjectLookupFormModal(false);
      updateOrCreateJiraProjectFormMethods.reset();

      handlePagination(activePage);
    } catch (e) {
      notifications.show({
        message: "Failed to update or create jira project",
        color: "red",
      });
    }
  };

  const handleDeleteJiraProject = async (jiraProjectId: string) => {
    try {
      setIsLoading(true);
      await deleteJiraProject(supabaseClient, jiraProjectId);
      setJiraProjectList((prev) =>
        prev.filter((proj) => proj.jira_project_id !== jiraProjectId)
      );
      setJiraProjectCount((prev) => prev - 1);
    } catch (e) {
      notifications.show({
        message: "Failed to delete jira user.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmDeleteJiraProjectModal = (jira_project_id: string) => {
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          Are you sure you want to delete this jira Project?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: async () => await handleDeleteJiraProject(jira_project_id),
      centered: true,
      confirmProps: { color: "red" },
    });
  };

  return (
    <Box>
      <Paper p="xl" shadow="xs" pos="relative">
        <Flex justify="space-between" align="center">
          <Group>
            <Title order={3}>Jira Projects</Title>

            <form
              onSubmit={searchJiraProjectFormMethods.handleSubmit(
                handleSearchJiraProject
              )}
            >
              <TextInput
                miw={250}
                maxLength={4000}
                placeholder="Project Name"
                rightSection={
                  <ActionIcon
                    onClick={() =>
                      handleSearchJiraProject(
                        searchJiraProjectFormMethods.getValues()
                      )
                    }
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                }
                {...searchJiraProjectFormMethods.register("search")}
              />
            </form>
            <Button
              variant="light"
              leftIcon={<IconReload size={16} />}
              onClick={() => handlePagination(activePage)}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Group>

          <Button
            size="xs"
            leftIcon={<IconPlus size={14} />}
            onClick={() => {
              setOpenJiraProjectLookupFormModal(true);
              setIsUpdatingJiraProject(false);
            }}
          >
            Add Project
          </Button>
        </Flex>
        <DataTable
          mt="xs"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={390}
          idAccessor="jira_project_id"
          totalRecords={jiraProjectCount}
          recordsPerPage={ROW_PER_PAGE}
          page={activePage}
          onPageChange={handlePagination}
          records={jiraProjectList}
          fetching={isLoading}
          columns={[
            {
              accessor: "jira_project_jira_id",
              title: "Project Id",
              render: ({ jira_project_jira_id }) => jira_project_jira_id,
            },
            {
              accessor: "jira_project_jira_label",
              title: "Project Label",
              render: ({ jira_project_jira_label }) => jira_project_jira_label,
            },

            {
              accessor: "jira_project_id",
              title: "Action",
              render: ({
                jira_project_id,
                jira_project_jira_id,
                jira_project_jira_label,
              }) => (
                <Flex>
                  <ActionIcon
                    onClick={() => {
                      setOpenJiraProjectLookupFormModal(true);
                      setIsUpdatingJiraProject(true);
                      updateOrCreateJiraProjectFormMethods.setValue(
                        "jira_project_id",
                        jira_project_id
                      );
                      updateOrCreateJiraProjectFormMethods.setValue(
                        "jira_project_jira_id",
                        jira_project_jira_id
                      );
                      updateOrCreateJiraProjectFormMethods.setValue(
                        "jira_project_jira_label",
                        jira_project_jira_label
                      );
                    }}
                  >
                    <IconSettings size={16} />
                  </ActionIcon>
                  <ActionIcon
                    onClick={() =>
                      openConfirmDeleteJiraProjectModal(jira_project_id)
                    }
                    color="red"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Flex>
              ),
            },
          ]}
        />
      </Paper>
      <FormProvider {...updateOrCreateJiraProjectFormMethods}>
        <JiraProjectLookupForm
          opened={openJiraProjectLookupFormModal}
          close={() => {
            setOpenJiraProjectLookupFormModal(false);
            updateOrCreateJiraProjectFormMethods.reset();
          }}
          onSubmit={handleUpdateOrCreateJiraProject}
          isLoading={isLoading}
          isUpdate={isUpdatingJiraProject}
        />
      </FormProvider>
    </Box>
  );
};

export default JiraProjectLookupTable;
