// Imports
import {
  checkIfOwnerOrAdmin,
  getAssetListFilterOptions,
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
  TeamGroupTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({
    userActiveTeam,
    supabaseClient,
    securityGroupData,
    user,
    group,
  }) => {
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
          group,
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
  group: TeamGroupTableRow;
};
const Page = ({
  siteList,
  departmentList,
  categoryList,
  eventList,
  securityGroupData,
  group,
}: Props) => {
  return (
    <>
      <Meta
        description="Check in List Page"
        url="/teamName/security-groups/[groupId]"
      />
      <SecurityGroupDetailsPage
        group={group}
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
