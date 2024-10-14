// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import AssetListPage from "@/components/AssetInventory/AssetListPage/AssetListPage";
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

      const fields = await getColumnList(supabaseClient);

      return {
        props: {
          ...data,
          fields,
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
  fields: {
    value: string;
    label: string;
  }[];
};

const Page = ({
  userId,
  teamMemberList,
  siteList,
  departmentList,
  categoryList,
  fields,
}: Props) => {
  return (
    <>
      <Meta description="Asset List Page" url="/teamName/inventory" />
      <AssetListPage
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        teamMemberList={teamMemberList}
        userId={userId}
        tableColumnList={fields}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
