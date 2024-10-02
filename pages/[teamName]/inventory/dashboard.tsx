// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import DashboardPage from "@/components/AssetInventory/DashboardPage/DashboardPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user, supabaseClient }) => {
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

const Page = () => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/inventory/dashboard"
      />
      <DashboardPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
