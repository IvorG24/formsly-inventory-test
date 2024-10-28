import { updateFormGroup, updateFormSigner } from "@/backend/api/update";
import { ROW_PER_PAGE, UNHIDEABLE_FORMLY_FORMS } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  InitialFormType,
  TeamGroupTableRow,
  TeamMemberWithUserType,
  TeamProjectTableRow,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  checkIfTeamGroupMember,
  getProjectSigner,
  getTeamDepartmentOptions,
  getTeamProjectList,
} from "@/backend/api/get";
import { useFormActions, useFormList } from "@/stores/useFormStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { isEmpty, isEqual } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import GroupSection from "../FormBuilder/GroupSection";
import SignerPerProject from "../FormBuilder/SignerPerProject";
import SignerSection, { RequestSigner } from "../FormBuilder/SignerSection";
import FormDepartmentSignerSection from "./FormDepartmentSignerSection/FormDepartmentSignerSection";
import FormDetailsSection from "./FormDetailsSection";
import FormRequesterSignerSection from "./FormRequesterSignerSection/FormRequesterSignerSection";
import FormSectionList from "./FormSectionList";

type Props = {
  form: InitialFormType;
  teamMemberList: TeamMemberWithUserType[];
  teamGroupList: TeamGroupTableRow[];
  teamProjectList: TeamProjectTableRow[];
  teamProjectListCount: number;
  isFormslyForm: boolean;
};

type SelectedProject = {
  projectName: string;
  projectId: string;
};

const RequestFormPage = ({
  form,
  teamMemberList,
  teamGroupList,
  teamProjectList,
  teamProjectListCount,
  isFormslyForm,
}: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();

  const formId = form.form_id;
  const teamMember = useUserTeamMember();
  const formList = useFormList();
  const team = useActiveTeam();
  const { setFormList } = useFormActions();

  const initialSignerIds: string[] = [];
  const [activeSigner, setActiveSigner] = useState<number | null>(null);
  const [isSavingSigners, setIsSavingSigners] = useState(false);
  const [initialSigners, setIntialSigners] = useState(
    form.form_signer.map((signer) => {
      initialSignerIds.push(signer.signer_team_member.team_member_id);
      const requestSigner = {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: formId,
      } as RequestSigner;
      return requestSigner;
    })
  );

  const [initialRequester, setInitialRequester] = useState(
    form.form_team_group.map((group) => group.team_group.team_group_id)
  );
  const [initialGroupBoolean, setInitialGroupBoolean] = useState(
    form.form_is_for_every_member
  );
  const [isSavingRequester, setIsSavingRequester] = useState(false);

  const [isGroupMember, setIsGroupMember] = useState(false);

  const [projectPage, setProjectPage] = useState(1);
  const [isFetchingProject, setIsFetchingProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectList, setProjectList] = useState(teamProjectList);
  const [projectCount, setProjectCount] = useState(teamProjectListCount);
  const [selectedProject, setSelectedProject] =
    useState<SelectedProject | null>(null);
  const [selectedProjectSigner, setSelectedProjectSigner] = useState<
    RequestSigner[]
  >([]);
  const [isFetchingProjectSigner, setIsFetchingProjectSigner] = useState(false);
  const [departmentOptionList, setDepartmentOptionList] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const checkIfMember = async () => {
      if (teamMember) {
        const isMember = await checkIfTeamGroupMember(supabaseClient, {
          teamMemberId: teamMember.team_member_id,
          groupId: form.form_team_group.map(
            (group) => group.team_group.team_group_id
          ),
        });
        setIsGroupMember(isMember);
      }
    };
    checkIfMember();
  }, [teamMember]);

  const signerMethods = useForm<{
    signers: RequestSigner[];
    isSignatureRequired: boolean;
  }>();

  const requesterMethods = useForm<{
    groupList: string[];
    isForEveryone: boolean;
  }>({
    defaultValues: {
      groupList: form.form_team_group.map(
        (group) => group.team_group.team_group_id
      ),
      isForEveryone: form.form_is_for_every_member,
    },
  });

  const watchGroup = requesterMethods.watch("groupList");

  useEffect(() => {
    const initialRequestSigners = form.form_signer.map((signer) => {
      return {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: formId,
      };
    });
    signerMethods.setValue("signers", initialRequestSigners);
  }, [form]);

  const handleSaveSigners = async () => {
    const values = signerMethods.getValues();
    const primarySigner = values.signers.filter(
      (signer) => signer.signer_is_primary_signer
    );
    if (isEmpty(primarySigner)) {
      notifications.show({
        message: "There must be atleast one primary signer.",
        color: "orange",
      });
      return;
    }

    setIsSavingSigners(true);
    try {
      await updateFormSigner(supabaseClient, {
        signers: values.signers.map((signer) => {
          return { ...signer, signer_is_disabled: false };
        }),
        selectedProjectId: null,
        formId,
      });
      setIntialSigners(values.signers);
      notifications.show({
        message: "Signers updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    setIsSavingSigners(false);
  };

  const handleSaveRequesters = async () => {
    const values = requesterMethods.getValues();

    setIsSavingRequester(true);
    try {
      await updateFormGroup(supabaseClient, {
        formId,
        groupList: values.groupList,
        isForEveryone: values.isForEveryone,
      });
      setInitialRequester(values.groupList);
      setInitialGroupBoolean(values.isForEveryone);

      const isStillMember = await checkIfTeamGroupMember(supabaseClient, {
        teamMemberId: `${teamMember?.team_member_id}`,
        groupId: values.groupList,
      });

      if (isStillMember !== isGroupMember) {
        const newForm = formList.map((form) => {
          if (form.form_id !== formId) return form;
          return { ...form, form_is_hidden: !isStillMember };
        });
        setFormList(newForm);
      }
      setIsGroupMember(isStillMember);

      notifications.show({
        message: "Requesters updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    setIsSavingRequester(false);
  };

  const handleFetchProject = async (page: number, search: string) => {
    try {
      setIsFetchingProject(true);
      const { data, count } = await getTeamProjectList(supabaseClient, {
        teamId: team.team_id,
        page: page,
        limit: ROW_PER_PAGE,
        search,
      });
      setProjectList(data);
      setProjectCount(count ?? 0);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingProject(false);
    }
  };

  const handleFetchProjectSigner = async (
    projectId: string,
    projectName: string
  ) => {
    try {
      setSelectedProject(null);
      setIsFetchingProjectSigner(true);
      const data = await getProjectSigner(supabaseClient, {
        projectId,
        formId: `${formId}`,
      });
      setSelectedProjectSigner(data);
      setSelectedProject({
        projectId,
        projectName,
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingProjectSigner(false);
    }
  };

  useEffect(() => {
    const fetchDepartmentOptionList = async () => {
      const departmentList = await getTeamDepartmentOptions(supabaseClient, {
        index: 1,
        limit: 124,
      });

      setDepartmentOptionList(
        departmentList.map((d) => ({
          value: d.team_department_id,
          label: d.team_department_name,
        }))
      );
    };
    fetchDepartmentOptionList();
  }, []);

  return (
    <Container>
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          Form Preview
        </Title>
        <Group>
          <Button
            onClick={async () =>
              await router.push({
                pathname: `/${formatTeamNameToUrlKey(
                  team.team_name
                )}/dashboard/`,
                query: { ...router.query, formId },
              })
            }
            variant="light"
          >
            Analytics
          </Button>

          {(form.form_is_formsly_form &&
            !UNHIDEABLE_FORMLY_FORMS.includes(form.form_name) &&
            (isGroupMember || initialGroupBoolean)) ||
          (!form.form_is_formsly_form &&
            (isGroupMember || initialGroupBoolean)) ? (
            <Button
              onClick={async () =>
                await router.push(
                  `/${formatTeamNameToUrlKey(
                    team.team_name
                  )}/forms/${formId}/create`
                )
              }
            >
              Create Request
            </Button>
          ) : null}
        </Group>
      </Flex>
      <Stack spacing="xl" mt="xl">
        <FormDetailsSection form={form} />

        <FormSectionList formId={form.form_id} formName={form.form_name} />

        <Paper p="xl" shadow="xs">
          <Title order={3}>Requester Details</Title>
          <Space h="xl" />
          <FormProvider {...requesterMethods}>
            <GroupSection
              teamGroupList={teamGroupList.map((group) => {
                return {
                  label: group.team_group_name,
                  value: group.team_group_id,
                };
              })}
            />
          </FormProvider>

          {(!isEqual(initialRequester, watchGroup) ||
            !isEqual(
              initialGroupBoolean,
              requesterMethods.getValues("isForEveryone")
            )) &&
          (requesterMethods.getValues("isForEveryone") ||
            (!requesterMethods.getValues("isForEveryone") &&
              requesterMethods.getValues("groupList").length !== 0)) ? (
            <Center mt="xl">
              <Button
                loading={isSavingRequester}
                onClick={handleSaveRequesters}
              >
                Save Changes
              </Button>
            </Center>
          ) : null}
        </Paper>

        <Paper p="xl" shadow="xs">
          <Title order={3}>
            {form.form_is_formsly_form ? "Default Signer" : "Signer Details"}
          </Title>
          <Space h="xl" />
          <FormProvider {...signerMethods}>
            <SignerSection
              teamMemberList={teamMemberList}
              formId={formId}
              activeSigner={activeSigner}
              onSetActiveSigner={setActiveSigner}
              initialSignerIds={initialSignerIds}
            />
          </FormProvider>

          {!isEqual(initialSigners, signerMethods.getValues("signers")) &&
          activeSigner === null ? (
            <Center mt="xl">
              <Button loading={isSavingSigners} onClick={handleSaveSigners}>
                Save Changes
              </Button>
            </Center>
          ) : null}
        </Paper>

        {isFormslyForm && form.form_name !== "Audit" && (
          <>
            <Paper p="xl" shadow="xs">
              <Title order={3}>Signer Per Project</Title>
              <Space h="xl" />

              <Group>
                <Title m={0} p={0} order={3}>
                  List of Projects
                </Title>
                <TextInput
                  miw={250}
                  placeholder="Project"
                  rightSection={
                    <ActionIcon
                      onClick={() => handleFetchProject(1, projectSearch)}
                    >
                      <IconSearch size={16} />
                    </ActionIcon>
                  }
                  value={projectSearch}
                  onChange={async (e) => {
                    setProjectSearch(e.target.value);
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      handleFetchProject(1, projectSearch);
                    }
                  }}
                  maxLength={4000}
                />
              </Group>

              <DataTable
                idAccessor="team_project_id"
                mt="xs"
                withBorder
                fw="bolder"
                c="dimmed"
                minHeight={390}
                fetching={isFetchingProject}
                records={projectList}
                columns={[
                  {
                    accessor: "team_project_name",
                    title: "Project",
                    render: ({ team_project_name, team_project_id }) => (
                      <Text
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleFetchProjectSigner(
                            team_project_id,
                            team_project_name
                          )
                        }
                      >
                        {team_project_name}
                      </Text>
                    ),
                  },
                ]}
                totalRecords={projectCount}
                recordsPerPage={ROW_PER_PAGE}
                page={projectPage}
                onPageChange={(page: number) => {
                  setProjectPage(page);
                  handleFetchProject(page, projectSearch);
                }}
              />
            </Paper>
            <Paper p="xl" shadow="xs" pos="relative">
              <LoadingOverlay
                visible={isFetchingProjectSigner}
                overlayBlur={2}
              />
              {!selectedProject ? (
                <Center>
                  <Text color="dimmed">No project selected</Text>
                </Center>
              ) : null}
              {selectedProject ? (
                <Box>
                  <SignerPerProject
                    teamMemberList={teamMemberList}
                    formId={form.form_id}
                    formSigner={selectedProjectSigner}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                  />
                </Box>
              ) : null}
            </Paper>
            {selectedProject && (
              <FormDepartmentSignerSection
                formId={form.form_id}
                selectedProjectId={selectedProject.projectId}
                teamMemberList={teamMemberList}
                departmentOptionList={departmentOptionList}
              />
            )}

            <FormRequesterSignerSection formId={form.form_id} />
          </>
        )}
      </Stack>
    </Container>
  );
};

export default RequestFormPage;
