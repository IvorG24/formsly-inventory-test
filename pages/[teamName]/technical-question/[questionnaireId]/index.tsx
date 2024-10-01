import {
  checkIfGroupMember,
  getTechnicalOptionsItem,
  getUserActiveTeamId,
} from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TechnicalAssessmentViewQuestionPage from "@/components/TechnicalAssessmentCreateQuestionPage/TechnicalAssessmentViewQuestionPage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { QuestionnaireData } from "@/utils/types";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ context, user, supabaseClient, userActiveTeam }) => {
    try {
      const questionnaireId = context.params?.questionnaireId as string;
      const iSHumanResourcesMember = await checkIfGroupMember(supabaseClient, {
        userId: user.id,
        groupName: "HUMAN RESOURCES",
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
      const getTeam = await getUserActiveTeamId(supabaseClient, {
        userId: user.id,
      });

      const questionnaireData = await getTechnicalOptionsItem(supabaseClient, {
        teamId: getTeam,
        questionnaireId: questionnaireId,
      });

      return {
        props: { questionnaireId, questionnaireData } as unknown as Props,
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
  questionnaireId: string;
  questionnaireData: QuestionnaireData;
};
const Page = ({ questionnaireId, questionnaireData }: Props) => {
  return (
    <>
      <Meta
        description="Request List Page"
        url="/teamName/technical-question/[questionnaireId]"
      />
      <TechnicalAssessmentViewQuestionPage
        questionnaireData={questionnaireData}
        questionnaireId={questionnaireId}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
