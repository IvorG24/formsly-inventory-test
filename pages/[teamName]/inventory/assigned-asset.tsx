// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import AssignedAssetListPage from "@/components/AssetInventory/AssignedAssetListPage/AssignedAssetListPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
  InventoryCustomerRow,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ user, userActiveTeam, supabaseClient, securityGroupData }) => {
    try {
      const data = await getAssetListFilterOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      const fields = await getColumnList(supabaseClient);

      return {
        props: {
          ...data,
          fields,
          securityGroupData,
          userId: user.id,
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
  userId: string;
  siteList: SiteTableRow[];
  customerList: InventoryCustomerRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
  fields: {
    value: string;
    label: string;
  }[];
};

const Page = ({
  userId,
  siteList,
  customerList,
  departmentList,
  categoryList,
  fields,
  securityGroupData,
}: Props) => {
  return (
    <>
      <Meta
        description="Assigned Asset List Page"
        url="/teamName/inventory/assigned-asset"
      />
      <AssignedAssetListPage
        customerTableList={customerList}
        securityGroupData={securityGroupData}
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        userId={userId}
        tableColumnList={fields}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
