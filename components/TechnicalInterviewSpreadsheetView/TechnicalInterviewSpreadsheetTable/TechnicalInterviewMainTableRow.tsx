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
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconCopy, IconSquareCheck, IconVideo } from "@tabler/icons-react";

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
  handleOverride: (hrTeamMemberId: string, rowId: string) => void;
};

const TechnicalInterviewMainTableRow = ({
  item,
  hiddenColumnList,
  handleUpdateTechnicalInterviewStatus,
  handleCheckRow,
  handleOverride,
}: Props) => {
  const { classes } = useStyles();

  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const teamMemberGroupList = useUserTeamMemberGroupList();

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
          {item.meeting_link && (
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
      <td>
        {teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
          teamMemberGroupList.includes("HUMAN RESOURCES") &&
          item.technical_interview_status === "PENDING" && (
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
          item.technical_interview_status === "PENDING" && (
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
