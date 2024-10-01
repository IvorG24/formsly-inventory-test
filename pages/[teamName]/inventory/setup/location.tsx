// Imports
import { getSiteList } from "@/backend/api/get";
import LocationSetupPage from "@/components/AssetInventory/LocationSetupPage/LocationSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { SiteTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, userActiveTeam }) => {
    try {
      const siteListData = await getSiteList(supabaseClient, {
        teamid: userActiveTeam.team_id,
      });

      return {
        props: {
          siteListData,
        } as Props,
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
  siteListData: SiteTableRow[];
};
const Page = ({ siteListData }: Props) => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/setup/location" />
      <LocationSetupPage siteListData={siteListData} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
