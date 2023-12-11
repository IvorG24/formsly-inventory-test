import {
  checkIfTeamGroupMember,
  checkRequisitionFormStatus,
  getProjectSigner,
  getTeamProjectList,
} from "@/backend/api/get";
import { updateFormGroup, updateFormSigner } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import {
  EquipmentWithCategoryType,
  FormSegmentType,
  FormType,
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
  SegmentedControl,
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
import { v4 as uuidv4 } from "uuid";

import { useFormActions, useFormList } from "@/stores/useFormStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { FORM_SEGMENT_CHOCIES, ROW_PER_PAGE } from "@/utils/constant";
import { isEmpty, isEqual } from "@/utils/functions";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import GroupSection from "../FormBuilder/GroupSection";
import SignerPerProject from "../FormBuilder/SignerPerProject";
import SignerSection, { RequestSigner } from "../FormBuilder/SignerSection";
import FormDetailsSection from "../RequestFormPage/FormDetailsSection";
import FormSection from "../RequestFormPage/FormSection";
import EquipmentDescription from "./EquipmentDescription/EquipmentDescription";
import CreateEquipment from "./EquipmentList/CreateEquipment";
import EquipmentList from "./EquipmentList/EquipmentList";
import UpdateEquipment from "./EquipmentList/UpdateEquipment";
import EquipmentPart from "./EquipmentPart/EquipmentPart";
import PEDLookup from "./PEDLookup/PEDLookup";

type Props = {
  equipments: EquipmentWithCategoryType[];
  equipmentListCount: number;
  teamMemberList: TeamMemberWithUserType[];
  form: FormType;
  teamGroupList: TeamGroupTableRow[];
  teamProjectList: TeamProjectTableRow[];
  teamProjectListCount: number;
};

const PEDPartFormPage = ({
  equipments,
  equipmentListCount,
  teamMemberList,
  form,
  teamGroupList,
  teamProjectList,
  teamProjectListCount,
}: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const { formId } = router.query;
  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const formList = useFormList();
  const { setFormList } = useFormActions();

  const initialSignerIds: string[] = [];

  const [isCreatingEquipment, setIsCreatingEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentWithCategoryType | null>(null);
  const [editEquipment, setEditEquipment] =
    useState<EquipmentWithCategoryType | null>(null);
  const [equipmentList, setEquipmentList] = useState(equipments);
  const [equipmentCount, setEquipmentCount] = useState(equipmentListCount);

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
        signer_form_id: formId as string,
      } as RequestSigner;
      return requestSigner;
    })
  );

  const [activeSigner, setActiveSigner] = useState<number | null>(null);
  const [segmentValue, setSegmentValue] =
    useState<FormSegmentType>("Form Details");

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
  const [selectedProject, setSelectedProject] = useState<{
    projectName: string;
    projectId: string;
  } | null>(null);
  const [selectedProjectSigner, setSelectedProjectSigner] = useState<
    RequestSigner[]
  >([]);
  const [isFetchingProjectSigner, setIsFetchingProjectSigner] = useState(false);

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
        signer_form_id: `${formId}`,
      };
    });
    signerMethods.setValue("signers", initialRequestSigners);
  }, [form]);

  const newTeamMember = {
    form_team_member: {
      team_member_id: form.form_team_member.team_member_id,
      team_member_user: {
        user_id: uuidv4(),
        user_first_name: "Formsly",
        user_last_name: "",
        user_avatar: "/icon-request-light.svg",
        user_username: "formsly",
      },
    },
  };

  const newForm = {
    ...form,
    ...newTeamMember,
  };

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
        formId: formId as string,
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
        formId: `${formId}`,
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

  const handleFormVisibilityRestriction = async () => {
    try {
      const result = await checkRequisitionFormStatus(supabaseClient, {
        teamId: team.team_id,
        formId: `${formId}`,
      });
      return result;
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
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

  return (
    <Container>
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          Form Preview
        </Title>
        <Group>
          <Button
            onClick={() =>
              router.push({
                pathname: `/team-requests/dashboard/`,
                query: { ...router.query, formId },
              })
            }
            variant="light"
          >
            Analytics
          </Button>

          {isGroupMember || initialGroupBoolean ? (
            <Button
              onClick={() =>
                router.push(`/team-requests/forms/${formId}/create`)
              }
            >
              Create Request
            </Button>
          ) : null}
        </Group>
      </Flex>
      <Space h="xl" />
      <FormDetailsSection
        form={newForm}
        formVisibilityRestriction={handleFormVisibilityRestriction}
      />
      <Space h="xl" />
      <Center>
        <SegmentedControl
          data={FORM_SEGMENT_CHOCIES}
          value={segmentValue}
          onChange={(value) => setSegmentValue(value as FormSegmentType)}
        />
      </Center>
      <Space h="xl" />

      {segmentValue === "Form Details" ? (
        <Box>
          <Paper p="xl" shadow="xs">
            {!isCreatingEquipment && !editEquipment ? (
              <EquipmentList
                equipmentList={equipmentList}
                setEquipmentList={setEquipmentList}
                equipmentCount={equipmentCount}
                setEquipmentCount={setEquipmentCount}
                setIsCreatingEquipment={setIsCreatingEquipment}
                setSelectedEquipment={setSelectedEquipment}
                setEditEquipment={setEditEquipment}
                editEquipment={editEquipment}
              />
            ) : null}
            {isCreatingEquipment ? (
              <CreateEquipment
                setIsCreatingEquipment={setIsCreatingEquipment}
                setEquipmentList={setEquipmentList}
                setEquipmentCount={setEquipmentCount}
              />
            ) : null}
            {editEquipment ? (
              <UpdateEquipment
                setEquipmentList={setEquipmentList}
                setEditEquipment={setEditEquipment}
                editEquipment={editEquipment}
              />
            ) : null}
          </Paper>
          <Space h="xl" />
          <Paper p="xl" shadow="xs">
            {!selectedEquipment ? (
              <Box>
                <Title order={5} color="dimmed">
                  Equipment Descriptions
                </Title>
                <Center>
                  <Text color="dimmed">No equipment selected</Text>
                </Center>
              </Box>
            ) : null}
            {selectedEquipment ? (
              <EquipmentDescription
                selectedEquipment={selectedEquipment}
                setSelectedEquipment={setSelectedEquipment}
              />
            ) : null}
          </Paper>
          <Space h="xl" />
          <Paper p="xl" shadow="xs">
            {!selectedEquipment ? (
              <Box>
                <Title order={5} color="dimmed">
                  Equipment Parts
                </Title>
                <Center>
                  <Text color="dimmed">No equipment selected</Text>
                </Center>
              </Box>
            ) : null}
            {selectedEquipment ? (
              <EquipmentPart
                selectedEquipment={selectedEquipment}
                setSelectedEquipment={setSelectedEquipment}
              />
            ) : null}
          </Paper>
        </Box>
      ) : null}

      {segmentValue === "Form Preview" ? (
        <Stack spacing="xl">
          <FormSection section={form.form_section[0]} />
          <FormSection
            section={{
              ...form.form_section[1],
              section_field: form.form_section[1].section_field.slice(0, 9),
            }}
          />
        </Stack>
      ) : null}

      {segmentValue === "Form Lookup" ? <PEDLookup /> : null}

      <Paper p="xl" shadow="xs" mt="xl">
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
            <Button loading={isSavingRequester} onClick={handleSaveRequesters}>
              Save Changes
            </Button>
          </Center>
        ) : null}
      </Paper>

      <Paper p="xl" shadow="xs" mt="xl">
        <Title order={3}>Default Signer</Title>
        <Space h="xl" />
        <FormProvider {...signerMethods}>
          <SignerSection
            teamMemberList={teamMemberList}
            formId={`${formId}`}
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

      <Paper p="xl" shadow="xs" mt="xl">
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
              <ActionIcon onClick={() => handleFetchProject(1, projectSearch)}>
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
                    handleFetchProjectSigner(team_project_id, team_project_name)
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

      <Paper p="xl" shadow="xs" mt="xl" pos="relative">
        <LoadingOverlay visible={isFetchingProjectSigner} overlayBlur={2} />
        {!selectedProject ? (
          <Center>
            <Text color="dimmed">No project selected</Text>
          </Center>
        ) : null}
        {selectedProject ? (
          <SignerPerProject
            teamMemberList={teamMemberList}
            formId={form.form_id}
            formSigner={selectedProjectSigner}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
          />
        ) : null}
      </Paper>
    </Container>
  );
};

export default PEDPartFormPage;
