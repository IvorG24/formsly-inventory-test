import Layout from "@/components/Layout/Layout";
import { createStyles } from "@mantine/core";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { InferGetServerSidePropsType } from "next";
import { ReactElement } from "react";

type IndexPageProps = { sampleProp: string };

const useStyles = createStyles((theme) => ({}));

export const getServerSideProps = async () => {
  // const res = await fetch('https://.../data')
  const res = { sampleProp: "sample" };
  // const data: IndexPageProps = await res.json();
  const data: IndexPageProps = res;

  // TODO: Put this in GSSP of index page.
  // if (!teamList) router.push(`/teams/create`);
  // if (teamList.length === 0) router.push(`/teams/create`);

  // if (!router.query.teamName) {
  //   router.push(`/teams/${teamList[0].name}`);
  // }

  return {
    props: {
      data,
    },
  };
};

function IndexPage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // will resolve data to type Data
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const { classes, cx } = useStyles();

  return <h1>index page {JSON.stringify(data)}</h1>;
}

export default IndexPage;

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};
