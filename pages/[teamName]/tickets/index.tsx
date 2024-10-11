// Imports
import { getTicketListOnLoad } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TicketListPage from "@/components/TicketListPage/TicketListPage";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import { TicketCategoryTableRow, TicketListType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ user, supabaseClient }) => {
    try {
      const requestListData = await getTicketListOnLoad(supabaseClient, {
        userId: user.id,
      });

      return {
        props: requestListData,
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
  ticketList: TicketListType;
  ticketListCount: number;
  ticketCategoryList: TicketCategoryTableRow[];
};

const Page = ({ ticketList, ticketListCount, ticketCategoryList }: Props) => {
  return (
    <>
      <Meta description="Ticket List Page" url="/<teamName>/tickets" />
      <TicketListPage
        ticketList={ticketList}
        ticketListCount={ticketListCount}
        ticketCategoryList={ticketCategoryList}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
