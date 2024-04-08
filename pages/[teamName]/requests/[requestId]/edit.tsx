import { getEditRequestOnLoad } from "@/backend/api/get";
import EditItemRequestPage from "@/components/EditItemRequestPage/EditItemRequestPage";
import EditOtherExpensesRequestPage from "@/components/EditOtherExpenesesRequestPage/EditOtherExpenesesRequestPage";
import EditPEDEquipmentRequestPage from "@/components/EditPEDEquipmentRequestPage/EditPEDEquipmentRequestPage";
import EditPEDPartRequestPage from "@/components/EditPEDPartRequestPage/EditPEDPartRequestPage";
import EditServicesRequestPage from "@/components/EditServicesRequestPage/EditServicesRequestPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { FormType, FormWithResponseType, OptionTableRow } from "@/utils/types";
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
    } catch (error) {
      console.error(error);
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
  specialApprover?: {
    special_approver_id: string;
    special_approver_item_list: string[];
    special_approver_signer: FormType["form_signer"][0];
  }[];
  categoryOptions?: OptionTableRow[];
  duplicatableSectionIdList: string[];
  requestId: string;
};

const Page = ({
  form,
  projectOptions = [],
  specialApprover = [],
  // categoryOptions = [],
  duplicatableSectionIdList = [],
  requestId,
}: Props) => {
  const formslyForm = () => {
    switch (form.form_name) {
      case "Item":
        return (
          <EditItemRequestPage
            form={form}
            projectOptions={projectOptions}
            specialApprover={specialApprover}
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
      // case "PED Item":
      //   return (
      //     <EditPEDItemRequestPage
      //       request={request}
      //       projectOptions={projectOptions}
      //       itemOptions={itemOptions}
      //       propertyNumberOptions={propertyNumberOptions}
      //       referenceOnly={referenceOnly}
      //     />
      //   );

      // case "Request For Payment":
      //   return (
      //     <EditRequestForPaymentPage
      //       request={request}
      //       projectOptions={projectOptions}
      //       referenceOnly={referenceOnly}
      //       requestingProject={requestingProject}
      //     />
      //   );
    }
  };

  return (
    <>
      <Meta
        description="Edit Request Page"
        url="/<teamName>/requests/[requestId]/edit"
      />
      {form.form_is_formsly_form ? formslyForm() : null}
      {/* {!form.form_is_formsly_form ? (
        <EditRequestPage request={request} />
      ) : null} */}
    </>
  );
};

export default Page;
Page.Layout = "APP";
