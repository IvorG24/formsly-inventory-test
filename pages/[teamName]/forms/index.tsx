import Meta from "@/components/Meta/Meta";
import RequestFormListPage from "@/components/RequestFormListPage/RequestFormListPage";
import { sortFormList } from "@/utils/arrayFunctions/arrayFunctions";
import {
  DEFAULT_FORM_LIST_LIMIT,
  FORMSLY_FORM_ORDER,
  UNHIDEABLE_FORMLY_FORMS,
} from "@/utils/constant";
import { withOwnerOrApprover } from "@/utils/server-side-protections";
import { FormWithOwnerType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withOwnerOrApprover(
  async ({ supabaseClient, user }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "form_list_page_on_load",
        {
          input_data: {
            userId: user.id,
            limit: DEFAULT_FORM_LIST_LIMIT,
          },
        }
      );
      if (error) throw error;
      const formattedData = data as unknown as Props;
      return {
        props: {
          ...formattedData,
          formList: sortFormList(
            formattedData.formList,
            FORMSLY_FORM_ORDER
          ).filter(
            (form) =>
              (form.form_is_formsly_form &&
                !UNHIDEABLE_FORMLY_FORMS.includes(form.form_name)) ||
              !form.form_is_formsly_form
          ),
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
  formList: FormWithOwnerType[];
  formListCount: number;
  teamId: string;
};

const Page = ({ formList, formListCount, teamId }: Props) => {
  return (
    <>
      <Meta description="Form List Page" url="/teamName/forms/" />
      <RequestFormListPage
        formList={formList}
        formListCount={formListCount}
        teamId={teamId}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
