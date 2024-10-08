// Imports
import { getRequestListOnLoad } from "@/backend/api/get";
import AssetInventoryDetailsPage from "@/components/AssetInventory/AssetInventoryDetailsPage/AssetInventoryDetailsPage";
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
          userId: user.id,
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
      <Meta description="Asset List Page" url="/teamName/inventory[assetId]" />
      <AssetInventoryDetailsPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
