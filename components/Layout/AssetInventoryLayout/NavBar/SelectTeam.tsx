import {
  getAllGroupOfTeamMember,
  getAllNotification,
  getFormList,
  getUserTeamMemberData,
} from "@/backend/api/get";
import { updateUserActiveTeam } from "@/backend/api/update";
import { useFormActions } from "@/stores/useFormStore";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useNotificationActions } from "@/stores/useNotificationStore";
import {
  useActiveTeam,
  useTeamActions,
  useTeamList,
} from "@/stores/useTeamStore";
import { useUserActions, useUserProfile } from "@/stores/useUserStore";
import { NOTIFICATION_LIST_LIMIT } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isEmpty } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { getAvatarColor } from "@/utils/styling";
import { TeamTableRow } from "@/utils/types";
import { Avatar, Group, Loader, Select, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { forwardRef } from "react";

export type TeamSelectItem = {
  team: TeamTableRow;
  label: string;
  value: string;
} & React.ComponentPropsWithoutRef<"div">;

const SelectItem = forwardRef<HTMLDivElement, TeamSelectItem>(
  ({ team, label, value, ...others }: TeamSelectItem, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap>
        <Avatar
          size="xs"
          src={team.team_logo}
          color={getAvatarColor(Number(`${value.charCodeAt(0)}`))}
        >
          {(label[0] + label[1]).toUpperCase()}
        </Avatar>

        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )
);
type Props = {
  isCollapsed: boolean;
};
const SelectTeam = ({ isCollapsed }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();

  const teamList = useTeamList();
  const activeTeam = useActiveTeam();
  const user = useUserProfile();

  const { setActiveTeam } = useTeamActions();
  const { setFormList } = useFormActions();
  const { setIsLoading } = useLoadingActions();
  const { setNotificationList, setUnreadNotification } =
    useNotificationActions();
  const { setUserTeamMember, setUserTeamMemberGroupList } = useUserActions();

  const formatTeamOptions = () => {
    const teamOptions = teamList.map((team) => {
      return {
        value: team.team_id,
        label: team.team_name,
        team: team,
      };
    });
    return teamOptions;
  };

  const handleOnChange = async (value: string | null) => {
    if (value === activeTeam?.team_id) {
      return;
    }
    setIsLoading(true);
    try {
      const newActiveTeam = teamList.find((team) => {
        if (team.team_id === value) {
          return team;
        }
      });
      if (newActiveTeam && user) {
        setActiveTeam(newActiveTeam);
        await updateUserActiveTeam(supabaseClient, {
          userId: user.user_id,
          teamId: newActiveTeam.team_id,
        });

        // fetch user team member id
        const teamMember = await getUserTeamMemberData(supabaseClient, {
          teamId: newActiveTeam.team_id,
          userId: user.user_id,
        });
        // set user team member id
        if (teamMember) {
          const teamMemberGroupList = await getAllGroupOfTeamMember(
            supabaseClient,
            { teamMemberId: teamMember.team_member_id }
          );
          setUserTeamMember(teamMember);
          setUserTeamMemberGroupList(teamMemberGroupList);

          // fetch form list
          const formList = await getFormList(supabaseClient, {
            teamId: `${value}`,
            app: "REQUEST",
            memberId: teamMember.team_member_id,
          });

          // set form list
          setFormList(formList);
        }

        // fetch notification list
        const { data: notificationList, count: unreadNotificationCount } =
          await getAllNotification(supabaseClient, {
            userId: user.user_id,
            app: "REQUEST",
            page: 1,
            limit: NOTIFICATION_LIST_LIMIT,
            teamId: newActiveTeam.team_id,
          });

        // set notification
        setNotificationList(notificationList);
        setUnreadNotification(unreadNotificationCount || 0);
      }

      if (newActiveTeam) {
        await router.push(
          `/${formatTeamNameToUrlKey(newActiveTeam.team_name)}/dashboard`
        );
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmpty(activeTeam)) {
    return (
      <Select
        label={
          <Text size="xs" weight={400}>
            Switch Team
          </Text>
        }
        data={[]}
        placeholder="Loading ...."
        icon={<Loader size={16} />}
      />
    );
  }

  return (
    <>
      {isCollapsed ? (
        <Avatar
          maw={46}
          miw={46}
          ml={4}
          src={activeTeam.team_logo}
          color={getAvatarColor(Number(`${activeTeam.team_id.charCodeAt(0)}`))}
        >
          {(activeTeam.team_name[0] + activeTeam.team_name[1]).toUpperCase()}
        </Avatar>
      ) : (
        <Select
          label={
            <Text size="xs" weight={400}>
              Switch Team
            </Text>
          }
          itemComponent={SelectItem}
          data={formatTeamOptions()}
          value={activeTeam.team_id}
          onChange={handleOnChange}
          maxDropdownHeight={400}
          nothingFound="Team not found"
          icon={
            <Avatar
              size="sm" // Smaller avatar size when not collapsed
              src={activeTeam.team_logo}
              color={getAvatarColor(
                Number(`${activeTeam.team_id.charCodeAt(0)}`)
              )}
            >
              {(
                activeTeam.team_name[0] + activeTeam.team_name[1]
              ).toUpperCase()}
            </Avatar>
          }
          styles={{
            dropdown: {
              maxWidth: "fit-content",
            },
          }}
        />
      )}
    </>
  );
};

export default SelectTeam;
SelectItem.displayName = "SelectItem";
