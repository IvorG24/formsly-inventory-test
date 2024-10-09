import Meta from "@/components/Meta/Meta";
import ReportIncidentReportPage from "@/components/ReportIncidentReport/ReportIncidentReportPage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
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
        description="Incident Report Page"
        url="/{teamName}/report/incident-report"
      />
      <ReportIncidentReportPage />
    </>
  );
};

export default Page;
Page.Layout = "APP";
