// Imports
import EventListPage from "@/components/AssetInventory/EventListPage/EventListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveGroup(
  async ({ securityGroupData }) => {
    try {
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
      <Meta description="Event List Page" url="/teamName/inventory/events" />
      <EventListPage />
    </>
  );
};

export default Page;
Page.Layout = "INVENTORY";
