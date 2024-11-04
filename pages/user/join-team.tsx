import { getExistingTeams } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TeamMembershipRequestPage from "@/components/TeamMembershipRequest/TeamMembershipRequestPage";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import { TeamTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ supabaseClient }) => {
    try {
      const teamsData = await getExistingTeams(supabaseClient, {
        page: 1,
      });

      return {
        props: { teams: teamsData.data, teamsCount: teamsData.count },
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
};

const Page = ({ teams, teamsCount }: Props) => {
  return (
    <>
      <Meta description="Join Team Page" url="/user/join-team" />
      <TeamMembershipRequestPage teams={teams} teamsCount={teamsCount} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
