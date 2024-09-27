import { formatDate } from "@/utils/constant";
import { Paper, Stack, TextInput } from "@mantine/core";

type QuestionnaireData = {
  questionnaire_name: string;
  questionnaire_date_created: string;
};

type Props = {
  questionnaireData: QuestionnaireData;
};

const QuestionnaireDetails = ({ questionnaireData }: Props) => {
  return (
    <Paper shadow="sm" p={20}>
      <Stack spacing="md">
        <TextInput
          variant="filled"
          label="Questionnaire Name"
          value={questionnaireData.questionnaire_name}
          readOnly
        />
        <TextInput
          variant="filled"
          label="Date Created"
          value={formatDate(
            new Date(questionnaireData.questionnaire_date_created)
          )}
          readOnly
        />
      </Stack>
    </Paper>
  );
};

export default QuestionnaireDetails;
