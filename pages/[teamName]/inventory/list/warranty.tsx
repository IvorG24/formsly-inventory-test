// Imports
import { getColumnListDynamic } from "@/backend/api/get";
import WarrantyListPage from "@/components/AssetInventory/WarrantyListPage/WarrantyListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData, supabaseClient }) => {
    try {
      const hasViewOnlyPermission = securityGroupData.asset.permissions.some(
        (permission) =>
          permission.key === "viewOnly" && permission.value === true
      );

      if (!hasViewOnlyPermission) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }
      const tableColumnList = await getColumnListDynamic(supabaseClient, {
        formId: "dd3d9787-ba92-4ef7-bc9f-8c6f374cd477",
        type: "warranty",
      });
      return {
        props: {
          securityGroupData,
          tableColumnList,
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
  tableColumnList: {
    value: string;
    label: string;
    field_is_custom_field?: boolean;
  }[];
};
const Page = ({ securityGroupData, tableColumnList }: Props) => {
  return (
    <>
      <Meta
        description="Warranty List Page"
        url="/teamName/inventory/list/warranty"
      />
      <WarrantyListPage
        tableColumnList={tableColumnList}
        securityGroupData={securityGroupData}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
