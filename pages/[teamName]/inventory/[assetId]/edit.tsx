// Imports
import EditAssetPage from "@/components/AssetInventory/EditAssetPage/EditAssetPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { InventoryFormType } from "@/utils/types";
import { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, context, user }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "inventory_request_page_on_load",
        {
          input_data: {
            assetId: context.query.assetId,
            userId: user.id,
          },
        }
      );

      if (error) {
        throw new Error();
      }

      return {
        props: data as Props,
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
  form: InventoryFormType;
};
const Page = ({ form }: Props) => {
  return (
    <>
      <Meta
        description="Asset List Page"
        url="/teamName/inventory[assetId]/edit"
      />
      <EditAssetPage form={form} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
