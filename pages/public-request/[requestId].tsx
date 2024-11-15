import {
  getRequestPageOnLoad,
  getTeam,
  getUserActiveTeamId,
} from "@/backend/api/get";
import { checkIfEmailExists } from "@/backend/api/post";
import ApplicationInformationRequestPage from "@/components/ApplicationInformationRequestPage/ApplicationInformationRequestPage";
import BillOfQuantityRequestPage from "@/components/BillOfQuantityRequestPage/BillOfQuantityRequestPage";
import EquipmentServiceReportRequestPage from "@/components/EquipmentServiceReportRequestPage/EquipmentServiceReportRequestPage";
import GeneralAssessmentRequestPage from "@/components/GeneralAssessmentRequestPage/GeneralAssessmentRequestPage";
import ITAssetRequestPage from "@/components/ITAssetRequestPage/ITAssetRequestPage";
import ItemRequestPage from "@/components/ItemRequestPage/ItemRequestPage";
import LiquidationReimbursementRequestPage from "@/components/LiquidationReimbursementRequestPage/LiquidationReimbursementRequestPage";
import Meta from "@/components/Meta/Meta";
import OtherExpensesRequestPage from "@/components/OtherExpensesRequestPage/OtherExpensesRequestPage";
import PEDEquipmentRequestPage from "@/components/PEDEquipmentRequestPage/PEDEquipmentRequestPage";
import PEDItemRequestPage from "@/components/PEDItemRequestPage/PEDItemRequestPage";
import PEDPartRequestPage from "@/components/PEDPartRequestPage/PEDPartRequestPage";
import PersonnelTransferRequisitionRequestPage from "@/components/PersonnelTransferRequisitionRequestPage/PersonnelTransferRequisitionRequestPage";
import PettyCashVoucherRequestPage from "@/components/PettyCashVoucherRequestPage/PettyCashVoucherRequestPage";
import RequestForPaymentCodeRequestPage from "@/components/RequestForPaymentCodeRequestPage/RequestForPaymentCodeRequestPage";
import RequestForPaymentRequestPage from "@/components/RequestForPaymentRequestPage/RequestForPaymentRequestPage";
import RequestForPaymentv1RequestPage from "@/components/RequestForPaymentv1RequestPage/RequestForPaymentv1RequestPage";
import RequestPage from "@/components/RequestPage/RequestPage";
import ServicesRequestPage from "@/components/ServicesRequestPage/ServicesRequestPage";
import TechnicalAssessmentRequestPage from "@/components/TechnicalAssessmentRequestPage/TechnicalAssessmentRequestPage";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { RequestWithResponseType } from "@/utils/types";
import { Space } from "@mantine/core";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabaseClient = createPagesServerClient(context);
  try {
    const requestId = context.query.requestId as string;
    const data = await getRequestPageOnLoad(supabaseClient, {
      requestId,
    });

    // * 1. Check if there is user active session
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session) {
      if (!session?.user?.email) {
        return {
          redirect: {
            destination: "/sign-in",
            permanent: false,
          },
        };
      }

      // * 2. Check if user is onboarded
      if (
        !(await checkIfEmailExists(supabaseClient, {
          email: session.user.email,
        }))
      ) {
        return {
          redirect: {
            destination: "/onboarding",
            permanent: false,
          },
        };
      }

      // * 3. Check if user has active team
      const user = session.user;

      const teamId = await getUserActiveTeamId(supabaseClient, {
        userId: user.id,
      });

      if (!teamId) {
        return {
          redirect: {
            destination: `/user/requests/${requestId}`,
            permanent: false,
          },
        };
      }

      const activeTeam = await getTeam(supabaseClient, { teamId });

      if (activeTeam) {
        return {
          redirect: {
            destination: `/${formatTeamNameToUrlKey(
              activeTeam.team_name
            )}/requests/${data.request.request_formsly_id}`,
            permanent: false,
          },
        };
      }
    }

    return {
      props: data,
    };
  } catch (e) {
    return {
      redirect: {
        destination: "/500",
        permanent: false,
      },
    };
  }
};

type Props = {
  request: RequestWithResponseType;
  duplicatableSectionIdList: string[];
  sectionIdWithDuplicatableSectionIdList: {
    request_response_duplicatable_section_id: string;
    section_id: string;
  }[];
};

const Page = ({
  request,
  duplicatableSectionIdList,
  sectionIdWithDuplicatableSectionIdList,
}: Props) => {
  const formslyForm = () => {
    if (request.request_form.form_name === "Item") {
      return (
        <ItemRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Services") {
      return (
        <ServicesRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Other Expenses") {
      return (
        <OtherExpensesRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "PED Equipment") {
      return (
        <PEDEquipmentRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "PED Part") {
      return (
        <PEDPartRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "PED Item") {
      return (
        <PEDItemRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Request For Payment v1") {
      return <RequestForPaymentv1RequestPage request={request} />;
    } else if (request.request_form.form_name === "IT Asset") {
      return (
        <ITAssetRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Liquidation Reimbursement") {
      return (
        <LiquidationReimbursementRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Bill of Quantity") {
      return (
        <BillOfQuantityRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (
      request.request_form.form_name === "Personnel Transfer Requisition"
    ) {
      return (
        <PersonnelTransferRequisitionRequestPage
          request={request}
          sectionIdWithDuplicatableSectionIdList={
            sectionIdWithDuplicatableSectionIdList
          }
        />
      );
    } else if (request.request_form.form_name === "Petty Cash Voucher") {
      return <PettyCashVoucherRequestPage request={request} />;
    } else if (request.request_form.form_name === "Equipment Service Report") {
      return (
        <EquipmentServiceReportRequestPage
          request={request}
          sectionIdWithDuplicatableSectionIdList={
            sectionIdWithDuplicatableSectionIdList
          }
        />
      );
    } else if (request.request_form.form_name === "Request For Payment") {
      return (
        <RequestForPaymentRequestPage
          request={request}
          sectionIdWithDuplicatableSectionIdList={
            sectionIdWithDuplicatableSectionIdList
          }
        />
      );
    } else if (request.request_form.form_name === "Request For Payment Code") {
      return (
        <RequestForPaymentCodeRequestPage
          request={request}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      );
    } else if (request.request_form.form_name === "Application Information") {
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
      <Meta
        description="Public Request Page"
        url="/public-request/[requestId]"
      />
      <Space h="xl" />
      {request.request_form.form_is_formsly_form ? formslyForm() : null}
      {!request.request_form.form_is_formsly_form ? (
        <RequestPage request={request} />
      ) : null}
      <Space h="xl" />
    </>
  );
};

export default Page;
Page.Layout = "HOME";
