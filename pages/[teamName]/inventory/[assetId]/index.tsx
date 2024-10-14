// Imports
import { getAssetDetails } from "@/backend/api/get";
import AssetInventoryDetailsPage from "@/components/AssetInventory/AssetInventoryDetailsPage/AssetInventoryDetailsPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import {
  InventoryEventRow,
  InventoryHistory,
  InventoryListType,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, context }) => {
    try {
      const assetData = await getAssetDetails(supabaseClient, {
        asset_request_id: context.query.assetId as string,
      });

      return {
        props: {
          asset_details: assetData.asset_details,
          asset_history: assetData.asset_history,
          asset_event: assetData.asset_event,
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
  asset_details: InventoryListType[];
  asset_history: InventoryHistory[];
  asset_event: InventoryEventRow[];
};
const Page = ({ asset_details, asset_history, asset_event }: Props) => {
  return (
    <>
      <Meta description="Asset List Page" url="/teamName/inventory[assetId]" />
      <AssetInventoryDetailsPage
        asset_event={asset_event}
        asset_details={asset_details}
        asset_history={asset_history}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
