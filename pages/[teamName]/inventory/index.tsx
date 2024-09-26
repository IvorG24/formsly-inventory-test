// Imports
import InventoryDashboardPage from "@/components/InventoryDashboardPage/InventoryDashboardPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user }) => {
    try {
      return {
        props: {
          user, 
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

const Page = () => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/inventory" />
      <InventoryDashboardPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
