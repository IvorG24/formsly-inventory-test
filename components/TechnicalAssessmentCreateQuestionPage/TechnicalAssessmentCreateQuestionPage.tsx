import {
  checkIfQuestionExists,
  createTechnicalQuestions,
} from "@/backend/api/post";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { TechnicalQuestionFormValues } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Paper,
  Radio,
  Space,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import QuestionnaireDetails from "./QuestionnaireDetails/QuestionnaireDetails";

type Props = {
  questionnaireId: string;
  questionnaireData: {
    questionnaire_name: string;
    questionnaire_date_created: string;
  };
};
const TechnicalAssessmentCreateQuestionPage = ({
  questionnaireId,
  questionnaireData,
}: Props) => {
  const { setIsLoading } = useLoadingActions();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const requestorProfile = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const questionnaireDetails = {
    questionnaire_name: questionnaireData.questionnaire_name,
    questionnaire_date_created: questionnaireData.questionnaire_date_created,
  };
  const formMethods = useForm<TechnicalQuestionFormValues>({
    defaultValues: {
      sections: [
        {
          field_id: "",
          field_name: "Technical Question",
          question: "",
          choices: [
            {
              field_name: "Question Choice 1",
              choice: "",
              isCorrectAnswer: false,
            },
            {
              field_name: "Question Choice 2",
              choice: "",
              isCorrectAnswer: false,
            },
            {
              field_name: "Question Choice 3",
              choice: "",
              isCorrectAnswer: false,
            },
            {
              field_name: "Question Choice 4",
              choice: "",
              isCorrectAnswer: false,
            },
          ],
        },
      ],
    },
  });

  const { handleSubmit, register, watch, setValue } = formMethods;
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: "sections",
  });

  const handleCreateRequest = async (data: TechnicalQuestionFormValues) => {
    try {
      setIsLoading(true);
      if (!requestorProfile || !teamMember) return;

      const isQuestionExisting = await checkIfQuestionExists(supabaseClient, {
        data,
        questionnaireId: questionnaireId,
      });

      if (isQuestionExisting) {
        notifications.show({
          message: "Question already exists.",
          color: "orange",
        });
        return;
      }

      const uniqueQuestions = new Set();
      for (const questionData of data.sections) {
        const trimmedQuestion = questionData.question.trim().toLowerCase();

        if (uniqueQuestions.has(trimmedQuestion)) {
          notifications.show({
            message: `Duplicate question found: ${trimmedQuestion}`,
            color: "orange",
          });
          return;
        }
        uniqueQuestions.add(trimmedQuestion);

        const choicesWithResponse = questionData.choices
          .slice(0, 2)
          .filter((choice) => choice.choice.trim() !== "");

        const hasDuplicateChoices =
          new Set(
            choicesWithResponse.map((choice) =>
              choice.choice.trim().toLowerCase()
            )
          ).size !== choicesWithResponse.length;

        if (choicesWithResponse.length < 2 || hasDuplicateChoices) {
          let message = `At least two choices with valid responses are required`;

          if (hasDuplicateChoices) {
            message = `Duplicate choices are not allowed`;
          }

          notifications.show({
            message,
            color: "orange",
          });
          return;
        }

        const correctAnswerSelected = questionData.choices.some(
          (choice) => choice.isCorrectAnswer && choice.choice.trim() !== "" // Trim correct answer
        );
        if (!correctAnswerSelected) {
          notifications.show({
            message: `No valid correct answer selected for: ${trimmedQuestion}`,
            color: "orange",
          });
          return;
        }
      }

      await createTechnicalQuestions(supabaseClient, {
        requestFormValues: data,
        questionnaireId: questionnaireId,
      });
      notifications.show({
        message: "Technical question created successfully.",
        color: "green",
      });
      router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/technical-question/${questionnaireId}`
      );
    } catch (e) {
      notifications.show({
        message: "An error occurred, please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadioChange = (questionIndex: number, choiceIndex: number) => {
    const choices = watch(`sections.${questionIndex}.choices`);
    choices.forEach((_, idx) =>
      setValue(
        `sections.${questionIndex}.choices.${idx}.isCorrectAnswer`,
        false
      )
    );

    setValue(
      `sections.${questionIndex}.choices.${choiceIndex}.isCorrectAnswer`,
      true
    );
  };

  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Technical Question
      </Title>
      <Space h="xl" />
      <Stack spacing={"xl"}>
        <QuestionnaireDetails questionnaireData={questionnaireDetails} />
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(handleCreateRequest)}>
            {fields.map((question, questionIndex) => (
              <Paper my={10} p={20} key={question.id} withBorder shadow="sm">
                {question.section_is_duplicatable && (
                  <Group position="right">
                    <ActionIcon
                      onClick={() => remove(questionIndex)}
                      color="red"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                )}
                <Stack spacing="xl">
                  <Stack>
                    <TextInput
                      label={`Technical Question`}
                      required
                      withAsterisk
                      {...register(`sections.${questionIndex}.question`)}
                    />

                    {watch(`sections.${questionIndex}.choices`).map(
                      (_, choiceIndex) => {
                        return (
                          <Flex key={choiceIndex} align="center" gap="md">
                            <Radio
                              checked={watch(
                                `sections.${questionIndex}.choices.${choiceIndex}.isCorrectAnswer`
                              )}
                              label={`${String.fromCharCode(65 + choiceIndex)} )`}
                              mt={24}
                              onChange={() =>
                                handleRadioChange(questionIndex, choiceIndex)
                              }
                            />
                            <TextInput
                              label={`Question Choice ${choiceIndex + 1}`}
                              required={choiceIndex === 0 || choiceIndex === 1}
                              withAsterisk={
                                choiceIndex === 0 || choiceIndex === 1
                              }
                              sx={{ flexGrow: 1 }}
                              {...register(
                                `sections.${questionIndex}.choices.${choiceIndex}.choice`
                              )}
                            />
                          </Flex>
                        );
                      }
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Space h="sm" />
            <Button
              leftIcon={<IconPlus size={18} />}
              variant="outline"
              color="blue"
              fullWidth
              onClick={() =>
                append({
                  field_id: "",
                  field_name: "Technical Question",
                  question: "",
                  section_is_duplicatable: true,
                  choices: [
                    {
                      field_id: "",
                      field_name: "Question Choice 1",
                      choice: "",
                      isCorrectAnswer: false,
                    },
                    {
                      field_id: "",
                      field_name: "Question Choice 2",
                      choice: "",
                      isCorrectAnswer: false,
                    },
                    {
                      field_id: "",
                      field_name: "Question Choice 3",
                      choice: "",
                      isCorrectAnswer: false,
                    },
                    {
                      field_id: "",
                      field_name: "Question Choice 4",
                      choice: "",
                      isCorrectAnswer: false,
                    },
                  ],
                })
              }
            >
              Add New Question
            </Button>
            <Space h="lg" />
            <Button fullWidth type="submit">
              Submit
            </Button>
          </form>
        </FormProvider>
      </Stack>
    </Container>
  );
};

export default TechnicalAssessmentCreateQuestionPage;
