import {
  getAllNotification,
  getAllTeamOfUser,
  getTeamMemberList,
  getUser,
  getUserTeamMemberData,
} from "@/backend/api/get";
import { useNotificationActions } from "@/stores/useNotificationStore";

import { useTeamActions } from "@/stores/useTeamStore";
import { useUserActions } from "@/stores/useUserStore";
import { NOTIFICATION_LIST_LIMIT } from "@/utils/constant";
import { TeamTableRow } from "@/utils/types";
import { AppShell, useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database } from "oneoffice-api";
import { useEffect } from "react";
import Navbar from "./NavBar/NavBar";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const theme = useMantineTheme();
  const currentUser = useUser();
  const userId = currentUser?.id;
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();

  const { setTeamList, setActiveTeam } = useTeamActions();
  const { setUserAvatar, setUserInitials, setUserTeamMember, setUserProfile } =
    useUserActions();
  const { setNotificationList, setUnreadNotification } =
    useNotificationActions();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId) return;
      try {
        // fetch all the team where the user is a part of
        const data = await getAllTeamOfUser(supabaseClient, {
          userId: userId,
        });
        const teamList = data as TeamTableRow[];

        // fetch the current active team of the user
        const user = await getUser(supabaseClient, {
          userId: userId,
        });

        //set user profile
        setUserProfile(user);

        let activeTeamId = "";
        if (teamList.length !== 0) {
          setTeamList(teamList);

          const userActiveTeam = teamList.find(
            (team) => team.team_id === user.user_active_team_id
          );

          if (userActiveTeam) {
            activeTeamId = userActiveTeam.team_id;
            setActiveTeam(userActiveTeam);
          } else {
            activeTeamId = teamList[0].team_id;
            setActiveTeam(teamList[0]);
          }

          const teamMember = await getUserTeamMemberData(supabaseClient, {
            teamId: activeTeamId,
            userId: user.user_id,
          });
          if (teamMember) {
            setUserTeamMember(teamMember);

            const teamMemberList = await getTeamMemberList(supabaseClient, {
              teamId: teamMember.team_member_team_id,
            });
          }
        }

        // set user avatar and initials
        setUserAvatar(user.user_avatar);
        setUserInitials(
          (user.user_first_name[0] + user.user_last_name[0]).toUpperCase()
        );

        // fetch notification list
        const { data: notificationList, count: unreadNotificationCount } =
          await getAllNotification(supabaseClient, {
            userId: user.user_id,
            app: "REQUEST",
            page: 1,
            limit: NOTIFICATION_LIST_LIMIT,
            teamId: activeTeamId,
          });

        // set notification
        setNotificationList(notificationList);
        setUnreadNotification(unreadNotificationCount || 0);
      } catch (e) {
        console.error(e);
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
        await router.push("/500");
      }
    };

    fetchInitialData();
  }, [userId]);

  return (
    <AppShell
      padding={18}
      styles={{
        main: {
          background:
            theme.colorScheme === "dark" ? theme.colors.dark[8] : "#fff",
          position: "relative",
          width: "0",
        },
      }}
      navbarOffsetBreakpoint="sm"
      navbar={<Navbar openNavbar={true} />}
    >
      {children}
    </AppShell>
  );
};

export default Layout;
