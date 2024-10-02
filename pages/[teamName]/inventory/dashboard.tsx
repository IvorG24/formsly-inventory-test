// Imports
import { getColumnList } from "@/backend/api/get";
import DashboardPage from "@/components/AssetInventory/DashboardPage/DashboardPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient }) => {
    try {
      const fieldData = await getColumnList(supabaseClient);

      return {
        props: {fieldData},
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
  fieldData: {
    label: string;
    value: string;
  }[];
};
const Page = ({ fieldData }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/inventory/dashboard"
      />
      <DashboardPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
