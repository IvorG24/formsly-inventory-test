import ApplicationInformationRequestPage from "@/components/ApplicationInformationRequestPage/ApplicationInformationRequestPage";
import ApplicationInformationV1RequestPage from "@/components/ApplicationInformationV1RequestPage/ApplicationInformationV1RequestPage";
import BackgroundInvestigationRequestPage from "@/components/BackgroundInvestigationRequestPage/BackgroundInvestigationRequestPage";
import BillOfQuantityRequestPage from "@/components/BillOfQuantityRequestPage/BillOfQuantityRequestPage";
import { default as EquipmentServiceReportRequestPage } from "@/components/EquipmentServiceReportRequestPage/EquipmentServiceReportRequestPage";
import EvaluationResultRequestPage from "@/components/EvaluationResultRequestPage/EvaluationResultRequestPage";
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
import PettyCashVoucherBalanceRequestPage from "@/components/PettyCashVoucherBalanceRequestPage/PettyCashVoucherBalanceRequestPage";
import PettyCashVoucherRequestPage from "@/components/PettyCashVoucherRequestPage/PettyCashVoucherRequestPage";
import RequestForPaymentCodeRequestPage from "@/components/RequestForPaymentCodeRequestPage/RequestForPaymentCodeRequestPage";
import RequestForPaymentRequestPage from "@/components/RequestForPaymentRequestPage/RequestForPaymentRequestPage";
import RequestForPaymentv1RequestPage from "@/components/RequestForPaymentv1RequestPage/RequestForPaymentv1RequestPage";
import RequestPage from "@/components/RequestPage/RequestPage";
import ServicesRequestPage from "@/components/ServicesRequestPage/ServicesRequestPage";
import TechnicalAssessmentRequestPage from "@/components/TechnicalAssessmentRequestPage/TechnicalAssessmentRequestPage";
import { withAuthAndOnboardingRequestPage } from "@/utils/server-side-protections";
import { RequestWithResponseType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps =
  withAuthAndOnboardingRequestPage(
    async ({ supabaseClient, user, context }) => {
      try {
        const { data, error } = await supabaseClient.rpc(
          "request_page_on_load",
          {
            input_data: {
              requestId: context.query.requestId,
              userId: user.id,
            },
          }
        );
        if (error) throw error;
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
    } else if (
      request.request_form.form_name === "Petty Cash Voucher Balance"
    ) {
      return <PettyCashVoucherBalanceRequestPage request={request} />;
    } else if (
      request.request_form.form_name === "Application Information v1"
    ) {
      return <ApplicationInformationV1RequestPage request={request} />;
    } else if (request.request_form.form_name === "Application Information") {
      return <ApplicationInformationRequestPage request={request} />;
    } else if (request.request_form.form_name.includes("General Assessment")) {
      return <GeneralAssessmentRequestPage request={request} />;
    } else if (request.request_form.form_name === "Technical Assessment") {
      return <TechnicalAssessmentRequestPage request={request} />;
    } else if (request.request_form.form_name === "Evaluation Result") {
      return <EvaluationResultRequestPage request={request} />;
    } else if (request.request_form.form_name === "Background Investigation") {
      return <BackgroundInvestigationRequestPage request={request} />;
    } else {
      return <RequestPage request={request} isFormslyForm />;
    }
  };

  return (
    <>
      <Meta description="Request Page" url="/teamName/requests/[requestId]" />

      {request.request_form.form_is_formsly_form ? formslyForm() : null}
      {!request.request_form.form_is_formsly_form ? (
        <RequestPage request={request} />
      ) : null}
    </>
  );
};

export default Page;
Page.Layout = "APP";
