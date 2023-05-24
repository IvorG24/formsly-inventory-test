import { getAllTeamOfUser, getFormList, getUser } from "@/backend/api/get";
import { updateUserActiveApp } from "@/backend/api/update";
import { useFormActions } from "@/stores/useFormStore";
import { useActiveApp, useTeamActions } from "@/stores/useTeamStore";
import { useUserActions } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { TEMP_USER_ID } from "@/utils/dummyData";
import { TeamTableRow } from "@/utils/types";
import { AppShell, useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import Header from "./Header/Header";
import Navbar from "./Navbar/Navbar";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const supabaseClient = createBrowserSupabaseClient<Database>();

  const activeApp = useActiveApp();
  const { setTeamList, setActiveTeam, setActiveApp } = useTeamActions();
  const { setFormList } = useFormActions();
  setFormList;
  const { setUserAvatar } = useUserActions();

  const [openNavbar, setOpenNavbar] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // fetch all the team where the user is a part of
        const data = await getAllTeamOfUser(supabaseClient, {
          userId: TEMP_USER_ID,
        });
        const teamList = data as TeamTableRow[];
        setTeamList(teamList);

        // fetch the current active team of the user
        const user = await getUser(supabaseClient, { userId: TEMP_USER_ID });

        // set user avatar
        setUserAvatar(user.user_avatar);

        const userActiveTeam = teamList.find(
          (team) => team.team_id === user.user_active_team_id
        );

        let activeTeamId = "";
        // set the user's active team
        if (userActiveTeam) {
          activeTeamId = userActiveTeam.team_id;
          setActiveTeam(userActiveTeam);
        } else {
          activeTeamId = teamList[0].team_id;
          setActiveTeam(teamList[0]);
        }

        // set the user's active app
        if (router.pathname.includes("team-requests")) {
          setActiveApp("REQUEST");
        } else if (router.pathname.includes("team-reviews")) {
          setActiveApp("REVIEW");
        } else {
          setActiveApp(user.user_active_app);
        }

        // fetch form list of active team
        const formList = await getFormList(supabaseClient, {
          teamId: activeTeamId,
          app: user.user_active_app,
          isAll: false,
        });

        // set form list
        setFormList(formList);
      } catch {
        notifications.show({
          title: "Error!",
          message: "Unable to fetch team",
          color: "red",
        });
        router.push("/500");
      }
    };
    fetchInitialData();
  }, []);

  useBeforeunload(async () => {
    await updateUserActiveApp(supabaseClient, {
      app: activeApp,
      userId: TEMP_USER_ID,
    });
  });

  return (
    <AppShell
      styles={{
        main: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          position: "relative",
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={<Navbar openNavbar={openNavbar} />}
      header={
        <Header
          openNavbar={openNavbar}
          setOpenNavbar={() => setOpenNavbar((o) => !o)}
        />
      }
    >
      {children}
    </AppShell>
  );
};

export default Layout;
