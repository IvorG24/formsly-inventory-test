import { getForm } from "@/backend/api/get";
import ApplicationInformationFormPage from "@/components/ApplicationInformationFormPage/ApplicationInformationFormPage";
import ITAssetFormPage from "@/components/ITAssetFormPage/ITAssetFormPage";
import ItemFormPage from "@/components/ItemFormPage/ItemFormPage";
import Meta from "@/components/Meta/Meta";
import OtherExpensesFormPage from "@/components/OtherExpensesFormPage/OtherExpensesFormPage";
import PEDEquipmentFormPage from "@/components/PEDEquipmentFormPage/PEDEquipmentFormPage";
import PEDItemFormPage from "@/components/PEDItemFormPage/PEDItemFormPage";
import PEDPartFormPage from "@/components/PEDPartFormPage/PEDPartFormPage";
import RequestFormPage from "@/components/RequestFormPage/RequestFormPage";
import ServicesFormPage from "@/components/ServicesFormPage/ServicesFormPage";
import TechnicalAssessmentFormPage from "@/components/TechnicalAssessmentFormPage/TechnicalAssessmentFormPage";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { withOwnerOrApprover } from "@/utils/server-side-protections";
import {
  InitialFormType,
  TeamGroupTableRow,
  TeamProjectTableRow,
} from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withOwnerOrApprover(
  async ({ supabaseClient, user, context }) => {
    try {
      const form = await getForm(supabaseClient, {
        formId: `${context.query.formId}`,
      });

      const { data, error } = await supabaseClient.rpc("form_page_on_load", {
        input_data: {
          userId: user.id,
          isFormslyForm: form.form_is_formsly_form,
          formName: form.form_name,
          limit: ROW_PER_PAGE,
        },
      });
      if (error) throw error;

      return {
        props: { ...(data as unknown as Props), form },
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
  form: InitialFormType;
  teamGroupList: TeamGroupTableRow[];
  teamProjectList?: TeamProjectTableRow[];
  teamProjectListCount?: number;
};

const Page = ({
  form,
  teamGroupList = [],
  teamProjectList = [],
  teamProjectListCount = 0,
}: Props) => {
  const teamMemberList = useTeamMemberList("OWNER & APPROVER");
  const formslyForm = () => {
    switch (form.form_name) {
      case "Item":
        return (
          <ItemFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "Services":
        return (
          <ServicesFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "Other Expenses":
        return (
          <OtherExpensesFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "PED Equipment":
        return (
          <PEDEquipmentFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "PED Part":
        return (
          <PEDPartFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "PED Item":
        return (
          <PEDItemFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "IT Asset":
        return (
          <ITAssetFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "Application Information":
        return (
          <ApplicationInformationFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );
      case "Technical Assessment":
        return (
          <TechnicalAssessmentFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
          />
        );

      default:
        return (
          <RequestFormPage
            form={form}
            teamMemberList={teamMemberList}
            teamGroupList={teamGroupList}
            teamProjectList={teamProjectList}
            teamProjectListCount={teamProjectListCount}
            isFormslyForm={true}
          />
        );
    }
  };

  return (
    <>
      <Meta description="Request Page" url="/teamName/forms/[formId]" />
      {form.form_is_formsly_form ? formslyForm() : null}
      {!form.form_is_formsly_form ? (
        <RequestFormPage
          form={form}
          teamMemberList={teamMemberList}
          teamGroupList={teamGroupList}
          teamProjectList={teamProjectList}
          teamProjectListCount={teamProjectListCount}
          isFormslyForm={false}
        />
      ) : null}
    </>
  );
};

export default Page;
Page.Layout = "APP";
