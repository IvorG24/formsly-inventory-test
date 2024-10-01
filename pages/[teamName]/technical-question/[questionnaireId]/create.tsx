import { checkIfGroupMember, getQuestionnaireDetails } from "@/backend/api/get";
import Meta from "@/components/Meta/Meta";
import TechnicalAssessmentCreateQuestionPage from "@/components/TechnicalAssessmentCreateQuestionPage/TechnicalAssessmentCreateQuestionPage";
import { withActiveTeam } from "@/utils/server-side-protections";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = withActiveTeam(
  async ({ context, supabaseClient, user, userActiveTeam }) => {
    try {
      const questionnaireId = context.query?.questionnaireId;
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
      const questionnaireData = await getQuestionnaireDetails(
        supabaseClient,
        questionnaireId as string
      );

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
  questionnaireData: {
    questionnaire_name: string;
    questionnaire_date_created: string;
  };
};

const Page = ({ questionnaireId, questionnaireData }: Props) => {
  return (
    <>
      <Meta
        description="Create technical question Page"
        url="/teamName/technical-question/[questionnaireId]/create"
      />
      <TechnicalAssessmentCreateQuestionPage
        questionnaireId={questionnaireId}
        questionnaireData={questionnaireData}
      />
    </>
  );
};

export default Page;
Page.Layout = "APP";
