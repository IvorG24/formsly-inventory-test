// Imports
import { checkIfOwnerOrAdmin } from "@/backend/api/get";
import EventCreatePage from "@/components/AssetInventory/EventListPage/EventCreatePage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData, supabaseClient, user, userActiveTeam }) => {
    try {
      const isOwnerOrAdmin = await checkIfOwnerOrAdmin(supabaseClient, {
        userId: user.id,
        teamId: userActiveTeam.team_id,
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
// type Props = {
//   securityGroupData: SecurityGroupData;
// };
const Page = () => {
  return (
    <>
      <Meta
        description="Event List Page"
        url="/teamName/inventory/events/create"
      />
      <EventCreatePage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
