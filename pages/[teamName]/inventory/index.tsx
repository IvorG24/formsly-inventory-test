// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import AssetListPage from "@/components/AssetInventory/AssetListPage/AssetListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { TeamMemberWithUserType, TeamProjectTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user, supabaseClient }) => {
    try {
      const requestListData = await getRequestListOnLoad(supabaseClient, {
        userId: user.id, // Retrieve the user ID
      });

      return {
        props: {
          ...requestListData,
          userId: user.id, // Pass userId as a prop
        },
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
  userId: string; // Include userId in the props
  projectList: TeamProjectTableRow[];
};

const Page = ({ teamMemberList, userId, projectList }: Props) => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/inventory" />
      <AssetListPage
        teamMemberList={teamMemberList}
        projectList={projectList}
        userId={userId} // Pass userId to the AssetListPage component if needed
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
