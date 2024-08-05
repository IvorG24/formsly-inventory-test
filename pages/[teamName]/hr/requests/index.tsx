// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import RequestListPage from "@/components/RequestListPage/RequestListPage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { TeamMemberWithUserType, TeamProjectTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, user }) => {
    try {
      const requestListData = await getRequestListOnLoad(supabaseClient, {
        userId: user.id,
      });

      return {
        props: requestListData,
      };
    } catch (e) {
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
  isFormslyTeam: boolean;
  projectList: TeamProjectTableRow[];
};

const Page = ({ teamMemberList, isFormslyTeam, projectList }: Props) => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/requests" />

      <RequestListPage
        teamMemberList={teamMemberList}
        isFormslyTeam={isFormslyTeam}
        projectList={projectList}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
