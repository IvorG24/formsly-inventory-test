// Imports
import {
  getAssetListFilterOptions,
  getSecurityGroups,
} from "@/backend/api/get";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import SecurityGroupDetailsPage from "@/components/AssetInventory/SecurityGroupPage/SecurityGroupDetailsPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
  EventTableRow,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ userActiveTeam, supabaseClient, group }) => {
    try {
      const data = await getAssetListFilterOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      const securityGroupData = await getSecurityGroups(supabaseClient, {
        groupId: group.team_group_id,
      });

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
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  eventList: EventTableRow[];
  securityGroupData: SecurityGroupData;
};
const Page = ({
  siteList,
  departmentList,
  categoryList,
  eventList,
  securityGroupData,
}: Props) => {
  return (
    <>
      <Meta
        description="Check in List Page"
        url="/teamName/security-groups/[groupId]"
      />
      <SecurityGroupDetailsPage
        securityGroupData={securityGroupData}
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        eventList={eventList}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
