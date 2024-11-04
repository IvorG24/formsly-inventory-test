// Imports
import AssetInventoryDetailsPage from "@/components/AssetInventory/AssetInventoryDetailsPage/AssetInventoryDetailsPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { InventoryListType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, context, securityGroupData, userActiveTeam }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "get_asset_details_on_load",
        {
          input_data: {
            tagId: context.query.assetId as string,
            teamId: userActiveTeam.team_id,
          },
        }
      );

      if (error) throw error;

      const hasViewOnlyPersmissions = securityGroupData.asset.permissions.some(
        (permission) =>
          permission.key === "viewOnly" && permission.value === true
      );
      if (!hasViewOnlyPersmissions) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }
      return {
        props: {
          data,
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
  data: InventoryListType[];
};
const Page = ({ data }: Props) => {
  return (
    <>
      <Meta
        description="Asset Details Page"
        url="/teamName/inventory/[assetId]"
      />
      <AssetInventoryDetailsPage asset_details={data} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
