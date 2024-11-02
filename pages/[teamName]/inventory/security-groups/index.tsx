// Imports
import { checkIfOwnerOrAdmin } from "@/backend/api/get";
import SecurityGroupPage from "@/components/AssetInventory/SecurityGroupPage/SecurityGroupPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ user, userActiveTeam, supabaseClient }) => {
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
