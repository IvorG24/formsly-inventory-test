import Meta from "@/components/Meta/Meta";
import UserItemAnalyticsPage from "@/components/UserItemAnalyticsPage/UserItemAnalyticsPage";
import { withOwnerOrApprover } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withOwnerOrApprover(
  async () => {
    try {
      return {
        props: {},
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
      <Meta
        description="Item Analytics Page"
        url="/{teamName}/item-analytics"
      />
      <UserItemAnalyticsPage />
    </>
  );
};

export default Page;
Page.Layout = "APP";
