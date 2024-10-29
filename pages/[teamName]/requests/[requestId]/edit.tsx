import { getEditRequestOnLoad } from "@/backend/api/get";
import EditBillOfQuantityRequestPage from "@/components/EditBillOfQuantityRequestPage/EditBillOfQuantityRequestPage";
import EditITAssetRequestPage from "@/components/EditITAssetRequestPage/EditITAssetRequestPage";
import EditItemRequestPage from "@/components/EditItemRequestPage/EditItemRequestPage";
import EditLiquidReimbursementRequestPage from "@/components/EditLiquidationReimbursementRequestPage/EditLiquidationReimbursementRequestPage";
import EditOtherExpensesRequestPage from "@/components/EditOtherExpenesesRequestPage/EditOtherExpenesesRequestPage";
import EditPEDEquipmentRequestPage from "@/components/EditPEDEquipmentRequestPage/EditPEDEquipmentRequestPage";
import EditPEDItemRequestPage from "@/components/EditPEDItemRequestPage/EditPEDItemRequestPage";
import EditPEDPartRequestPage from "@/components/EditPEDPartRequestPage/EditPEDPartRequestPage";
import EditPettyCashVoucherBalanceRequestPage from "@/components/EditPettyCashVoucherBalancePage/EditPettyCashVoucherBalancePage";
import EditPettyCashVoucherRequestPage from "@/components/EditPettyCashVoucherRequestPage/EditPettyCashVoucherRequestPage";
import EditRequestForPaymentPage from "@/components/EditRequestForPaymentv1Page/EditRequestForPaymentv1Page";
import EditRequestPage from "@/components/EditRequestPage/EditRequestPage";
import EditServicesRequestPage from "@/components/EditServicesRequestPage/EditServicesRequestPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { FormWithResponseType, OptionTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, user, context }) => {
    try {
      const referenceOnly = Boolean(context.query.referenceOnly === "true");
      const editRequestOnLoad = await getEditRequestOnLoad(supabaseClient, {
        userId: user.id,
        requestId: `${context.query.requestId}`,
        referenceOnly,
      });

      return {
        props: {
          ...editRequestOnLoad,
          referenceOnly,
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
  form: FormWithResponseType;
  projectOptions?: OptionTableRow[];
  duplicatableSectionIdList: string[];
  requestId: string;
  departmentOptions?: OptionTableRow[];
  bankListOptions?: OptionTableRow[];
  uomOptions?: OptionTableRow[];
  equipmentCodeOptions?: OptionTableRow[];
};

const Page = ({
  form,
  projectOptions = [],
  duplicatableSectionIdList = [],
  requestId,
  departmentOptions = [],
  bankListOptions = [],
  uomOptions = [],
  equipmentCodeOptions = [],
}: Props) => {
  const formslyForm = () => {
    switch (form.form_name) {
      case "Item":
        return (
          <EditItemRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "Services":
        return (
          <EditServicesRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "Other Expenses":
        return (
          <EditOtherExpensesRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "PED Equipment":
        return (
          <EditPEDEquipmentRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "PED Part":
        return (
          <EditPEDPartRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "PED Item":
        return (
          <EditPEDItemRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );
      case "Request For Payment v1":
        return (
          <EditRequestForPaymentPage
            form={form}
            projectOptions={projectOptions}
            requestId={requestId}
          />
        );
      case "IT Asset":
        return (
          <EditITAssetRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );

      case "Liquidation Reimbursement":
        return (
          <EditLiquidReimbursementRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
            bankListOptions={bankListOptions}
          />
        );

      case "Bill of Quantity":
        return (
          <EditBillOfQuantityRequestPage
            form={form}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
          />
        );

      case "Petty Cash Voucher":
        return (
          <EditPettyCashVoucherRequestPage
            form={form}
            projectOptions={projectOptions}
            duplicatableSectionIdList={duplicatableSectionIdList}
            requestId={requestId}
            departmentOptions={departmentOptions}
            bankListOptions={bankListOptions}
            uomOptions={uomOptions}
            equipmentCodeOptions={equipmentCodeOptions}
          />
        );

      case "Petty Cash Voucher Balance":
        return (
          <EditPettyCashVoucherBalanceRequestPage
            requestId={requestId}
            form={form}
          />
        );
    }
  };

  return (
    <>
      <Meta
        description="Edit Request Page"
        url="/<teamName>/requests/[requestId]/edit"
      />
      {form.form_is_formsly_form ? formslyForm() : null}
      {!form.form_is_formsly_form ? (
        <EditRequestPage
          requestId={requestId}
          form={form}
          duplicatableSectionIdList={duplicatableSectionIdList}
        />
      ) : null}
    </>
  );
};

export default Page;
Page.Layout = "APP";
