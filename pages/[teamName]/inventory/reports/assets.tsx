// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import AssetReportsListPage from "@/components/AssetInventory/AssetReportsListPage/AssetReportsListPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
  EventTableRow,
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
  eventList: EventTableRow[];
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
  eventList,
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
        eventList={eventList}
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
