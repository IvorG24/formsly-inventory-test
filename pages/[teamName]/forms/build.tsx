import { getBuildFormpageOnLoad } from "@/backend/api/get";
import BuildRequestFormPage from "@/components/BuildRequestFormPage/BuildRequestFormPage";
import Meta from "@/components/Meta/Meta";
import { withOwnerOrApprover } from "@/utils/server-side-protections";
import { TeamGroupTableRow } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withOwnerOrApprover(
  async ({ supabaseClient, user }) => {
    try {
      const data = await getBuildFormpageOnLoad(supabaseClient, {
        userId: user.id,
      });

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
