import {
  checkIfUserHaveSSSID,
  getAllGroupOfTeamMember,
  getAllTeamOfUser,
  getFormList,
  getTeamMemberList,
  getUser,
  getUserTeamMemberData,
} from "@/backend/api/get";
import { useFormActions } from "@/stores/useFormStore";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useTeamMemberListActions } from "@/stores/useTeamMemberStore";
import { useTeamActions } from "@/stores/useTeamStore";
import { useUserActions } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { TeamMemberType, TeamTableRow } from "@/utils/types";
import { AppShell, useMantineTheme } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "./Header/Header";
import MobileNumberModal from "./MobileNumberModal";
import Navbar from "./Navbar/Navbar";
import SSSModal from "./SSSModal";
type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const currentUser = useUser();
  const userId = currentUser?.id;
  const { setIsLoading } = useLoadingActions();
  const theme = useMantineTheme();
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const { setTeamMemberStore } = useTeamMemberListActions();
  const { setTeamList, setActiveTeam } = useTeamActions();
  const { setFormList } = useFormActions();
  const {
    setUserAvatar,
    setUserInitials,
    setUserTeamMember,
    setUserProfile,
    setUserTeamMemberGroupList,
  } = useUserActions();
  // const { setNotificationList, setUnreadNotification } =
  //   useNotificationActions();

  const [openNavbar, setOpenNavbar] = useState(false);

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
    setOpenNavbar(false);
  }, [router]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
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

          // set the user's active team
          if (userActiveTeam) {
            activeTeamId = userActiveTeam.team_id;
            setActiveTeam(userActiveTeam);
          } else {
            activeTeamId = teamList[0].team_id;
            setActiveTeam(teamList[0]);
          }

          // fetch user team member id
          const teamMember = await getUserTeamMemberData(supabaseClient, {
            teamId: activeTeamId,
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

            // fetch form list of active team
            const formList = await getFormList(supabaseClient, {
              teamId: activeTeamId,
              app: user.user_active_app,
              memberId: teamMember.team_member_id,
            });

            // set form list
            setFormList(formList);
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

        // fetch notification list
        // const { data: notificationList, count: unreadNotificationCount } =
        //   await getAllNotification(supabaseClient, {
        //     userId: user.user_id,
        //     app: "REQUEST",
        //     page: 1,
        //     limit: NOTIFICATION_LIST_LIMIT,
        //     teamId: activeTeamId,
        //   });

        // set notification
        // setNotificationList(notificationList);
        // setUnreadNotification(unreadNotificationCount || 0);

        // temporary prompt
        const isWithSSSId = await checkIfUserHaveSSSID(supabaseClient, {
          userId,
        });
        if (!isWithSSSId) {
          modals.open({
            id: "SSSModal",
            title: "SSS ID Information",
            withCloseButton: false,
            closeOnClickOutside: false,
            closeOnEscape: false,
            centered: true,
            children: (
              <SSSModal userId={user.user_id} supabaseClient={supabaseClient} />
            ),
            size: "xl",
          });
        }

        if (!user.user_phone_number) {
          modals.open({
            id: "MobileNumberModal",
            title: "Mobile Number Information",
            withCloseButton: false,
            closeOnClickOutside: false,
            closeOnEscape: false,
            centered: true,
            children: (
              <MobileNumberModal
                userId={user.user_id}
                supabaseClient={supabaseClient}
              />
            ),
            size: "md",
          });
        }
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

    fetchInitialData();
  }, [userId]);

  return (
    <AppShell
      styles={{
        main: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          position: "relative",
          width: "0",
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
