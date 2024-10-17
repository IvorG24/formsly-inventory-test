// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import CheckoutListPage from "@/components/AssetInventory/CheckoutListPage/CheckoutListPage";
import { Department } from "@/components/AssetInventory/DepartmentSetupPage/DepartmentSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import {
  CategoryTableRow,
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
  categoryList: CategoryTableRow[];
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
  categoryList,
  fields,
  securityGroupData,
}: Props) => {
  return (
    <>
      <Meta
        description="Check out List Page"
        url="/teamName/inventory/check-out"
      />
      <CheckoutListPage
        securityGroup={securityGroupData}
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
