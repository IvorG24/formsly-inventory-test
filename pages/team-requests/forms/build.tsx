import {
  getAllTeamGroups,
  getTeamAdminList,
  getUserActiveTeamId,
} from "@/backend/api/get";
import BuildRequestFormPage from "@/components/BuildRequestFormPage/BuildRequestFormPage";
import Meta from "@/components/Meta/Meta";
import { withOwnerOrAdmin } from "@/utils/server-side-protections";
import { TeamGroupTableRow, TeamMemberWithUserType } from "@/utils/types";
import { GetServerSideProps } from "next";
import { v4 as uuidv4 } from "uuid";

export const getServerSideProps: GetServerSideProps = withOwnerOrAdmin(
  async ({ supabaseClient, user }) => {
    try {
      const teamId = await getUserActiveTeamId(supabaseClient, {
        userId: user.id,
      });
      if (!teamId) throw new Error("No team found");

      const teamMemberList = await getTeamAdminList(supabaseClient, {
        teamId,
      });

      const formId = uuidv4();

      const groupList = await getAllTeamGroups(supabaseClient, { teamId });

      return {
        props: { teamMemberList, formId, groupList },
      };
    } catch (error) {
      console.error(error);
      return {
        redirect: {
          destination: "/500",
          permanent: false,
        },
      };
    }
  }
);

type Props = {
  teamMemberList: TeamMemberWithUserType[];
  formId: string;
  groupList: TeamGroupTableRow[];
};

const Page = ({ teamMemberList, formId, groupList }: Props) => {
  return (
    <>
      <Meta description="Build Request Page" url="/team-requests/forms/build" />
      <BuildRequestFormPage teamMemberList={teamMemberList} formId={formId} groupList={groupList} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
