import { getTeamGroupMember } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { formatDate, formatTime } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { capitalizeEachWord, formatTeamNameToUrlKey } from "@/utils/string";
import { getStatusToColor, mobileNumberFormatter } from "@/utils/styling";
import { TechnicalInterviewSpreadsheetData } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  CopyButton,
  createStyles,
  Flex,
  Group,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCopy, IconSquareCheck, IconVideo } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const useStyles = createStyles((theme) => ({
  row: {
    "& td": {
      backgroundColor: theme.colors.blue[0],
    },
  },
}));

type Props = {
  item: TechnicalInterviewSpreadsheetData;
  hiddenColumnList: string[];
  handleUpdateTechnicalInterviewStatus: (
    status: string,
    data: TechnicalInterviewSpreadsheetData
  ) => void;
  handleCheckRow: (item: TechnicalInterviewSpreadsheetData) => Promise<boolean>;
  handleAssignEvaluator: (
    data: { evaluatorId: string; evaluatorName: string },
    interviewId: string,
    formslyId: string,
    candidateData: {
      name: string;
      position: string;
    },
    meetingLink: string,
    schedule: string
  ) => Promise<void>;
  handleOverride: (hrTeamMemberId: string, rowId: string) => void;
};

const TechnicalInterviewMainTableRow = ({
  item,
  hiddenColumnList,
  handleUpdateTechnicalInterviewStatus,
  handleCheckRow,
  handleAssignEvaluator,
  handleOverride,
}: Props) => {
  const { classes } = useStyles();
  const supabaseClient = useSupabaseClient();

  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const teamMemberGroupList = useUserTeamMemberGroupList();

  const [isFetching, setIsFetching] = useState(false);
  const [evaluatorOptions, setEvaluatorOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<{
    evaluatorId: string;
    evaluatorName: string;
  }>({ defaultValues: { evaluatorId: "", evaluatorName: "" } });

  const statusColor: Record<string, string> = {
    QUALIFIED: "green",
    "NOT QUALIFIED": "red",
    "NOT RESPONSIVE": "gray",
  };

  const openModal = (action: string) =>
    modals.openConfirmModal({
      title: <Text>Please confirm your action.</Text>,
      children: (
        <Text>{`Are you sure this applicant is ${action.toLocaleLowerCase()}?`}</Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: statusColor[action] },
      onConfirm: async () => handleUpdateTechnicalInterviewStatus(action, item),
    });

  const assignEvaluatorModal = (options: { label: string; value: string }[]) =>
    modals.open({
      title: <Text>Assign Evaluator</Text>,
      onClose: () => {
        reset();
      },
      children: (
        <>
          <form
            onSubmit={handleSubmit(async (data) => {
              modals.closeAll();
              await handleAssignEvaluator(
                data,
                item.technical_interview_id,
                item.application_information_request_id,
                {
                  name: item.application_information_full_name,
                  position: item.position,
                },
                item.meeting_link,
                item.technical_interview_schedule
              );
            })}
          >
            <Controller
              name="evaluatorId"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: "Evaluator is required.",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Select
                  label="Evaluator"
                  searchable
                  placeholder="Select Evaluator"
                  data={options}
                  value={value}
                  onChange={(value) => {
                    if (value) {
                      const evaluator = options.find(
                        (data) => data.value === value
                      );
                      if (!evaluator) return;
                      setValue("evaluatorName", evaluator.label);
                    }
                    onChange(value);
                  }}
                  required
                  withinPortal
                />
              )}
            />
            <Group position="right" mt="xl">
              <Button
                color="red"
                variant="default"
                onClick={() => modals.closeAll()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button color="blue" type="submit" disabled={isSubmitting}>
                Confirm
              </Button>
            </Group>
          </form>
        </>
      ),
      centered: true,
    });

  const handleOpenEvaluatorModal = async () => {
    try {
      setIsFetching(true);
      let options = evaluatorOptions;
      if (!options.length) {
        const data = await getTeamGroupMember(supabaseClient, {
          groupId: "fb2bdd4f-c2dd-4dd8-ab02-25deee7ca13d",
        });
        const groupMemberList = data.map((evaluator) => {
          return {
            value: evaluator.team_member_id,
            label: [
              evaluator.team_member_user.user_first_name,
              evaluator.team_member_user.user_last_name,
            ].join(" "),
          };
        });
        setEvaluatorOptions(groupMemberList);
        options = groupMemberList;
      }

      assignEvaluatorModal(options);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetching(false);
    }
  };

  if (!team.team_name) return null;
  return (
    <tr className={classes.row}>
      {!hiddenColumnList.includes("position") && (
        <td>
          <Text>{safeParse(item.position)}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_full_name") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {capitalizeEachWord(item.application_information_full_name)}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_contact_number") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {mobileNumberFormatter(item.application_information_contact_number)}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_email") && (
        <td>
          <Text>{item.application_information_email}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.application_information_request_id
            }`}
          >
            {item.application_information_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_score") && (
        <td>
          <Text>{item.application_information_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("general_assessment_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.general_assessment_request_id
            }`}
          >
            {item.general_assessment_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("general_assessment_score") && (
        <td>
          <Text>{item.general_assessment_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("technical_assessment_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.technical_assessment_request_id
            }`}
          >
            {item.technical_assessment_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("technical_assessment_score") && (
        <td>
          <Text>{item.technical_assessment_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("technical_interview_date_created") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {formatDate(new Date(item.technical_interview_date_created))}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("technical_interview_status") && (
        <td>
          <Badge
            variant="filled"
            color={getStatusToColor(item.technical_interview_status)}
          >
            {item.technical_interview_status}
          </Badge>
        </td>
      )}
      {!hiddenColumnList.includes("technical_interview_schedule") && (
        <td>
          {item.technical_interview_schedule ? (
            <>
              <Text sx={{ whiteSpace: "nowrap" }}>
                Date: {formatDate(new Date(item.technical_interview_schedule))}
              </Text>
              <Text sx={{ whiteSpace: "nowrap" }}>
                Time: {formatTime(new Date(item.technical_interview_schedule))}
              </Text>
            </>
          ) : (
            ""
          )}
        </td>
      )}
      {!hiddenColumnList.includes("assigned_hr") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>{item.assigned_hr}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("meeting_link") && (
        <td>
          {item.meeting_link &&
            item.technical_interview_status === "PENDING" && (
              <Flex align="center" justify="center" gap="xs">
                <Button
                  className="meeting-link"
                  onClick={() => window.open(item.meeting_link, "_blank")}
                  variant="outline"
                  leftIcon={<IconVideo size={14} />}
                >
                  Join Meeting
                </Button>
                <CopyButton value={item.meeting_link}>
                  {({ copied, copy }) =>
                    copied ? (
                      <ActionIcon onClick={copy} color="green" variant="light">
                        <IconSquareCheck size={14} />
                      </ActionIcon>
                    ) : (
                      <ActionIcon onClick={copy} color="blue" variant="light">
                        <IconCopy size={14} />
                      </ActionIcon>
                    )
                  }
                </CopyButton>
              </Flex>
            )}
        </td>
      )}
      {!hiddenColumnList.includes("evaluation") && (
        <td>
          {item.technical_interview_evaluator_team_member_id &&
            !item.technical_interview_evaluation_request_id && (
              <Stack spacing="xs">
                <Flex align="center" gap="xs">
                  <Text sx={{ whiteSpace: "nowrap" }}>
                    Evaluator:{" "}
                    <b>{item.technical_interview_assigned_evaluator}</b>
                  </Text>
                  <CopyButton value={item.technical_interview_evaluation_link}>
                    {({ copied, copy }) =>
                      copied ? (
                        <ActionIcon
                          onClick={copy}
                          color="green"
                          variant="light"
                        >
                          <IconSquareCheck size={14} />
                        </ActionIcon>
                      ) : (
                        <Tooltip label="Copy evaluation form link">
                          <ActionIcon
                            onClick={copy}
                            color="blue"
                            variant="light"
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )
                    }
                  </CopyButton>
                </Flex>
                <Button
                  variant="outline"
                  onClick={handleOpenEvaluatorModal}
                  loading={isFetching}
                >
                  Change Evaluator
                </Button>
              </Stack>
            )}
          {item.technical_interview_evaluation_request_id ? (
            <Anchor
              target="_blank"
              href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
                item.technical_interview_evaluation_request_id
              }`}
            >
              {item.technical_interview_evaluation_request_id}
            </Anchor>
          ) : null}
          {teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
            teamMemberGroupList.includes("HUMAN RESOURCES") &&
            item.technical_interview_status === "PENDING" &&
            !item.technical_interview_evaluator_team_member_id && (
              <Button
                w={140}
                onClick={() =>
                  modals.openConfirmModal({
                    title: "Confirm Override",
                    centered: true,
                    children: (
                      <Text size="sm">
                        Are you sure you want to override this application?
                      </Text>
                    ),
                    labels: { confirm: "Confirm", cancel: "Cancel" },
                    onConfirm: async () => {
                      const result = await handleCheckRow(item);
                      if (result && teamMember) {
                        handleOverride(
                          teamMember.team_member_id,
                          item.technical_interview_id
                        );
                      }
                    },
                  })
                }
              >
                Override
              </Button>
            )}
          {teamMember?.team_member_id === item.assigned_hr_team_member_id &&
            item.technical_interview_status === "PENDING" &&
            !item.technical_interview_evaluator_team_member_id && (
              <Flex align="center" justify="center" gap="xs" wrap="wrap">
                <Button onClick={handleOpenEvaluatorModal} loading={isFetching}>
                  Assign Evaluator
                </Button>
              </Flex>
            )}
        </td>
      )}
      <td>
        {teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
          teamMemberGroupList.includes("HUMAN RESOURCES") &&
          item.technical_interview_status === "PENDING" &&
          !item.technical_interview_evaluator_team_member_id && (
            <Button
              w={140}
              onClick={() =>
                modals.openConfirmModal({
                  title: "Confirm Override",
                  centered: true,
                  children: (
                    <Text size="sm">
                      Are you sure you want to override this application?
                    </Text>
                  ),
                  labels: { confirm: "Confirm", cancel: "Cancel" },
                  onConfirm: async () => {
                    const result = await handleCheckRow(item);
                    if (result && teamMember) {
                      handleOverride(
                        teamMember.team_member_id,
                        item.technical_interview_id
                      );
                    }
                  },
                })
              }
            >
              Override
            </Button>
          )}
        {teamMember?.team_member_id === item.assigned_hr_team_member_id &&
          item.technical_interview_status === "PENDING" &&
          !item.technical_interview_evaluator_team_member_id && (
            <Flex align="center" justify="center" gap="xs" wrap="wrap">
              <Button
                color="green"
                w={140}
                onClick={() => openModal("QUALIFIED")}
              >
                Qualified
              </Button>
              <Button
                color="red"
                w={140}
                onClick={() => openModal("NOT QUALIFIED")}
              >
                Not Qualified
              </Button>
              <Button
                color="gray"
                w={140}
                onClick={() => openModal("NOT RESPONSIVE")}
              >
                Not Responsive
              </Button>
            </Flex>
          )}
      </td>
    </tr>
  );
};

export default TechnicalInterviewMainTableRow;
