// Imports
import CreateAssetPage from "@/components/AssetInventory/CreateAssetPage/CreateAssetPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { InventoryFormResponseType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user, context, supabaseClient }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "create_request_page_on_load",
        {
          input_data: {
            formId: context.query.formId,
            userId: user.id,
          },
        }
      );
      console.log(error);
      if (error) {
        throw error;
      }

      return {
        props: data as Props,
      };
    } catch (e) {
      return {
        props: { form: {} },
      };
    }
  }
);
type Props = {
  form: InventoryFormResponseType;
};
const Page = ({ form }: Props) => {
  console.log(form);

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
