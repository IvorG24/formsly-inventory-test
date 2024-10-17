// Imports
import CategoriesSetupPage from "@/components/AssetInventory/CategoriesSetupPage/CategoriesSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData }) => {
    try {
      const hasViewOnlyPersmissions =
        securityGroupData.privileges.category.view === true;

      if (!hasViewOnlyPersmissions) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }
      return {
        props: { securityGroupData },
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
  securityGroupData: SecurityGroupData;
};
const Page = ({ securityGroupData }: Props) => {
  return (
    <>
      <Meta description="Category List Page" url="/teamName/setup/categories" />
      <CategoriesSetupPage securityGroup={securityGroupData} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
