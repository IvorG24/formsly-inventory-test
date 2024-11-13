// Imports
import {
  checkIfOwnerOrAdmin,
  getAssetListFilterOptions,
  getGroupList,
} from "@/backend/api/get";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import SecurityGroupDetailsPage from "@/components/AssetInventory/SecurityGroupPage/SecurityGroupDetailsPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
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
    context,
  }) => {
    try {
      const data = await getAssetListFilterOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });
      const isOwnerOrAdmin = await checkIfOwnerOrAdmin(supabaseClient, {
        userId: user.id,
        teamId: userActiveTeam.team_id,
      });
      const { data: group } = await getGroupList(supabaseClient, {
        groupId: context.query.groupId as string,
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
  securityGroupData: SecurityGroupData;
  group: TeamGroupTableRow[];
};
const Page = ({
  siteList,
  departmentList,
  categoryList,
  securityGroupData,
  group,
}: Props) => {
  return (
    <>
      <Meta
        description="Security Group Page"
        url="/teamName/security-groups/[groupId]"
      />
      <SecurityGroupDetailsPage
        group={group[0]}
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
