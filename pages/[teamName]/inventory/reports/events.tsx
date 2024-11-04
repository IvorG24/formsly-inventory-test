// Imports
import {
  checkIfOwnerOrAdmin,
  getAssetListFilterOptions,
} from "@/backend/api/get";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import EventReportListpage from "@/components/AssetInventory/EventReportListPage/EventReportListPage";
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
  siteList: SiteTableRow[];
  customerList: InventoryCustomerRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
};

const Page = ({
  siteList,
  customerList,
  departmentList,
  categoryList,

  securityGroupData,
}: Props) => {
  return (
    <>
      <Meta
        description="Events Report List Page"
        url="/teamName/inventory/reports/events"
      />
      <EventReportListpage
        customerTableList={customerList}
        securityGroupData={securityGroupData}
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
