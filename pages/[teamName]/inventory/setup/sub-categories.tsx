// Imports
import { getCategoryOptions } from "@/backend/api/get";
import SubCategoriesSetupPage from "@/components/AssetInventory/SubCategoriesSetupPage/SubCategoriesSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { OptionTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient }) => {
    try {
      const categoryOptions = await getCategoryOptions(supabaseClient, {});

      return {
        props: {
          categoryOptions,
        } as Props,
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
  categoryOptions: OptionTableRow[];
};
const Page = ({ categoryOptions }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/setup/sub-categories"
      />
      <SubCategoriesSetupPage categoryOptions={categoryOptions} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
