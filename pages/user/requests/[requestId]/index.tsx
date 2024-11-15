import { getRequestPageOnLoad } from "@/backend/api/get";
import ApplicationInformationRequestPage from "@/components/ApplicationInformationRequestPage/ApplicationInformationRequestPage";
import GeneralAssessmentRequestPage from "@/components/GeneralAssessmentRequestPage/GeneralAssessmentRequestPage";
import Meta from "@/components/Meta/Meta";
import RequestPage from "@/components/RequestPage/RequestPage";
import TechnicalAssessmentRequestPage from "@/components/TechnicalAssessmentRequestPage/TechnicalAssessmentRequestPage";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import { RequestWithResponseType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ supabaseClient, context }) => {
    try {
      const data = await getRequestPageOnLoad(supabaseClient, {
        requestId: context.query.requestId as string,
      });
      return {
        props: data as Props,
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
  request: RequestWithResponseType;
};

const Page = ({ request }: Props) => {
  const formslyForm = () => {
    if (request.request_form.form_name === "Application Information") {
      return <ApplicationInformationRequestPage request={request} />;
    } else if (request.request_form.form_name.includes("General Assessment")) {
      return <GeneralAssessmentRequestPage request={request} />;
    } else if (request.request_form.form_name === "Technical Assessment") {
      return <TechnicalAssessmentRequestPage request={request} />;
    } else {
      return <RequestPage request={request} isFormslyForm />;
    }
  };

  return (
    <>
      <Meta description="User Request Page" url="/user/requests/[requestId]" />

      {request.request_form.form_is_formsly_form ? formslyForm() : null}
      {!request.request_form.form_is_formsly_form ? (
        <RequestPage request={request} />
      ) : null}
    </>
  );
};

export default Page;
Page.Layout = "APP";
