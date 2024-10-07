// Imports
import CreateAssetPage from "@/components/AssetInventory/CreateAssetPage/CreateAssetPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { InventoryFormType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user, context, supabaseClient }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "create_inventory_request_page_on_load",
        {
          input_data: {
            formId: context.query.formId,
            userId: user.id,
          },
        }
      );

      if (error) {
        throw error;
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
        description="Request List Page"
        url="/teamName/inventory-form/[formId]/create"
      />
      <CreateAssetPage form={form} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
