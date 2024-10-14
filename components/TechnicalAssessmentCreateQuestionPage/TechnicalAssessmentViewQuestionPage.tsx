import {
  getPositionPerQuestionnaire,
  getPositionTypeOptions,
} from "@/backend/api/get";
import {
  handleDeleteTechnicalQuestion,
  updateQuestionnairePosition,
  updateTechnicalQuestion,
} from "@/backend/api/update";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserProfile,
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { JoyRideNoSSR } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  OptionTableRow,
  QuestionFields,
  QuestionnaireData,
  TechnicalQuestionFormValues,
} from "@/utils/types";
import {
  Accordion,
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  MultiSelect,
  Paper,
  Radio,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import QuestionnaireDetails from "./QuestionnaireDetails/QuestionnaireDetails";

type Section = TechnicalQuestionFormValues["sections"][0];
type Props = {
  questionnaireId: string;
  questionnaireData: QuestionnaireData;
};

const TechnicalAssessmentCreateQuestionPage = ({
  questionnaireId,
  questionnaireData: initialData,
}: Props) => {
  const { setIsLoading } = useLoadingActions();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const teamGroup = useUserTeamMemberGroupList();
  const activeTeam = useActiveTeam();
  const requestorProfile = useUserProfile();
  const [isJoyRideOpen, setIsJoyRideOpen] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { colors } = useMantineTheme();
  const supabaseClient = useSupabaseClient();
  const [positionOptions, setPositionOptions] = useState<OptionTableRow[]>([]);
  const questionnaireData: QuestionFields[] = initialData.fields;
  const [currentPosition, setCurrentPosition] = useState<string[]>([]);
  const questionnaireDetails = {
    questionnaire_name: initialData.questionnaire_name,
    questionnaire_date_created: initialData.questionnaire_date_created,
  };
  const [submittedQuestions, setSubmittedQuestions] = useState<
    Record<number, string>
  >({});
  const formMethods = useForm<TechnicalQuestionFormValues>({
    defaultValues: {
      sections: [
        {
          field_name: "Technical Question",
          question: "",
          section_is_duplicatable: false,
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
      positions: [], // MultiSelect for positions
    },
  });

  const { handleSubmit, register, watch, setValue, control, getValues } =
    formMethods;
  const { fields, remove } = useFieldArray({
    control: formMethods.control,
    name: "sections",
  });
  const watchedFieldResponse = useWatch({
    control,
    name: "positions",
  });

  const handleUpdateQuestionnairePosition = async (
    data: TechnicalQuestionFormValues
  ) => {
    try {
      if (!questionnaireId) return;
      if (!teamGroup.includes("HUMAN RESOURCES")) return;
      if (!teamMember) return;
      setIsLoading(true);

      const positions = data.positions as string[];

      await updateQuestionnairePosition(supabaseClient, {
        questionnaireId: questionnaireId,
        teamMemberId: teamMember?.team_member_id || "",
        position: positions,
      });
      notifications.show({
        message: "Questionnaire updated successfully",
        color: "green",
      });
      setIsLoading(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleUpdateQuestion = async (data: Section, questionIndex: number) => {
    try {
      if (!requestorProfile || !teamMember) return;
      if (!teamGroup.includes("HUMAN RESOURCES")) return;

      const trimmedQuestion = data.question.trim().toLowerCase();
      if (trimmedQuestion === "") {
        notifications.show({
          message: "Technical question is required.",
          color: "orange",
        });
        return;
      }

      for (const section of questionnaireData) {
        if (
          section.field_id !== data.field_id &&
          section.field_response.trim().toLowerCase() === trimmedQuestion
        ) {
          notifications.show({
            message: "Duplicate Question found.",
            color: "orange",
          });
          return;
        }
      }

      const choicesWithResponse = data.choices.filter(
        (choice) => choice.choice && choice.choice.trim() !== ""
      );

      if (choicesWithResponse.length < 2) {
        notifications.show({
          message: `At least two choices with valid responses are required`,
          color: "orange",
        });
        return;
      }

      const uniqueChoices = new Set(
        choicesWithResponse.map((choice) => choice.choice.trim().toLowerCase())
      );

      if (uniqueChoices.size !== choicesWithResponse.length) {
        notifications.show({
          message: `Duplicate choices found. Please provide unique choices.`,
          color: "orange",
        });
        return;
      }

      const correctAnswerSelected = choicesWithResponse.some(
        (choice) => choice.isCorrectAnswer && choice.choice.trim() !== ""
      );
      if (!correctAnswerSelected) {
        notifications.show({
          message: `No valid correct answer selected`,
          color: "orange",
        });
        return;
      }

      setIsLoading(true);

      await updateTechnicalQuestion(supabaseClient, {
        requestValues: {
          ...data,
          question: trimmedQuestion.trim(),
          choices: choicesWithResponse.map((choice) => ({
            ...choice,
            choice: choice.choice.trim(),
          })),
        },
        teamMemberId: teamMember.team_member_id || "",
        questionnaireId: questionnaireId,
      });
      setSubmittedQuestions((prev) => ({
        ...prev,
        [questionIndex]: data.question,
      }));
      notifications.show({
        message: "Questionnaire Updated.",
        color: "green",
      });
      setIsLoading(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again.",
        color: "red",
      });
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

  const openCancelInterviewModal = (sectionIndex: number, data: Section) =>
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">Are you sure you want to delete this question?</Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      onConfirm: () => handleDeleteQuestion(sectionIndex, data),
      confirmProps: { color: "red" },
      centered: true,
    });

  const handleDeleteQuestion = async (sectionIndex: number, data: Section) => {
    try {
      remove(sectionIndex);

      await handleDeleteTechnicalQuestion(supabaseClient, {
        fieldId: data.field_id,
      });
      notifications.show({
        message: "Question deleted.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      if (!activeTeam.team_id) return;
      setIsLoading(true);
      const positionOptions = await getPositionTypeOptions(supabaseClient, {
        teamId: activeTeam.team_id,
      });
      setPositionOptions(positionOptions);
      const positions = await getPositionPerQuestionnaire(supabaseClient, {
        questionnaireId: questionnaireId,
      });
      setCurrentPosition(positions);
      if (questionnaireData) {
        const sections = questionnaireData.map((question) => ({
          field_id: question.field_id,
          field_name: question.field_name,
          question: question.field_response,
          section_is_duplicatable: false,
          choices: question.field_options.map((choice) => ({
            field_id: choice.field_id,
            field_name: choice.field_name,
            choice: choice.field_response,
            isCorrectAnswer: choice.field_is_correct,
          })),
        }));
        formMethods.reset({ sections, positions: positions });
      } else {
        setIsJoyRideOpen(true);
      }
      setIsLoading(false);
    };
    fetchOptions();
  }, [activeTeam.team_id, questionnaireId]);

  useEffect(() => {
    if (positionOptions && watchedFieldResponse) {
      const isButtonDisabled =
        currentPosition.length === (watchedFieldResponse as string[]).length;
      setIsButtonDisabled(isButtonDisabled);
    }
  }, [currentPosition, watchedFieldResponse]);

  return (
    <Container>
      <JoyRideNoSSR
        steps={[
          {
            target: ".add-question",
            content: (
              <Text>
                To add questions, click the &ldquo;Add Questions&ldquo; button.
              </Text>
            ),
            disableBeacon: true,
          },
        ]}
        run={isJoyRideOpen}
        hideCloseButton
        disableCloseOnEsc
        disableOverlayClose
        hideBackButton
        styles={{ buttonNext: { backgroundColor: colors.blue[6] } }}
      />
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          View Technical Question
        </Title>
        <Button
          leftIcon={<IconPlus size={16} />}
          className="add-question"
          onClick={() =>
            router.push(
              `/${formatTeamNameToUrlKey(
                activeTeam.team_name
              )}/technical-question/${questionnaireId}/create`
            )
          }
        >
          Add Questions
        </Button>
      </Flex>
      <Space h="xl" />
      <Stack spacing={"xl"}>
        <QuestionnaireDetails questionnaireData={questionnaireDetails} />
        <Paper p={20} shadow="sm">
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(handleUpdateQuestionnairePosition)}>
              <Stack spacing="xl">
                <Controller
                  name="positions"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      label="Position"
                      searchable
                      required
                      withAsterisk
                      placeholder="Select positions"
                      data={positionOptions.map((option) => ({
                        value: option.option_value,
                        label: option.option_value,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />

                <Button disabled={isButtonDisabled} fullWidth type="submit">
                  Submit
                </Button>
              </Stack>
            </form>
          </FormProvider>
        </Paper>

        <Accordion variant="contained" sx={{ background: "white" }} multiple>
          {fields &&
            fields.length > 0 &&
            fields.map((question, questionIndex) => {
              const questionText =
                submittedQuestions[questionIndex] || ` ${question.question}`;

              return (
                <Accordion.Item
                  value={`question-${questionIndex}`}
                  key={question.id}
                >
                  <Flex justify="space-between" align="center">
                    <Accordion.Control>{questionText}</Accordion.Control>
                    <ActionIcon
                      mr="md"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCancelInterviewModal(
                          questionIndex,
                          getValues(`sections.${questionIndex}`)
                        );
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Flex>
                  <Accordion.Panel>
                    <Paper my={10} p={20} withBorder shadow="sm">
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
                        <TextInput
                          label={`Technical Question`}
                          required
                          withAsterisk
                          {...register(`sections.${questionIndex}.question`)}
                        />
                        {(watch(`sections.${questionIndex}.choices`) || []).map(
                          (_, choiceIndex) => (
                            <Flex key={choiceIndex} align="center" gap="md">
                              <Radio
                                checked={watch(
                                  `sections.${questionIndex}.choices.${choiceIndex}.isCorrectAnswer`
                                )}
                                label={`${String.fromCharCode(
                                  65 + choiceIndex
                                )} )`}
                                mt={24}
                                onChange={() =>
                                  handleRadioChange(questionIndex, choiceIndex)
                                }
                              />
                              <TextInput
                                required={
                                  choiceIndex === 0 || choiceIndex === 1
                                }
                                withAsterisk={
                                  choiceIndex === 0 || choiceIndex === 1
                                }
                                sx={{ flexGrow: 1 }}
                                {...register(
                                  `sections.${questionIndex}.choices.${choiceIndex}.choice`
                                )}
                              />
                            </Flex>
                          )
                        )}
                        <Button
                          onClick={() => {
                            const updatedQuestion = getValues(
                              `sections.${questionIndex}`
                            );
                            handleUpdateQuestion(
                              updatedQuestion,
                              questionIndex
                            ); // Pass the latest form values
                          }}
                        >
                          Update Question
                        </Button>
                      </Stack>
                    </Paper>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
        </Accordion>

        <Space h="sm" />
      </Stack>
    </Container>
  );
};

export default TechnicalAssessmentCreateQuestionPage;
