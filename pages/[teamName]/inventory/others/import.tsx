// Imports
import { checkIfOwnerOrAdmin, getCategoryOptions } from "@/backend/api/get";
import ImportPage from "@/components/AssetInventory/ImportPage/ImportPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { CategoryTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ supabaseClient, userActiveTeam, user }) => {
    try {
      const { data: category } = await getCategoryOptions(supabaseClient, {
        teamId: userActiveTeam.team_id,
      });
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
          category,
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
  category: CategoryTableRow[];
};

const Page = ({ category }: Props) => {
  return (
    <>
      <Meta
        description="Asset List Page"
        url="/teamName/inventory/others/import"
      />
      <ImportPage category={category} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
