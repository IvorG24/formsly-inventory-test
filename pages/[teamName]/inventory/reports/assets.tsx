// Imports
import {
  checkIfOwnerOrAdmin,
  getAssetListFilterOptions,
  getColumnList,
} from "@/backend/api/get";
import AssetReportsListPage from "@/components/AssetInventory/AssetReportsListPage/AssetReportsListPage";
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

      const isOwnerOrAdmin = await checkIfOwnerOrAdmin(supabaseClient, {
        userId: user.id,
        teamId: userActiveTeam.team_id,
      });

      if (!isOwnerOrAdmin) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }

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
        description="Asset List Page"
        url="/teamName/inventory/reports/asset"
      />
      <AssetReportsListPage
        customerTableList={customerList}
        securityGroupData={securityGroupData}
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        tableColumnList={fields}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
