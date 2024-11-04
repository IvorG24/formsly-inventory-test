import {
  getActiveGroup,
  getAllTeamOfUser,
  getEmployeeInventoryList,
  getEventDetails,
  getSecurityGroups,
  getTeamMemberList,
  getUser,
  getUserTeamMemberData,
} from "@/backend/api/get";
import { useEmployeeListActions } from "@/stores/useEmployeeStore";
import { useEventListAction } from "@/stores/useEventStore";
import { useSecurityAction } from "@/stores/useSecurityGroupStore";
import { useTeamMemberListActions } from "@/stores/useTeamMemberStore";
import { useTeamActions } from "@/stores/useTeamStore";
import { useUserActions } from "@/stores/useUserStore";
import {
  InventoryEmployeeList,
  TeamMemberType,
  TeamTableRow,
} from "@/utils/types";
import { AppShell, LoadingOverlay, useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import Header from "../AppLayout/Header/Header";
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
  const { setEmployeeList } = useEmployeeListActions();
  const { setEventList } = useEventListAction();
  const { setTeamList, setActiveTeam } = useTeamActions();
  const { setUserAvatar, setUserInitials, setUserTeamMember, setUserProfile } =
    useUserActions();
  const { setSecurityGroup } = useSecurityAction();
  const [openNavbar, setOpenNavbar] = useState(false);
  const [isLoading, setIsloading] = useState(false);
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

  const fetchEmployee = async (teamId: string) => {
    const allTeamMembers: InventoryEmployeeList[] = [];
    let page = 1;
    const limit = 500;
    let moreMembers = true;

    while (moreMembers) {
      const { data: currentBatch, totalCount } = await getEmployeeInventoryList(
        supabaseClient,
        {
          teamID: teamId,
          page: page,
          limit: limit,
        }
      );

      if (currentBatch.length > 0) {
        allTeamMembers.push(...currentBatch);
        page++;
      }

      moreMembers = allTeamMembers.length < totalCount;
    }

    return allTeamMembers;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId) return;
      try {
        setIsloading(true);
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
          const userWithGroup = await getActiveGroup(supabaseClient, {
            userId: user.user_id,
          });
          if (!userWithGroup) {
            return {
              redirect: {
                destination: "/500",
                permanent: false,
              },
            };
          }

          const securityGroupData = await getSecurityGroups(supabaseClient, {
            groupId: userWithGroup.team_group_id,
          });
          setSecurityGroup(securityGroupData);
        }

        // set user avatar and initials
        setUserAvatar(user.user_avatar);
        setUserInitials(
          (user.user_first_name[0] + user.user_last_name[0]).toUpperCase()
        );

        if (activeTeamId) {
          const teamMemberList = await fetchAllTeamMembers(activeTeamId);
          setTeamMemberStore(teamMemberList);

          const employeeList = await fetchEmployee(activeTeamId);
          setEmployeeList(employeeList);

          const { data } = await getEventDetails(supabaseClient, {
            teamId: activeTeamId,
          });
          setEventList(data);
        }

        setIsloading(false);
      } catch (e) {
        await router.push("/500");
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
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
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          position: "relative",
          width: "0",
        },
      }}
      navbarOffsetBreakpoint="sm"
      navbar={<Navbar openNavbar={openNavbar} setOpenNavbar={setOpenNavbar} />}
      header={
        <Header
          openNavbar={openNavbar}
          setOpenNavbar={() => setOpenNavbar((o) => !o)}
        />
      }
    >
      <LoadingOverlay visible={isLoading} />
      {children}
    </AppShell>
  );
};

export default Layout;
