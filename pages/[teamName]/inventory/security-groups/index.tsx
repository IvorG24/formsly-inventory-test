// Imports
import { getAssetListFilterOptions, getColumnList } from "@/backend/api/get";
import SecurityGroupPage from "@/components/AssetInventory/SecurityGroupPage/SecurityGroupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
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

const Page = () => {
  return (
    <>
      <Meta description="Check in List Page" url="/teamName/security-groups" />
      <SecurityGroupPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
