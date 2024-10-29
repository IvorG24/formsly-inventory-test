// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import DynamicListPage from "@/components/AssetInventory/DynamicEventListPage/DynamicListPage";
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
  departmentList: Department[];
  customerList: InventoryCustomerRow[];
  categoryList: CategoryTableRow[];
  eventList: EventTableRow[];
  securityGroupData: SecurityGroupData;
  fields: {
    value: string;
    label: string;
  }[];
};

const Page = ({
  userId,
  siteList,
  departmentList,
  customerList,
  categoryList,
  fields,
  eventList,
  securityGroupData,
}: Props) => {
  return (
    <>
      <Meta
        description="Dynamic List Page"
        url="/teamName/inventory/list/[statusName]"
      />
      <DynamicListPage
        customerList={customerList}
        eventList={eventList}
        securityGroup={securityGroupData}
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
