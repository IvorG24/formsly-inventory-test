// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import CategoriesSetupPage from "@/components/AssetInventory/CategoriesSetupPage/CategoriesSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
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

const Page = () => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/setup/categories" />
      <CategoriesSetupPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
