// Imports
import {
  checkIfOwnerOrAdmin,
  getAssetListFilterOptions,
  getColumnFieldsEvent,
} from "@/backend/api/get";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import EventFilterByCustomerPage from "@/components/AssetInventory/EventFilterByCustomerPage/EventFilterByCustomerPage";
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
  async ({
    user,
    userActiveTeam,
    supabaseClient,
    securityGroupData,
    context,
  }) => {
    try {
      const eventName = context.query.eventName as string;

      const data = await getAssetListFilterOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      const tableColumnList = await getColumnFieldsEvent(supabaseClient, {
        eventName,
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
          tableColumnList,
          eventName,
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
  siteList: SiteTableRow[];
  departmentList: Department[];
  customerList: InventoryCustomerRow[];
  categoryList: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
  eventName: string;
  tableColumnList: {
    value: string;
    label: string;
    field_is_custom_field?: boolean;
  }[];
};

const Page = ({ ...props }: Props) => {
  return (
    <>
      <Meta
        description="Event Report List Page"
        url="/teamName/inventory/reports/[eventName]/byCustomer"
      />
      <EventFilterByCustomerPage {...props} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
