// Imports
import { getAssetListFilterOptions } from "@/backend/api/get";
import CheckinListPage from "@/components/AssetInventory/CheckinListPage/CheckinListPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
  SiteTableRow,
  TeamMemberWithUserType,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ user, userActiveTeam, supabaseClient }) => {
    try {
      const data = await getAssetListFilterOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });

      return {
        props: {
          ...data,
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
  teamMemberList: TeamMemberWithUserType[];
  userId: string;
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
};

const Page = ({
  userId,
  teamMemberList,
  siteList,
  departmentList,
  categoryList,
}: Props) => {
  return (
    <>
      <Meta
        description="Check in List Page"
        url="/teamName/inventory/check-in"
      />
      <CheckinListPage
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        teamMemberList={teamMemberList}
        userId={userId}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
