// Imports
import { getEventFormDetails } from "@/backend/api/get";
import EventEditPage from "@/components/AssetInventory/EventListPage/EventEditPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { createEventFormvalues, SecurityGroupData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData, supabaseClient, context }) => {
    try {
      const eventFormDefaultValues = await getEventFormDetails(supabaseClient, {
        eventId: context.query.eventId as string,
      });

      return {
        props: {
          securityGroupData,
          eventFormDefaultValues,
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
  securityGroupData: SecurityGroupData;
  eventFormDefaultValues: createEventFormvalues;
};
const Page = ({ eventFormDefaultValues }: Props) => {
  return (
    <>
      <Meta
        description="Event List Page"
        url="/teamName/inventory/[eventId]/edit"
      />
      <EventEditPage eventFormDefaultValues={eventFormDefaultValues} />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
