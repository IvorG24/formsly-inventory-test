import { redirectToNewTeam } from "@/backend/api/get";
import { useFormActions } from "@/stores/useFormStore";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useNotificationActions } from "@/stores/useNotificationStore";
import { useTeamActions } from "@/stores/useTeamStore";
import { useUserActions, useUserProfile } from "@/stores/useUserStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { TeamTableRow } from "@/utils/types";
import { Button, Paper, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";

type TeamCardProps = {
  team: TeamTableRow;
};

const TeamCard = ({ team }: TeamCardProps) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient();
  const user = useUserProfile();

  const { setActiveTeam } = useTeamActions();
  const { setIsLoading } = useLoadingActions();
  const { setUserTeamMember, setUserTeamMemberGroupList } = useUserActions();
  const { setFormList } = useFormActions();
  const { setNotificationList, setUnreadNotification } =
    useNotificationActions();

  const handleRedirectToTeamDashboard = async () => {
    try {
      if (!user) return;
      setIsLoading(true);
      setActiveTeam(team);
      const data = await redirectToNewTeam(supabaseClient, {
        userId: user.user_id,
        teamId: team.team_id,
        app: "REQUEST",
      });
      setUserTeamMember(data.teamMember);
      setUserTeamMemberGroupList([]);
      setNotificationList([]);
      setUnreadNotification(0);
      setFormList(data.formList);
      await router.push(`/${formatTeamNameToUrlKey(team.team_name)}/requests`);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      await router.push("/500");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper p="xl">
      <Stack align="center">
        <Title align="center" weight={500} order={4}>
          You have successfully created your team.
        </Title>
        <Button size="md" onClick={() => handleRedirectToTeamDashboard()}>
          Go to team {team.team_name}
        </Button>
      </Stack>
    </Paper>
  );
};

export default TeamCard;
