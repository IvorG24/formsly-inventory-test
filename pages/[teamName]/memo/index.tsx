import { getMemoList } from "@/backend/api/get";
import MemoListPage from "@/components/Memo/MemoListPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { MemoListItemType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ supabaseClient, userActiveTeam }) => {
    try {
      const { data, count } = await getMemoList(supabaseClient, {
        teamId: userActiveTeam.team_id,
        page: 1,
        limit: 13,
      });

      return {
        props: { memoList: data, memoListCount: count },
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
  memoList: MemoListItemType[];
  memoListCount: number;
};

const Page = ({ memoList, memoListCount }: Props) => {
  return (
    <>
      <Meta description="Create Memo Page" url="/teamName/memo/" />
      <MemoListPage memoList={memoList} memoListCount={memoListCount} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
