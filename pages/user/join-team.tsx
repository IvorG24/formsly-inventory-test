import { getTeamMembershipRequestPageOnLoad } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TeamMembershipRequestPage from "@/components/TeamMembershipRequest/TeamMembershipRequestPage";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import { TeamMembershipRequestTableRow, TeamTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ supabaseClient, user }) => {
    try {
      const data = await getTeamMembershipRequestPageOnLoad(supabaseClient, {
        userId: user.id,
      });

      return {
        props: data as Props,
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
  teams: Pick<TeamTableRow, "team_id" | "team_name" | "team_logo">[];
  teamsCount: number;
  teamMembershipRequestList: TeamMembershipRequestTableRow[];
};

const Page = (props: Props) => {
  return (
    <>
      <Meta description="Join Team Page" url="/user/join-team" />
      <TeamMembershipRequestPage {...props} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
