// Imports
import { getCategoryOptions } from "@/backend/api/get";
import SubCategoriesSetupPage from "@/components/AssetInventory/SubCategoriesSetupPage/SubCategoriesSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { CategoryTableRow, SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam, securityGroupData }) => {
    try {
      const { data } = await getCategoryOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });
      const hasViewOnlyPersmissions =
        securityGroupData.privileges.subCategory.view === true;

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
          securityGroupData,
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
  securityGroupData: SecurityGroupData;
};
const Page = ({ data, securityGroupData }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/setup/sub-categories"
      />
      <SubCategoriesSetupPage
        securityGroup={securityGroupData}
        categoryOptions={data}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
