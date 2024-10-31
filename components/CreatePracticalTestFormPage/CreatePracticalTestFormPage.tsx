import {
  checkPracticalTestLabel,
  getPositionTypeOptions,
} from "@/backend/api/get";
import { createPracticalTestForm } from "@/backend/api/post";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { FETCH_OPTION_LIMIT, MAX_TEXT_LENGTH } from "@/utils/constant";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { CreatePracticalTestFormType } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  MultiSelect,
  NumberInput,
  Paper,
  Space,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

type Props = {
  practicalTestData?: CreatePracticalTestFormType;
};

const CreatePracticalTestFormPage = ({ practicalTestData }: Props) => {
  const supabaseClient = useSupabaseClient<Database>();
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const { setIsLoading } = useLoadingActions();

  const isEdit = Boolean(practicalTestData);

  const [positionOptions, setPositionOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
  } = useForm<CreatePracticalTestFormType>({
    defaultValues: practicalTestData ?? {
      practical_test_id: "",
      practical_test_label: "",
      practical_test_passing_score: 0,
      practical_test_position_list: [],
      practical_test_question_list: [
        {
          practical_test_question: "",
          practical_test_question_weight: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "practical_test_question_list",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (!activeTeam.team_id) return;
        setIsLoading(true);
        const positionOptions = await getPositionTypeOptions(supabaseClient, {
          teamId: activeTeam.team_id,
          limit: FETCH_OPTION_LIMIT,
        });
        setPositionOptions(
          positionOptions.map((position) => {
            return { label: position.option_value, value: position.option_id };
          })
        );
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, [activeTeam.team_id]);

  const handleCreatePracticalTestForm = async (
    data: CreatePracticalTestFormType
  ) => {
    try {
      if (!teamMember) return;
      setIsLoading(true);
      let totalWeight = 0;
      data.practical_test_question_list.forEach(
        (question) => (totalWeight += question.practical_test_question_weight)
      );
      if (totalWeight !== 100) {
        notifications.show({
          message:
            "Invalid total weight. The total weight must be equal to 100",
          color: "orange",
        });
        return;
      }
      await createPracticalTestForm(supabaseClient, {
        ...data,
        teamMemberId: teamMember.team_member_id,
        teamId: teamMember.team_member_team_id,
      });
      notifications.show({
        message: `Practical Test ${isEdit ? "Edited" : "Created"}.`,
        color: "green",
      });
      await router.push(
        `/${formatTeamNameToUrlKey(
          activeTeam.team_name ?? ""
        )}/practical-test-form`
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    append({
      practical_test_question: "",
      practical_test_question_weight: 1,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    remove(index);
  };

  return (
    <Container>
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          {isEdit ? "Edit" : "Create"} Practical Test Form
        </Title>
      </Flex>
      <Space h="xl" />
      <form onSubmit={handleSubmit(handleCreatePracticalTestForm)}>
        <Stack spacing="xl">
          <Paper p="xl" shadow="sm">
            <Stack>
              <Controller
                control={control}
                name="practical_test_label"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChange={(e) => {
                      onChange(e.currentTarget.value.toUpperCase());
                    }}
                    withAsterisk
                    error={errors.practical_test_label?.message}
                    maxLength={MAX_TEXT_LENGTH}
                    label="Label"
                  />
                )}
                rules={{
                  required: "Label is required.",
                  validate: {
                    checkDuplicate: async (value) => {
                      if (value === practicalTestData?.practical_test_label)
                        return;

                      const isDuplicate = await checkPracticalTestLabel(
                        supabaseClient,
                        { label: value.trim() }
                      );
                      if (isDuplicate) return "Label already exists.";
                      return true;
                    },
                  },
                }}
              />
              <Controller
                control={control}
                name="practical_test_passing_score"
                render={({ field: { value, onChange } }) => (
                  <NumberInput
                    value={value}
                    onChange={onChange}
                    withAsterisk
                    error={errors.practical_test_passing_score?.message}
                    label="Passing Score"
                    max={100}
                    min={0}
                  />
                )}
                rules={{
                  required: "Passing score is required.",
                }}
              />
              <Controller
                control={control}
                name="practical_test_position_list"
                render={({ field: { value, onChange } }) => (
                  <MultiSelect
                    value={value}
                    onChange={onChange}
                    error={errors.practical_test_position_list?.message}
                    maxLength={MAX_TEXT_LENGTH}
                    label="Position"
                    data={positionOptions}
                    searchable
                  />
                )}
              />
            </Stack>
          </Paper>
          <Paper p="xl" shadow="sm">
            <Stack>
              <Title order={4} color="dimmed">
                Questions
              </Title>
              {fields.map((field, index) => (
                <Flex key={field.id} align="center" justify="center" gap="xs">
                  <Flex gap="xs" wrap="wrap" sx={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name={`practical_test_question_list.${index}.practical_test_question`}
                      render={({ field: { value, onChange } }) => (
                        <TextInput
                          value={value}
                          onChange={onChange}
                          withAsterisk
                          error={
                            errors.practical_test_question_list?.[index]
                              ?.practical_test_question?.message
                          }
                          maxLength={MAX_TEXT_LENGTH}
                          label={`Question #${index + 1}`}
                          sx={{ flex: 5 }}
                          miw={200}
                        />
                      )}
                      rules={{
                        required: "Question is required.",
                        validate: {
                          checkDuplicate: () => {
                            const questions = getValues(
                              "practical_test_question_list"
                            ).map(
                              (question) => question.practical_test_question
                            );
                            const questionSet = new Set();
                            for (const question of questions) {
                              if (questionSet.has(question)) {
                                return "Duplicate questions are not allowed";
                              }
                              questionSet.add(question);
                            }
                            return true;
                          },
                        },
                      }}
                    />
                    <Controller
                      control={control}
                      name={`practical_test_question_list.${index}.practical_test_question_weight`}
                      render={({ field: { value, onChange } }) => (
                        <NumberInput
                          value={value}
                          onChange={onChange}
                          withAsterisk
                          error={
                            errors.practical_test_question_list?.[index]
                              ?.practical_test_question_weight?.message
                          }
                          label={`Weight #${index + 1}`}
                          min={1}
                          max={100}
                          sx={{ flex: 1 }}
                          miw={200}
                        />
                      )}
                      rules={{
                        required: "Weight is required.",
                      }}
                    />
                  </Flex>
                  <ActionIcon
                    variant="light"
                    color="red"
                    mt={
                      errors.practical_test_question_list?.[index]
                        ?.practical_test_question_weight?.message ||
                      errors.practical_test_question_list?.[index]
                        ?.practical_test_question?.message
                        ? 0
                        : "lg"
                    }
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    <IconTrash size={14} color="red" />
                  </ActionIcon>
                </Flex>
              ))}
              <Button
                variant="light"
                rightIcon={<IconPlus size={14} />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </Stack>
          </Paper>
          <Button type="submit" disabled={!isDirty}>
            Submit
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default CreatePracticalTestFormPage;
