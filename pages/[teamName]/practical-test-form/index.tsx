// Imports
import { checkIfGroupMember } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import PracticalTestFormPage from "@/components/PracticalTestFormPage/PracticalTestFormPage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, user, userActiveTeam }) => {
    try {
      const iSHumanResourcesMember = await checkIfGroupMember(supabaseClient, {
        userId: user.id,
        groupName: ["HUMAN RESOURCES", "HUMAN RESOURCES VIEWER"],
        teamId: userActiveTeam.team_id,
      });
      if (!iSHumanResourcesMember) {
        return {
          redirect: {
            destination: "/401",
            permanent: false,
          },
        };
      }
      return {
        props: {},
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

const Page = () => {
  return (
    <>
      <Meta
        description="Practical Test Form List Page"
        url="/teamName/practical-test-form"
      />
      <PracticalTestFormPage />
    </>
  );
};

export default Page;
Page.Layout = "APP";
