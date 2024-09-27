import { insertError } from "@/backend/api/post";
import CreateApplicationInformationRequestPage from "@/components/CreateApplicationInformationRequestPage/CreateApplicationInformationRequestPage";
import CreateGeneralAssessmentRequestPage from "@/components/CreateGeneralAssessmentRequestPage/CreateGeneralAssessmentRequestPage";
import CreateRequestPage from "@/components/CreateRequestPage/CreateRequestPage";
import CreateTechnicalAssessmentRequestPage from "@/components/CreateTechnicalAssessmentRequestPage/CreateTechnicalAssessmentRequestPage";
import Meta from "@/components/Meta/Meta";
import { isError } from "@/utils/functions";
import { FormWithResponseType } from "@/utils/types";
import { Space } from "@mantine/core";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabaseClient = createPagesServerClient(context);
  try {
    if (context.query.formId === "151cc6d7-94d7-4c54-b5ae-44de9f59d170") {
      return {
        redirect: {
          destination:
            "/public-form/16ae1f62-c553-4b0e-909a-003d92828036/create",
          permanent: false,
        },
      };
    }

    const { data, error } = await supabaseClient.rpc(
      "create_public_request_page_on_load",
      {
        input_data: {
          formId: context.query.formId,
          applicationInformationId: context.query.applicationInformationId,
          generalAssessmentId: context.query.generalAssessmentId,
        },
      }
    );
    if (error) throw error;

    return {
      props: data as Props,
    };
  } catch (e) {
    if (isError(e)) {
      await insertError(supabaseClient, {
        errorTableRow: {
          error_message: e.message,
          error_url: context.resolvedUrl,
          error_function: "getServerSideProps",
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
};

type Props = {
  form: FormWithResponseType;
};

const Page = ({ form }: Props) => {
  const formslyForm = () => {
    switch (form.form_name) {
      case "Application Information":
        return <CreateApplicationInformationRequestPage form={form} />;
      case "General Assessment":
        return <CreateGeneralAssessmentRequestPage form={form} />;
      case "Technical Assessment":
        return <CreateTechnicalAssessmentRequestPage form={form} />;
      default:
        return (
          <CreateRequestPage form={form} formslyFormName={form.form_name} />
        );
    }
  };
  return (
    <>
      <Meta
        description="Public Create Request Page"
        url="/public-form/[formId]/create"
      />
      <Space h="xl" />
      {form.form_is_formsly_form ? formslyForm() : null}
      {!form.form_is_formsly_form ? (
        <CreateRequestPage form={form} formslyFormName={form.form_name} />
      ) : null}
      <Space h="xl" />
    </>
  );
};

export default Page;
Page.Layout = "NOLAYOUT";
