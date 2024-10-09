import { getFormDepartmentSigner } from "@/backend/api/get";
import { createDepartmentSigner } from "@/backend/api/post";
import {
  removeDepartmentSigner,
  updateDepartmentSigner,
} from "@/backend/api/update";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  DepartmentSigner,
  SignerTableInsert,
  SignerTableUpdate,
  TeamMemberWithUserType,
} from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Button,
  Center,
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
  IconReload,
  IconSearch,
  IconSettings,
  IconTrashFilled,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FormDepartmentSignerForm from "./FormDepartmentSignerForm";

type Props = {
  formId: string;
  selectedProjectId: string;
  teamMemberList: TeamMemberWithUserType[];
  departmentOptionList: { value: string; label: string }[];
};

type FormValues = SignerTableInsert | SignerTableUpdate;

const FormDepartmentSignerSection = ({
  formId,
  selectedProjectId,
  teamMemberList,
  departmentOptionList,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const [departmentSignerList, setDepartmentSignerList] = useState<
    DepartmentSigner[]
  >([]);
  const [departmentSignerCount, setDepartmentSignerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [openDepartmentSignerForm, setOpenDepartmentSignerForm] =
    useState(false);
  const [isUpdatingDepartmentSigner, setIsUpdatingDepartmentSigner] =
    useState(false);

  const submitDepartmentSignerFormMethods = useForm<FormValues>();
  const { setValue, reset: resetDepartmentSignerForm } =
    submitDepartmentSignerFormMethods;

  const memberWithApproverRoleList = teamMemberList.filter(
    (member) => member.team_member_role !== "MEMBER"
  );
  const signerOptionList = memberWithApproverRoleList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const handleSubmitDepartmentSigner = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (isUpdatingDepartmentSigner) {
        await updateDepartmentSigner(supabaseClient, data);

        setIsUpdatingDepartmentSigner(false);
      } else {
        const signerOrder = departmentSignerList.filter(
          (dept) =>
            dept.signer_team_department_id === data.signer_team_department_id
        ).length;
        const newSigner = await createDepartmentSigner(supabaseClient, {
          ...(data as SignerTableInsert),
          signer_team_project_id: selectedProjectId,
          signer_form_id: formId,
          signer_order: signerOrder + 1,
          signer_action: `${data.signer_action ?? ""}`.toLocaleUpperCase(),
        });

        if (!newSigner) {
          notifications.show({
            message: "Department already has a primary signer.",
            color: "red",
          });
          return;
        }
      }
      handleFetchDepartmentSignerList(activePage, "");
      setOpenDepartmentSignerForm(false);
      resetDepartmentSignerForm();
      notifications.show({
        message: `Successfully ${
          isUpdatingDepartmentSigner ? "updated" : "created"
        } department signer`,
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: `Failed to ${
          isUpdatingDepartmentSigner ? "update" : "create"
        } department signer`,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchDepartmentSignerList = async (
    page: number,
    search: string
  ) => {
    try {
      setActivePage(page);
      setIsLoading(true);
      const { data, count } = await getFormDepartmentSigner(supabaseClient, {
        formId: formId,
        projectId: selectedProjectId,
        page,
        search,
        limit: ROW_PER_PAGE,
      });
      const dataWithTeamMemberUser = data.map((signer) => {
        const teamMemberMatch = teamMemberList.find(
          (member) => member.team_member_id === signer.signer_team_member_id
        );
        const departmentMatch = departmentOptionList.find(
          (option) => option.value === signer.signer_team_department_id
        );

        if (!teamMemberMatch || !departmentMatch) return signer;

        return {
          ...signer,
          team_member_user: teamMemberMatch.team_member_user,
          team_department_name: departmentMatch.label,
        };
      });
      setDepartmentSignerList(dataWithTeamMemberUser as DepartmentSigner[]);
      setDepartmentSignerCount(count ?? 0);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDepartmentSigner = async (signerId: string) =>
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          Are you sure you would like to remove this signer?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      onConfirm: async () => {
        try {
          await removeDepartmentSigner(supabaseClient, signerId);
          notifications.show({
            message: "Successfully removed department signer.",
            color: "green",
          });
          setDepartmentSignerList((prev) =>
            prev.filter((signer) => signer.signer_id !== signerId)
          );
        } catch (e) {
          notifications.show({
            message: "Failed to remove department signer.",
            color: "red",
          });
        }
      },
      confirmProps: { color: "red" },
    });

  useEffect(() => {
    const fetchDepartmentSignerList = async () => {
      await handleFetchDepartmentSignerList(1, "");
    };
    fetchDepartmentSignerList();
  }, []);

  return (
    <Paper p="xl" shadow="xs">
      <Group position="apart">
        <Flex gap="md" align="center">
          <Title order={3}>List of Department Signers</Title>
          <TextInput
            miw={150}
            placeholder="Department"
            rightSection={
              <ActionIcon
                onClick={() =>
                  handleFetchDepartmentSignerList(1, departmentSearch)
                }
              >
                <IconSearch size={16} />
              </ActionIcon>
            }
            value={departmentSearch}
            onChange={async (e) => {
              setDepartmentSearch(e.target.value);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleFetchDepartmentSignerList(1, departmentSearch);
              }
            }}
            maxLength={4000}
          />
          <Button
            variant="light"
            leftIcon={<IconReload size={16} />}
            onClick={() =>
              handleFetchDepartmentSignerList(activePage, departmentSearch)
            }
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <Button onClick={() => setOpenDepartmentSignerForm(true)}>
          + Add Department Signer
        </Button>
      </Group>

      <DataTable
        idAccessor="signer_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={departmentSignerList}
        columns={[
          {
            accessor: "signer_team_department_id",
            title: "Department",
            render: ({ team_department_name }) => (
              <Text>{team_department_name}</Text>
            ),
          },
          {
            accessor: "signer_team_member_id",
            title: "Signer",
            render: ({
              team_member_user: { user_first_name, user_last_name },
              signer_is_primary_signer,
            }) => (
              <Flex gap="sm">
                <Text>{`${user_first_name} ${user_last_name}`}</Text>
                {signer_is_primary_signer && (
                  <Badge color="green">Primary</Badge>
                )}
              </Flex>
            ),
          },
          {
            accessor: "signer_action",
            title: "Signer Action",
            render: ({ signer_action }) => <Text>{signer_action}</Text>,
          },
          {
            accessor: "signer_id",
            title: "Action",
            textAlignment: "center",
            render: ({
              signer_id,
              signer_action,
              signer_is_primary_signer,
              signer_team_department_id,
              signer_team_member_id,
            }) => (
              <Center>
                <ActionIcon
                  onClick={() => {
                    setIsUpdatingDepartmentSigner(true);
                    setOpenDepartmentSignerForm(true);
                    setValue("signer_id", signer_id);
                    setValue(
                      "signer_team_department_id",
                      signer_team_department_id
                    );
                    setValue("signer_team_member_id", signer_team_member_id);
                    setValue(
                      "signer_action",
                      signer_action.toLocaleUpperCase()
                    );
                    setValue(
                      "signer_is_primary_signer",
                      signer_is_primary_signer
                    );
                  }}
                >
                  <IconSettings size={16} />
                </ActionIcon>
                <ActionIcon
                  color="red"
                  onClick={() => handleRemoveDepartmentSigner(signer_id)}
                >
                  <IconTrashFilled size={16} />
                </ActionIcon>
              </Center>
            ),
          },
        ]}
        totalRecords={departmentSignerCount}
        recordsPerPage={ROW_PER_PAGE}
        page={activePage}
        onPageChange={(page: number) => {
          handleFetchDepartmentSignerList(page, departmentSearch);
        }}
      />
      {openDepartmentSignerForm && (
        <FormProvider {...submitDepartmentSignerFormMethods}>
          <FormDepartmentSignerForm
            opened={openDepartmentSignerForm}
            onSubmit={handleSubmitDepartmentSigner}
            close={() => {
              resetDepartmentSignerForm();
              setOpenDepartmentSignerForm(false);
              setIsUpdatingDepartmentSigner(false);
            }}
            isLoading={isLoading}
            departmentOptionList={departmentOptionList}
            signerOptionList={signerOptionList}
          />
        </FormProvider>
      )}
    </Paper>
  );
};

export default FormDepartmentSignerSection;
