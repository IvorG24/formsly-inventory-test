// Imports
import { getCategoryOptions } from "@/backend/api/get";
import SubCategoriesSetupPage from "@/components/AssetInventory/SubCategoriesSetupPage/SubCategoriesSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { CategoryTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, userActiveTeam }) => {
    try {
      const { data } = await getCategoryOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      return {
        props: {
          data,
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
  data: CategoryTableRow[];
};
const Page = ({ data }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/setup/sub-categories"
      />
      <SubCategoriesSetupPage categoryOptions={data} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
