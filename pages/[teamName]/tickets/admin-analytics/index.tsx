// Imports
import { getTicketCategoryList } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TicketAdminAnalytics from "@/components/TicketAdminAnalytics/TicketAdminAnalytics";
import { withActiveTeam } from "@/utils/server-side-protections";
import { TeamMemberType, TicketCategoryTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient }) => {
    try {
      const ticketCategoryList = await getTicketCategoryList(supabaseClient);
      return { props: { ticketCategoryList } };
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
  teamAdminList: TeamMemberType[];
  ticketCategoryList: TicketCategoryTableRow[];
};

const Page = ({ ticketCategoryList }: Props) => {
  return (
    <>
      <Meta
        description="Ticket Admin Analytics Page"
        url="/<teamName>/tickets/admin-analytics"
      />

      <TicketAdminAnalytics ticketCategoryList={ticketCategoryList} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
