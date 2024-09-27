// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TechnicalQuestionnairePage from "@/components/TechnicalQuestionnairePage/TechnicalQuestionnairePage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { TeamMemberWithUserType } from "@/utils/types";
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
  isFormslyTeam: boolean;
  teamMemberList: TeamMemberWithUserType[];
};

const Page = ({ isFormslyTeam, teamMemberList }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/technical-question"
      />
      <TechnicalQuestionnairePage
        teamMemberList={teamMemberList}
        isFormslyTeam={isFormslyTeam}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
