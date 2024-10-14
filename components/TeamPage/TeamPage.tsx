import { deleteRow } from "@/backend/api/delete";
import { uploadImage } from "@/backend/api/post";
import {
  leaveTeam,
  updateTeam,
  updateTeamMemberRole,
  updateTeamOwner,
} from "@/backend/api/update";
import { useTeamActions, useTeamList } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";

import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  MemberRoleType,
  TeamGroupTableRow,
  TeamMemberType,
  TeamProjectWithAddressType,
  TeamTableRow,
  UserValidIDTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Space,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DeleteTeamSection from "./DeleteTeam/DeleteTeamSection";
import InviteMember from "./InviteMember";
import LeaveTeamSection from "./LeaveTeamSection";
import QuickOnboarding from "./QuickOnboarding";
import AdminGroup from "./TeamGroup/AdminGroup";
import ApproverGroup from "./TeamGroup/ApproverGroup";
import TeamGroups from "./TeamGroup/TeamGroups/TeamGroups";
import TeamInfoForm from "./TeamInfoForm";
import TeamMemberList from "./TeamMemberList";
import TeamProject from "./TeamProject/TeamProject";
import ValidIDVerificationList from "./ValidIDVerificationList";

export type UpdateTeamInfoForm = {
  teamName: string;
  teamLogo: string;
};

export type SearchForm = {
  keyword: string;
};

type Props = {
  team: TeamTableRow;
  teamMembers: TeamMemberType[];
  teamGroups: TeamGroupTableRow[];
  teamProjects: TeamProjectWithAddressType[];
  teamMembersCount: number;
  teamGroupsCount: number;
  teamProjectsCount: number;
  pendingValidIDList: UserValidIDTableRow[];
};

const TeamPage = ({
  team: initialTeam,
  teamMembers,
  teamGroups,
  teamProjects,
  teamMembersCount,
  teamGroupsCount,
  teamProjectsCount,
  pendingValidIDList,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const teamList = useTeamList();
  const teamMember = useUserTeamMember();
  const user = useUser();

  const [team, setTeam] = useState<TeamTableRow>(initialTeam);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  const [teamMemberCount, setTeamMemberCount] = useState(teamMembersCount);
  const [teamMemberList, setTeamMemberList] = useState(teamMembers);
  const [isUpdatingTeamMembers, setIsUpdatingTeamMembers] = useState(false);
  const { setTeamList, setActiveTeam } = useTeamActions();
  const [teamMemberPage, setTeamMemberPage] = useState(1);

  const [teamLogo, setTeamLogo] = useState<File | null>(null);

  const memberEmailList = teamMemberList.map(
    (member) => member.team_member_user.user_email
  );

  const [userRole, setUserRole] = useState(teamMember?.team_member_role);
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(`${userRole}`);
  const isOwner = userRole === "OWNER";

  const updateTeamMethods = useForm<UpdateTeamInfoForm>({
    defaultValues: { teamName: team.team_name, teamLogo: team.team_logo || "" },
  });

  const searchTeamMemberMethods = useForm<SearchForm>();

  const handleUpdateTeam = async (data: UpdateTeamInfoForm) => {
    const { teamName } = data;
    try {
      if (!user) return;
      setIsUpdatingTeam(true);

      let imageUrl = "";
      if (teamLogo) {
        imageUrl = (
          await uploadImage(supabaseClient, {
            image: teamLogo,
            bucket: "TEAM_LOGOS",
            fileType: "l",
            userId: user.id,
          })
        ).publicUrl;

        await updateTeam(supabaseClient, {
          team_id: team.team_id,
          team_name: teamName,
          team_logo: imageUrl,
        });
      } else {
        await updateTeam(supabaseClient, {
          team_id: team.team_id,
          team_name: teamName,
        });
      }

      const newTeamList = teamList.map((stateTeam) => {
        if (stateTeam.team_id === team.team_id) {
          const newActiveTeam = {
            ...stateTeam,
            team_name: teamName,
            team_logo: imageUrl ? imageUrl : stateTeam.team_logo,
          };
          setActiveTeam(newActiveTeam);
          return newActiveTeam;
        } else {
          return stateTeam;
        }
      });

      setTeamList(newTeamList);

      updateTeamMethods.reset({
        teamName,
        teamLogo: imageUrl ? imageUrl : team.team_logo || "",
      });

      setTeam((team) => {
        return {
          ...team,
          team_name: teamName,
          team_logo: imageUrl ? imageUrl : team.team_logo,
        };
      });
      setTeamLogo(null);

      notifications.show({
        message: "Team updated.",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleSearchTeamMember = async (data: SearchForm) => {
    try {
      setIsUpdatingTeamMembers(true);
      setTeamMemberPage(1);
      const { data: memberData, error } = await supabaseClient.rpc(
        "get_team_member_with_filter",
        {
          input_data: {
            teamId: team.team_id,
            page: 1,
            limit: ROW_PER_PAGE,
            search: data.keyword,
          },
        }
      );
      const formattedData = memberData as {
        teamMembers: TeamMemberType[];
        teamMembersCount: number;
      };
      if (error) throw error;
      setTeamMemberList(formattedData.teamMembers);
      setTeamMemberCount(formattedData.teamMembersCount || 0);
      setIsUpdatingTeamMembers(false);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    role: MemberRoleType
  ) => {
    try {
      setIsUpdatingTeamMembers(true);

      await updateTeamMemberRole(supabaseClient, {
        memberId,
        role,
      });

      notifications.show({
        message: "Team member role updated.",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsUpdatingTeamMembers(false);
    }
  };

  const handleTransferOwnership = async (ownerId: string, memberId: string) => {
    try {
      setIsUpdatingTeamMembers(true);

      await updateTeamOwner(supabaseClient, {
        ownerId,
        memberId,
      });

      notifications.show({
        message: "Team ownership transferred",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsUpdatingTeamMembers(false);
    }
  };

  const handleRemoveFromTeam = async (memberId: string) => {
    try {
      setIsUpdatingTeamMembers(true);

      await deleteRow(supabaseClient, {
        rowId: [memberId],
        table: "team_member",
        schema: "team_schema",
      });

      notifications.show({
        message: "Team member removed.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsUpdatingTeamMembers(false);
    }
  };

  const handleMemberPageChange = async (page: number) => {
    try {
      setTeamMemberPage(page);
      setIsUpdatingTeamMembers(true);
      const keyword = searchTeamMemberMethods.getValues("keyword");
      const { data, error } = await supabaseClient.rpc(
        "get_team_member_with_filter",
        {
          input_data: {
            teamId: team.team_id,
            page,
            limit: ROW_PER_PAGE,
            search: keyword,
          },
        }
      );
      const formattedData = data as {
        teamMembers: TeamMemberType[];
        teamMembersCount: number;
      };
      if (error) throw error;
      setTeamMemberList(formattedData.teamMembers);
      setTeamMemberCount(formattedData.teamMembersCount || 0);
      setIsUpdatingTeamMembers(false);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleLeaveTeam = async () => {
    try {
      const teamId = team.team_id;
      const teamMemberId = teamMember?.team_member_id;
      await leaveTeam(supabaseClient, {
        teamId,
        teamMemberId: `${teamMemberId}`,
      });
      const updatedTeamList = teamList.filter(
        (team) => team.team_id !== teamId
      );
      setTeamList(updatedTeamList);
      await router.push("/");
    } catch (e) {
      notifications.show({
        message: "Error: cannot leave team",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (teamMember) {
      setUserRole(teamMember.team_member_role);
    }
  }, [teamMember]);

  return (
    <Container>
      <Group>
        <Title order={2}>Manage Team</Title>
        {isOwner ? (
          <Button
            variant="light"
            onClick={async () =>
              await router.push(
                `/${formatTeamNameToUrlKey(team.team_name)}/invoice`
              )
            }
          >
            Invoice History
          </Button>
        ) : null}
      </Group>

      <FormProvider {...updateTeamMethods}>
        <TeamInfoForm
          team={team}
          isUpdatingTeam={isUpdatingTeam}
          onUpdateTeam={handleUpdateTeam}
          teamLogoFile={teamLogo}
          onTeamLogoFileChange={setTeamLogo}
          isOwner={isOwner}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      </FormProvider>

      <FormProvider {...searchTeamMemberMethods}>
        <TeamMemberList
          teamMemberList={teamMemberList}
          teamMemberCount={teamMemberCount}
          isUpdatingTeamMembers={isUpdatingTeamMembers}
          onSearchTeamMember={handleSearchTeamMember}
          onRemoveFromTeam={handleRemoveFromTeam}
          onUpdateMemberRole={handleUpdateMemberRole}
          onTransferOwnership={handleTransferOwnership}
          page={teamMemberPage}
          handlePageChange={handleMemberPageChange}
        />
      </FormProvider>

      {isOwner && (
        <Box mt="xl">
          <Paper p="xl" shadow="xs">
            <AdminGroup
              teamId={initialTeam.team_id}
              teamMemberList={teamMembers}
            />
          </Paper>
        </Box>
      )}

      {isOwnerOrAdmin && (
        <Box mt="xl">
          <Paper p="xl" shadow="xs">
            <ApproverGroup
              teamId={initialTeam.team_id}
              teamMemberList={teamMembers}
            />
          </Paper>
        </Box>
      )}

      <TeamGroups
        teamGroups={teamGroups}
        teamGroupsCount={teamGroupsCount}
        isOwnerOrAdmin={isOwnerOrAdmin}
        teamId={initialTeam.team_id}
      />

      <TeamProject
        teamProjects={teamProjects}
        teamProjectsCount={teamProjectsCount}
        isOwnerOrAdmin={isOwnerOrAdmin}
        teamId={initialTeam.team_id}
      />

      {isOwnerOrAdmin && (
        <>
          <InviteMember
            isOwnerOrAdmin={isOwnerOrAdmin}
            memberEmailList={memberEmailList}
            teamMemberList={teamMembers}
          />
          <QuickOnboarding memberEmailList={memberEmailList} />
          <ValidIDVerificationList pendingValidIDList={pendingValidIDList} />
        </>
      )}

      {isOwner && <DeleteTeamSection totalMembers={teamMembers.length} />}
      {!isOwner && <LeaveTeamSection onLeaveTeam={handleLeaveTeam} />}

      <Space mt={32} />
    </Container>
  );
};

export default TeamPage;
