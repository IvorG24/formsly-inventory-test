import {
  checkIfGroupMember,
  checkIfOwnerOrAdmin,
  getPracticalTestForm,
} from "@/backend/api/get";
import CreatePracticalTestFormPage from "@/components/CreatePracticalTestFormPage/CreatePracticalTestFormPage";
import Meta from "@/components/Meta/Meta";
import { withActiveTeam } from "@/utils/server-side-protections";
import { CreatePracticalTestFormType } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ context, user, supabaseClient, userActiveTeam }) => {
    try {
      const iSHumanResourcesMember = await checkIfGroupMember(supabaseClient, {
        userId: user.id,
        groupName: ["HUMAN RESOURCES", "HUMAN RESOURCES VIEWER"],
        teamId: userActiveTeam.team_id,
      });
      if (!iSHumanResourcesMember) {
        return {
          redirect: {
            destination: "/401",
            permanent: false,
          },
        };
      }
      const checkIfAdmin = await checkIfOwnerOrAdmin(supabaseClient, {
        userId: user.id,
        teamId: userActiveTeam.team_id,
      });

      if (!checkIfAdmin) {
        return {
          redirect: {
            destination: "/401",
            permanent: false,
          },
        };
      }

      const practicalTestId = context.params?.practicalTestFormId as string;
      const practicalTestData = await getPracticalTestForm(supabaseClient, {
        practicalTestId,
      });

      return {
        props: { practicalTestData } as unknown as Props,
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
  practicalTestData: CreatePracticalTestFormType;
};
const Page = ({ practicalTestData }: Props) => {
  return (
    <>
      <Meta
        description="Practical Test Form Page"
        url="/teamName/practical-test-form/[practicalTestFormId]"
      />
      <CreatePracticalTestFormPage practicalTestData={practicalTestData} />
    </>
  );
};

export default Page;
Page.Layout = "APP";
