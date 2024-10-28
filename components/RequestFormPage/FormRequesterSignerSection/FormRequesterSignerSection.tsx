import { removeRequesterSigner } from "@/backend/api/delete";
import { getRequesterPrimarySignerList } from "@/backend/api/get";
import { createRequesterPrimarySigner, insertError } from "@/backend/api/post";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useUserProfile } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import {
  RequesterPrimarySignerFormValues,
  RequesterPrimarySignerType,
} from "@/utils/types";
import {
  ActionIcon,
  Button,
  Center,
  Flex,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconReload, IconSearch, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import FormRequesterSignerForm from "./FormRequesterSignerForm";

type Props = {
  formId: string;
};

const FormRequesterSignerSection = ({ formId }: Props) => {
  const teamMemberList = useTeamMemberList();
  const user = useUserProfile();
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [openRequesterSignerForm, setOpenRequesterSignerForm] = useState(false);
  const [isUpdatingRequesterSigner, setIsUpdatingRequesterSigner] =
    useState(false);
  const [requestSignerList, setRequestSignerList] = useState<
    RequesterPrimarySignerType[]
  >([]);
  const [requestSignerCount, setRequestSignerCount] = useState(0);

  const requesterPrimarySignerFormMethods =
    useForm<RequesterPrimarySignerFormValues>();
  const { reset } = requesterPrimarySignerFormMethods;

  const handleCreateRequesterPrimarySigner = async (
    data: RequesterPrimarySignerFormValues
  ) => {
    try {
      setIsLoading(true);
      const {
        requester_team_member_id,
        requester_primary_signer_signer_id,
        signer_action,
      } = data;

      await createRequesterPrimarySigner(supabaseClient, {
        formId,
        requesterTeamMemberId: requester_team_member_id,
        signerTeamMemberId: requester_primary_signer_signer_id,
        signerAction: signer_action,
      });

      const temp_requester_primary_signer_signer_id = uuidv4();
      const tempNewRequesterSignerList = requester_team_member_id.map(
        (requester) => ({
          requester_primary_signer_id: uuidv4(),
          requester_primary_signer_signer_id:
            temp_requester_primary_signer_signer_id,
          requester_team_member_id: requester,
          requester_primary_signer_signer_team_member_id:
            requester_primary_signer_signer_id,
        })
      );

      setRequestSignerList((prev) => [...prev, ...tempNewRequesterSignerList]);
      notifications.show({
        message: "Requester signer created.",
        color: "green",
      });
      handleCloseRequesterSignerForm();
    } catch (error) {
      notifications.show({
        message: `Failed to ${
          isUpdatingRequesterSigner ? "update" : "create"
        } input`,
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleCreateRequesterPrimarySigner",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRequesterSigner = async (
    requester_primary_signer_id: string
  ) => {
    try {
      setIsLoading(true);
      modals.openConfirmModal({
        title: "Please confirm your action",
        children: (
          <Text size="sm">Are you sure you want to remove this signer?</Text>
        ),
        centered: true,
        labels: { confirm: "Confirm", cancel: "Cancel" },
        onConfirm: async () => {
          await removeRequesterSigner(
            supabaseClient,
            requester_primary_signer_id
          );
          notifications.show({
            message: "Requester signer deleted.",
            color: "green",
          });
          setRequestSignerList((prev) =>
            prev.filter(
              (signer) =>
                signer.requester_primary_signer_id !==
                requester_primary_signer_id
            )
          );
        },
        confirmProps: { color: "red" },
      });
    } catch (error) {
      notifications.show({
        message: `Failed to delete requester signer`,
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleRemoveRequesterSigner",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchRequesterSigner = async (activePage: number) => {
    try {
      setIsLoading(true);
      setActivePage(activePage);
      const requestSignerData = await getRequesterPrimarySignerList(
        supabaseClient,
        {
          formId,
          page: activePage,
          search: searchInput,
        }
      );
      setRequestSignerList(requestSignerData.data);
      setRequestSignerCount(requestSignerData.count);
    } catch (error) {
      notifications.show({
        message: "Failed to fetch search signers",
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleFetchRequesterSigner",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseRequesterSignerForm = () => {
    reset();
    setOpenRequesterSignerForm(false);
    setIsUpdatingRequesterSigner(false);
  };

  useEffect(() => {
    handleFetchRequesterSigner(1);
  }, [formId]);

  return (
    <Paper p="xl" shadow="xs">
      <Stack>
        <Title order={3}>List of Requester Signers</Title>
        <Flex justify="space-between" gap="sm">
          <Flex gap="sm" wrap="wrap">
            <TextInput
              miw={300}
              placeholder="Search requester or signer name"
              rightSection={
                <ActionIcon
                // onClick={() =>
                //   handleFetchDepartmentSignerList(1, departmentSearch)
                // }
                >
                  <IconSearch size={16} />
                </ActionIcon>
              }
              value={searchInput}
              onChange={async (e) => {
                setSearchInput(e.target.value);
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  handleFetchRequesterSigner(1);
                }
              }}
              maxLength={4000}
            />
            <Button
              variant="light"
              leftIcon={<IconReload size={16} />}
              onClick={() => handleFetchRequesterSigner(activePage)}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Flex>
          <Button onClick={() => setOpenRequesterSignerForm(true)}>
            + Add Requester Signer
          </Button>
        </Flex>
        <DataTable
          idAccessor="requester_primary_signer_id"
          mt="xs"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={390}
          fetching={isLoading}
          recordsPerPage={ROW_PER_PAGE}
          totalRecords={requestSignerCount}
          page={activePage}
          onPageChange={(page: number) => handleFetchRequesterSigner(page)}
          records={requestSignerList}
          columns={[
            {
              accessor: "requester_team_member_id",
              title: "Requester",
              render: ({ requester_team_member_id }) => {
                const teamMemberData = teamMemberList.find(
                  (member) => member.team_member_id === requester_team_member_id
                );
                if (!teamMemberData) {
                  return <Text>Undefined</Text>;
                }
                const {
                  team_member_user: { user_first_name, user_last_name },
                } = teamMemberData;

                return <Text>{`${user_first_name} ${user_last_name}`}</Text>;
              },
            },
            {
              accessor: "requester_primary_signer_signer_id",
              title: "Approver",
              render: ({ requester_primary_signer_signer_team_member_id }) => {
                const teamMemberData = teamMemberList.find(
                  (member) =>
                    member.team_member_id ===
                    requester_primary_signer_signer_team_member_id
                );
                if (!teamMemberData) {
                  return <Text>Undefined</Text>;
                }
                const {
                  team_member_user: { user_first_name, user_last_name },
                } = teamMemberData;

                return <Text>{`${user_first_name} ${user_last_name}`}</Text>;
              },
            },
            {
              accessor: "requester_primary_signer_id",
              title: "Action",
              width: 100,
              textAlignment: "center",
              render: ({ requester_primary_signer_id }) => (
                <Center>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() =>
                      handleRemoveRequesterSigner(requester_primary_signer_id)
                    }
                  >
                    <IconTrash />
                  </ActionIcon>
                </Center>
              ),
            },
          ]}
        />
      </Stack>
      {openRequesterSignerForm && (
        <FormProvider {...requesterPrimarySignerFormMethods}>
          <FormRequesterSignerForm
            opened={openRequesterSignerForm}
            close={handleCloseRequesterSignerForm}
            isLoading={isLoading}
            isUpdate={isUpdatingRequesterSigner}
            onSubmit={handleCreateRequesterPrimarySigner}
          />
        </FormProvider>
      )}
    </Paper>
  );
};

export default FormRequesterSignerSection;
