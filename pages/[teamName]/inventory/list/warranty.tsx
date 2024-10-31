// Imports
import WarrantyListPage from "@/components/AssetInventory/WarrantyListPage/WarrantyListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData }) => {
    try {
      const hasViewOnlyPersmissions =
        securityGroupData.privileges.customer.view === true;

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
          securityGroupData,
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
  securityGroupData: SecurityGroupData;
};
const Page = ({ securityGroupData }: Props) => {
  return (
    <>
      <Meta
        description="Warranty List Page"
        url="/teamName/inventory/list/warranty"
      />
      <WarrantyListPage securityGroupData={securityGroupData} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
