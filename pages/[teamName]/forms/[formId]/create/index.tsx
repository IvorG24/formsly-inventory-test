import CreateBillOfQuantityRequestPage from "@/components/CreateBillOfQuantityRequestPage/CreateBillOfQuantityRequestPage";
import CreateEquipmentServiceReportRequestPage from "@/components/CreateEquipmentServiceReportRequestPage/CreateEquipmentServiceReportRequestPage";
import CreateEvaluationResultRequestPage from "@/components/CreateEvaluationResultRequestPage/CreateEvaluationResultRequestPage";
import CreateITAssetRequestPage from "@/components/CreateITAssetRequestPage.tsx/CreateITAssetRequestPage";
import CreateItemRequestPage from "@/components/CreateItemRequestPage/CreateItemRequestPage";
import CreateLiquidationReimbursementRequestPage from "@/components/CreateLiquidationReimbursementRequestPage/CreateLiquidationReimbursementRequestPage";
import CreateOtherExpensesRequestPage from "@/components/CreateOtherExpensesRequestPage/CreateOtherExpensesRequestPage";
import CreatePEDEquipmentRequestPage from "@/components/CreatePEDEquipmentRequestPage/CreatePEDEquipmentRequestPage";
import CreatePEDItemRequestPage from "@/components/CreatePEDItemRequestPage/CreatePEDItemRequestPage";
import CreatePEDPartRequestPage from "@/components/CreatePEDPartRequestPage/CreatePEDPartRequestPage";
import CreatePersonnelTransferRequisition from "@/components/CreatePersonnelTransferRequisition/CreatePersonnelTransferRequisition";
import CreatePettyCashVoucherBalancePage from "@/components/CreatePettyCashVoucherBalancePage/CreatePettyCashVoucherBalancePage";
import CreatePettyCashVoucherRequestPage from "@/components/CreatePettyCashVoucherRequestPage/CreatePettyCashVoucherRequestPage";
import CreateRequestForPaymentCodePage from "@/components/CreateRequestForPaymentCodePage/CreateRequestForPaymentCodePage";
import CreateRequestForPaymentPage from "@/components/CreateRequestForPaymentPage/CreateRequestForPaymentPage";
import CreateRequestForPaymentv1Page from "@/components/CreateRequestForPaymentv1Page/CreateRequestForPaymentv1Page";
import CreateRequestPage from "@/components/CreateRequestPage/CreateRequestPage";
import CreateServicesRequestPage from "@/components/CreateServicesRequestPage/CreateServicesRequestPage";
import Meta from "@/components/Meta/Meta";
import { withAuthAndOnboarding } from "@/utils/server-side-protections";
import {
  ConnectedRequestFormProps,
  FormWithResponseType,
  OptionTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withAuthAndOnboarding(
  async ({ supabaseClient, user, context }) => {
    try {
      const connectedRequestFormslyId =
        context.query.lrf ?? context.query.rfp ?? context.query.wav;

      const { data, error } = await supabaseClient.rpc(
        "create_request_page_on_load",
        {
          input_data: {
            formId: context.query.formId,
            userId: user.id,
            connectedRequestFormslyId: connectedRequestFormslyId
              ? connectedRequestFormslyId
              : null,
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
  form: FormWithResponseType;
  projectOptions?: OptionTableRow[];
  sourceProjectList?: Record<string, string>;
  requestProjectId: string;
  requestingProject?: string;
  categoryOptions?: OptionTableRow[];
  connectedRequest?: ConnectedRequestFormProps;
  departmentOptions?: OptionTableRow[];
  allProjectOptions?: OptionTableRow[];
  bankListOptions?: OptionTableRow[];
  uomOptions?: OptionTableRow[];
  equipmentCodeOptions?: OptionTableRow[];
};

const Page = ({
  form,
  projectOptions = [],
  categoryOptions = [],
  connectedRequest,
  departmentOptions = [],
  allProjectOptions = [],
  bankListOptions = [],
  uomOptions = [],
  equipmentCodeOptions = [],
}: Props) => {
  const formslyForm = () => {
    switch (form.form_name) {
      case "Item":
        return (
          <CreateItemRequestPage form={form} projectOptions={projectOptions} />
        );
      case "Services":
        return (
          <CreateServicesRequestPage
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "Other Expenses":
        return (
          <CreateOtherExpensesRequestPage
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "PED Equipment":
        return (
          <CreatePEDEquipmentRequestPage
            form={form}
            projectOptions={projectOptions}
            categoryOptions={categoryOptions}
          />
        );
      case "PED Part":
        return (
          <CreatePEDPartRequestPage
            form={form}
            projectOptions={projectOptions}
            categoryOptions={categoryOptions}
          />
        );
      case "PED Item":
        return (
          <CreatePEDItemRequestPage
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "Request For Payment v1":
        return (
          <CreateRequestForPaymentv1Page
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "IT Asset":
        return (
          <CreateITAssetRequestPage
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "Liquidation Reimbursement":
        return (
          <CreateLiquidationReimbursementRequestPage
            form={form}
            projectOptions={projectOptions}
            bankListOptions={bankListOptions}
          />
        );
      case "Bill of Quantity":
        return (
          <CreateBillOfQuantityRequestPage
            form={form}
            connectedRequest={connectedRequest}
          />
        );
      case "Personnel Transfer Requisition":
        return (
          <CreatePersonnelTransferRequisition
            form={form}
            projectOptions={projectOptions}
          />
        );
      case "Petty Cash Voucher":
        return (
          <CreatePettyCashVoucherRequestPage
            form={form}
            projectOptions={projectOptions}
            departmentOptions={departmentOptions}
            bankListOptions={bankListOptions}
            uomOptions={uomOptions}
            equipmentCodeOptions={equipmentCodeOptions}
          />
        );
      case "Equipment Service Report":
        return (
          <CreateEquipmentServiceReportRequestPage
            form={form}
            projectOptions={projectOptions}
            categoryOptions={categoryOptions}
          />
        );
      case "Request For Payment":
        return (
          <CreateRequestForPaymentPage
            form={form}
            projectOptions={projectOptions}
            departmentOptions={departmentOptions}
            allProjectOptions={allProjectOptions}
          />
        );
      case "Request For Payment Code":
        return (
          <CreateRequestForPaymentCodePage
            form={form}
            connectedRequest={connectedRequest}
          />
        );
      case "Petty Cash Voucher Balance":
        return (
          <CreatePettyCashVoucherBalancePage
            form={form}
            connectedRequest={connectedRequest}
          />
        );
      case "Evaluation Result":
        return <CreateEvaluationResultRequestPage form={form} />;
      default:
        return (
          <CreateRequestPage form={form} formslyFormName={form.form_name} />
        );
    }
  };
  return (
    <>
      <Meta
        description="Create Request Page"
        url="/teamName/forms/[formId]/create"
      />

      {form.form_is_formsly_form ? formslyForm() : null}
      {!form.form_is_formsly_form ? (
        <CreateRequestPage form={form} formslyFormName={form.form_name} />
      ) : null}
    </>
  );
};

export default Page;
Page.Layout = "APP";
