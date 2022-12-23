import FormsPage from "@/components/FormsPage/FormsPage";
import TeamLayout from "@/components/Layout/TeamLayout";
import Meta from "@/components/Meta/Meta";
import {
  FetchTeamRequestFormList,
  fetchTeamRequestFormList,
} from "@/utils/queries";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import type { NextPageWithLayout } from "../../../_app";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) throw new Error("Not authorized");

    const teamRequestFormList = await fetchTeamRequestFormList(
      supabase,
      ctx.params?.tid as string
    );

    return {
      props: {
        formList: teamRequestFormList,
      },
    };
  } catch (error) {
    return {
      props: { formList: null },
    };
  }
};

type Props = {
  formList: FetchTeamRequestFormList;
};

const Forms: NextPageWithLayout<Props> = ({ formList }) => {
  return (
    <div>
      {/* todo: fix meta tags */}
      <Meta
        description="Forms Page for every form"
        url="localhost:3000/forms"
      />
      <FormsPage teamRequestFormList={formList} />
    </div>
  );
};

Forms.getLayout = function getLayout(page: ReactElement) {
  return <TeamLayout>{page}</TeamLayout>;
};

export default Forms;
