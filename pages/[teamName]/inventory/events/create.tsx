// Imports
import EventCreatePage from "@/components/AssetInventory/EventListPage/EventCreatePage";
import Meta from "@/components/Meta/Meta";
import { withActiveGroup } from "@/utils/server-side-protections";
import { SecurityGroupData } from "@/utils/types";
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
type Props = {
  securityGroupData: SecurityGroupData;
};
const Page = ({ securityGroupData }: Props) => {
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
