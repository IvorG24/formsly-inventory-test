import { deleteJiraUser } from "@/backend/api/delete";
import { getJiraUserAccountList } from "@/backend/api/get";
import { createJiraUser } from "@/backend/api/post";
import { updateJiraUser } from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { getPagination } from "@/utils/functions";
import {
  JiraUserAccountTableInsert,
  JiraUserAccountTableRow,
  JiraUserAccountTableUpdate,
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
import JiraUserLookupForm from "./JiraUserLookupForm";

type Props = {
  jiraUserAccountData: {
    data: JiraUserAccountTableRow[];
    count: number;
  };
};

type JiraUserType = {
  self: string;
  accountId: string;
  accountType: string;
  emailAddress: string;
  displayName: string;
  active: true;
  timeZone: string;
  locale: string;
};

const JiraUserLookupTable = ({ jiraUserAccountData }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const [isLoading, setIsLoading] = useState(false);
  const [openJiraUserLookupFormModal, setOpenJiraUserLookupFormModal] =
    useState(false);
  const [isUpdatingJiraUser, setIsUpdatingJiraUser] = useState(false);
  const [jiraUserList, setJiraUserList] = useState(
    jiraUserAccountData.data.slice(0, ROW_PER_PAGE)
  );
  const [jiraUserCount, setJiraUserCount] = useState(jiraUserAccountData.count);
  const [activePage, setActivePage] = useState(1);

  const searchJiraUserFormMethods = useForm<{ search: string }>();
  const updateOrCreateJiraUserFormMethods = useForm<
    JiraUserAccountTableInsert | JiraUserAccountTableUpdate
  >();

  const handleFetchJiraUserList = async ({
    index,
    search,
  }: {
    index: number;
    search?: string;
  }) => {
    const { from, to } = getPagination(index, ROW_PER_PAGE);
    const jiraUserData = await getJiraUserAccountList(supabaseClient, {
      from,
      to,
      search,
    });

    return jiraUserData;
  };

  const handleSearchJiraUser = async (data: { search: string }) => {
    try {
      setIsLoading(true);

      const { data: userList, count } = await handleFetchJiraUserList({
        index: 0,
        search: data.search,
      });

      setJiraUserList(userList);
      setJiraUserCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch jira user list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsLoading(true);
      setActivePage(page);

      const { data, count } = await handleFetchJiraUserList({
        index: page - 1,
        search: searchJiraUserFormMethods.getValues().search,
      });

      setJiraUserList(data);
      setJiraUserCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch jira user list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrCreateJiraProject = async (
    data: JiraUserAccountTableInsert | JiraUserAccountTableUpdate
  ) => {
    try {
      const response = await fetch(
        `/api/jira/get-user?approverEmail=${data.jira_user_account_email_address}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const jiraUserData: JiraUserType[] = await response.json();

      // verify if jira id
      const isValid = jiraUserData.find(
        (user) => user.accountId === data.jira_user_account_jira_id
      );

      if (!isValid) {
        notifications.show({
          message:
            "Jira id not found in current jira user list. Please contact IT.",
          color: "orange",
        });
        return;
      }

      if (isUpdatingJiraUser) {
        setIsUpdatingJiraUser(false);
        await updateJiraUser(supabaseClient, data);
      } else {
        const { error } = await createJiraUser(
          supabaseClient,
          data as JiraUserAccountTableInsert
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
          isUpdatingJiraUser ? "updated" : "created"
        } jira user.`,
        color: "green",
      });

      setOpenJiraUserLookupFormModal(false);
      updateOrCreateJiraUserFormMethods.reset();

      handlePagination(activePage);
    } catch (e) {
      notifications.show({
        message: "Failed to update or create jira user",
        color: "red",
      });
    }
  };

  const handleDeleteJiraUser = async (jiraUserAccountId: string) => {
    try {
      setIsLoading(true);
      await deleteJiraUser(supabaseClient, jiraUserAccountId);
      setJiraUserList((prev) =>
        prev.filter((user) => user.jira_user_account_id !== jiraUserAccountId)
      );
      setJiraUserCount((prev) => prev - 1);
    } catch (e) {
      notifications.show({
        message: "Failed to delete jira user.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmDeleteJiraUserModal = (jiraUserAccountId: string) =>
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">Are you sure you want to delete this jira user?</Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: async () => await handleDeleteJiraUser(jiraUserAccountId),
      centered: true,
      confirmProps: { color: "red" },
    });

  return (
    <Box>
      <Paper p="xl" shadow="xs" pos="relative">
        <Flex justify="space-between" align="center">
          <Group>
            <Title order={3}>Jira Users</Title>
            <form
              onSubmit={searchJiraUserFormMethods.handleSubmit(
                handleSearchJiraUser
              )}
            >
              <TextInput
                miw={250}
                maxLength={4000}
                placeholder="User Name"
                rightSection={
                  <ActionIcon
                    onClick={() =>
                      handleSearchJiraUser(
                        searchJiraUserFormMethods.getValues()
                      )
                    }
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                }
                {...searchJiraUserFormMethods.register("search")}
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
              setOpenJiraUserLookupFormModal(true);
              setIsUpdatingJiraUser(false);
            }}
          >
            Add Users
          </Button>
        </Flex>
        <DataTable
          mt="xs"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={390}
          idAccessor="jira_user_account_id"
          totalRecords={jiraUserCount}
          recordsPerPage={ROW_PER_PAGE}
          page={activePage}
          onPageChange={handlePagination}
          records={jiraUserList}
          fetching={isLoading}
          columns={[
            {
              accessor: "jira_user_account_jira_id",
              title: "Jira Id",
              render: ({ jira_user_account_jira_id }) => (
                <Text maw={320}>{jira_user_account_jira_id}</Text>
              ),
            },
            {
              accessor: "jira_user_account_display_name",
              title: "Display Name",
              render: ({ jira_user_account_display_name }) =>
                jira_user_account_display_name,
            },
            {
              accessor: "jira_user_account_email_address",
              title: "Email",
              render: ({ jira_user_account_email_address }) =>
                jira_user_account_email_address,
            },
            {
              accessor: "jira_user_account_id",
              title: "Action",
              render: ({
                jira_user_account_id,
                jira_user_account_jira_id,
                jira_user_account_display_name,
                jira_user_account_email_address,
              }) => (
                <Flex>
                  <ActionIcon
                    onClick={() => {
                      setOpenJiraUserLookupFormModal(true);
                      setIsUpdatingJiraUser(true);
                      updateOrCreateJiraUserFormMethods.setValue(
                        "jira_user_account_id",
                        jira_user_account_id
                      );
                      updateOrCreateJiraUserFormMethods.setValue(
                        "jira_user_account_jira_id",
                        jira_user_account_jira_id
                      );
                      updateOrCreateJiraUserFormMethods.setValue(
                        "jira_user_account_display_name",
                        jira_user_account_display_name
                      );
                      updateOrCreateJiraUserFormMethods.setValue(
                        "jira_user_account_email_address",
                        jira_user_account_email_address
                      );
                    }}
                  >
                    <IconSettings size={16} />
                  </ActionIcon>
                  <ActionIcon
                    onClick={() =>
                      openConfirmDeleteJiraUserModal(jira_user_account_id)
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
      <FormProvider {...updateOrCreateJiraUserFormMethods}>
        <JiraUserLookupForm
          opened={openJiraUserLookupFormModal}
          close={() => {
            setOpenJiraUserLookupFormModal(false);
            updateOrCreateJiraUserFormMethods.reset();
          }}
          onSubmit={handleUpdateOrCreateJiraProject}
          isLoading={isLoading}
          isUpdate={isUpdatingJiraUser}
        />
      </FormProvider>
    </Box>
  );
};

export default JiraUserLookupTable;
