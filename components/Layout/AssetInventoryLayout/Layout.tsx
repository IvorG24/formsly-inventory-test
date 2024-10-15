import {
  getAllTeamOfUser,
  getTeamMemberList,
  getUser,
  getUserTeamMemberData,
} from "@/backend/api/get";

import { useTeamMemberListActions } from "@/stores/useTeamMemberStore";
import { useTeamActions } from "@/stores/useTeamStore";
import { useUserActions } from "@/stores/useUserStore";
import { TeamMemberType, TeamTableRow } from "@/utils/types";
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
  const { setTeamMemberStore } = useTeamMemberListActions();
  const { setTeamList, setActiveTeam } = useTeamActions();
  const { setUserAvatar, setUserInitials, setUserTeamMember, setUserProfile } =
    useUserActions();

  const fetchAllTeamMembers = async (teamId: string) => {
    const allTeamMembers: TeamMemberType[] = [];
    let offset = 0;
    const limit = 500;
    let moreMembers = true;

    while (moreMembers) {
      const currentBatch = await getTeamMemberList(supabaseClient, {
        teamId: teamId,
        offset: offset,
        limit: limit,
      });
      if (currentBatch.length > 0) {
        allTeamMembers.push(...currentBatch);
        offset += limit;
      }
      moreMembers = currentBatch.length === limit;
    }
    return allTeamMembers;
  };
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
          }
        }

        // set user avatar and initials
        setUserAvatar(user.user_avatar);
        setUserInitials(
          (user.user_first_name[0] + user.user_last_name[0]).toUpperCase()
        );

        if (activeTeamId) {
          const teamMemberList = await fetchAllTeamMembers(activeTeamId);
          setTeamMemberStore(teamMemberList);
        }
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
      navbar={<Navbar />}
    >
      {children}
    </AppShell>
  );
};

export default Layout;
