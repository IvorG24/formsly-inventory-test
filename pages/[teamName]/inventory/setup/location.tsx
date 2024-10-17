// Imports
import { getSiteList } from "@/backend/api/get";
import LocationSetupPage from "@/components/AssetInventory/LocationSetupPage/LocationSetupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { SecurityGroupData, SiteTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam, securityGroupData }) => {
    try {
      const { data } = await getSiteList(supabaseClient, {
        teamid: userActiveTeam.team_id,
      });
      const hasViewOnlyPersmissions =
        securityGroupData.privileges.location.view === true;

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
          data,
          securityGroupData,
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
  data: SiteTableRow[];
  securityGroupData: SecurityGroupData;
};
const Page = ({ data, securityGroupData }: Props) => {
  return (
    <>
      <Meta description="Request List Page" url="/teamName/setup/location" />
      <LocationSetupPage
        securityGroup={securityGroupData}
        siteListData={data}
      />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
