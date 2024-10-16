// Imports
import { getCategoryOptions } from "@/backend/api/get";
import AssetSetupPage from "@/components/AssetInventory/AssetSetupPage/AssetSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { CategoryTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam }) => {
    try {
      const { data: categoryOptions } = await getCategoryOptions(
        supabaseClient,
        {
          teamId: userActiveTeam.team_id,
        }
      );

      return {
        props: {
          categoryOptions,
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
  categoryOptions: CategoryTableRow[];
};
const Page = ({ categoryOptions }: Props) => {
  return (
    <>
      <Meta
        description="Asset Setup Page"
        url="/teamName/inventory/asset-setup"
      />
      <AssetSetupPage categoryOptions={categoryOptions} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
