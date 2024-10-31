import { insertError } from "@/backend/api/post";
import ApplicationProgressPage from "@/components/ApplicationProgressPage/ApplicationProgressPage";
import Meta from "@/components/Meta/Meta";
import { isError } from "@/utils/functions";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import {
  AttachmentTableRow,
  BackgroundCheckTableRow,
  HRPhoneInterviewTableRow,
  JobOfferTableRow,
  RequestViewRow,
  TechnicalInterviewTableRow,
  TradeTestTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ supabaseClient, context, user }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "get_user_application_progress_on_load",
        {
          input_data: {
            requestId: `${context.query.requestId}`,
            userEmail: user.email,
          },
        }
      );

      if (error) throw error;
      return {
        props: data as Props,
      };
    } catch (e) {
      if (isError(e)) {
        if (e.message === "403") {
          return {
            redirect: {
              destination: "/403",
              permanent: false,
            },
          };
        }

        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: context.resolvedUrl,
            error_function: "getServerSideProps",
            error_user_email: user.email,
            error_user_id: user.id,
          },
        });
      }
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
  applicationInformationData: RequestViewRow;
  generalAssessmentData?: RequestViewRow;
  technicalAssessmentData?: RequestViewRow;
  hrPhoneInterviewData?: HRPhoneInterviewTableRow;
  technicalInterview1Data?: TechnicalInterviewTableRow | null;
  technicalInterview2Data?: TechnicalInterviewTableRow | null;
  tradeTestData?: TradeTestTableRow | null;
  backgroundCheckData?: BackgroundCheckTableRow | null;
  jobOfferData?: (JobOfferTableRow & AttachmentTableRow) | null;
};

const Page = ({
  applicationInformationData,
  generalAssessmentData,
  technicalAssessmentData,
  hrPhoneInterviewData,
  technicalInterview1Data,
  technicalInterview2Data,
  tradeTestData,
  backgroundCheckData,
  jobOfferData,
}: Props) => {
  return (
    <>
      <Meta
        description="User Application Progress Page"
        url="/user/application-progress/[requestId]"
      />
      <ApplicationProgressPage
        applicationInformationData={applicationInformationData}
        generalAssessmentData={generalAssessmentData}
        technicalAssessmentData={technicalAssessmentData}
        hrPhoneInterviewData={hrPhoneInterviewData}
        technicalInterview1Data={technicalInterview1Data}
        technicalInterview2Data={technicalInterview2Data}
        tradeTestData={tradeTestData}
        backgroundCheckData={backgroundCheckData}
        jobOfferData={jobOfferData}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
