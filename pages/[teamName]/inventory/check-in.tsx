// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import CheckinListPage from "@/components/AssetInventory/CheckinListPage/CheckinListPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { CategoryTableRow, SiteTableRow } from "@/utils/types";
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
  categoryList: CategoryTableRow[];
  fields: {
    value: string;
    label: string;
  }[];
};

const Page = ({
  userId,
  siteList,
  departmentList,
  categoryList,
  fields,
}: Props) => {
  return (
    <>
      <Meta
        description="Check in List Page"
        url="/teamName/inventory/check-in"
      />
      <CheckinListPage
        tableColumnList={fields}
        siteList={siteList}
        departmentList={departmentList}
        categoryList={categoryList}
        userId={userId}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
