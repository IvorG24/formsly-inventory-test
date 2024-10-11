import BuildRequestFormPage from "@/components/BuildRequestFormPage/BuildRequestFormPage";
import Meta from "@/components/Meta/Meta";
import { withOwnerOrApprover } from "@/utils/server-side-protections";
import { TeamGroupTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withOwnerOrApprover(
  async ({ supabaseClient, user }) => {
    try {
      const { data, error } = await supabaseClient.rpc(
        "build_form_page_on_load",
        {
          input_data: {
            userId: user.id,
          },
        }
      );
      if (error) throw error;

      return {
        props: { ...(data as unknown as Props) },
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
  formId: string;
  groupList: TeamGroupTableRow[];
};

const Page = ({ formId, groupList }: Props) => {
  return (
    <>
      <Meta description="Build Request Page" url="/teamName/forms/build" />
      <BuildRequestFormPage formId={formId} groupList={groupList} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
