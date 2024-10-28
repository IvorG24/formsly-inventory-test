// Imports
import { getCategoryOptions } from "@/backend/api/get";
import EmployeeListPage from "@/components/AssetInventory/EmployeeListPage/EmployeeListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { CategoryTableRow, SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam, securityGroupData }) => {
    try {
      const { data: categoryOptions } = await getCategoryOptions(
        supabaseClient,
        {
          teamId: userActiveTeam.team_id,
        }
      );
      const hasViewOnlyPersmissions =
        securityGroupData.privileges.employee.view === true;

      if (!hasViewOnlyPersmissions) {
        return {
          redirect: {
            destination: "/500",
            permanent: false,
          },
        };
      }

      return {
        props: {
          categoryOptions,
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
  categoryOptions: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
};
const Page = ({ securityGroupData }: Props) => {
  return (
    <>
      <Meta
        description="Employee List Page"
        url="/teamName/inventory/employee"
      />
      <EmployeeListPage securityGroup={securityGroupData} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
