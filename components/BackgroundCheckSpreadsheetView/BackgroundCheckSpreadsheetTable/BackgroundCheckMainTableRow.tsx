import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { BASE_URL, formatDate } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { capitalizeEachWord, formatTeamNameToUrlKey } from "@/utils/string";
import { getStatusToColor, mobileNumberFormatter } from "@/utils/styling";
import { BackgroundCheckSpreadsheetData } from "@/utils/types";
import { Anchor, Badge, Button, createStyles, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { Dispatch, SetStateAction } from "react";

const useStyles = createStyles((theme) => ({
  row: {
    "& td": {
      backgroundColor: theme.colors.blue[0],
    },
  },
}));

type Props = {
  item: BackgroundCheckSpreadsheetData;
  hiddenColumnList: string[];
  setData: Dispatch<SetStateAction<BackgroundCheckSpreadsheetData[]>>;
  handleCheckRow: (item: BackgroundCheckSpreadsheetData) => Promise<boolean>;
  handleOverride: (hrTeamMemberId: string, rowId: string) => void;
};

const BackgroundCheckMainTableRow = ({
  item,
  hiddenColumnList,
  handleCheckRow,
  handleOverride,
}: Props) => {
  const { classes } = useStyles();
  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const teamMemberGroupList = useUserTeamMemberGroupList();

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
      {!hiddenColumnList.includes("background_check_date_created") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {formatDate(new Date(item.background_check_date_created))}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("background_check_status") && (
        <td>
          <Badge
            variant="filled"
            color={getStatusToColor(item.background_check_status)}
          >
            {item.background_check_status}
          </Badge>
        </td>
      )}
      {!hiddenColumnList.includes("assigned_hr") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>{item.assigned_hr}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("background_investigation") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.background_check_evaluation_request_id
            }`}
          >
            {item.background_check_evaluation_request_id}
          </Anchor>
        </td>
      )}
      <td>
        {item.background_check_status === "PENDING" &&
          teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
          teamMemberGroupList.includes("HUMAN RESOURCES") && (
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
                        item.background_check_id
                      );
                    }
                  },
                })
              }
            >
              Override
            </Button>
          )}

        {item.background_check_status === "PENDING" &&
          teamMember?.team_member_id === item.assigned_hr_team_member_id && (
            <Flex align="center" justify="center" gap="xs" wrap="wrap">
              <Button
                color="blue"
                w={140}
                onClick={() =>
                  window.open(
                    `${BASE_URL}/${formatTeamNameToUrlKey(
                      team.team_name
                    )}/forms/7a68b494-0459-4d9a-9cf3-b86fe106489a/create?backgroundCheckId=${
                      item.background_check_id
                    }`,
                    "_blank"
                  )
                }
              >
                Evaluate
              </Button>
            </Flex>
          )}
      </td>
    </tr>
  );
};

export default BackgroundCheckMainTableRow;
