import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { formatDate, formatTime } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { capitalizeEachWord, formatTeamNameToUrlKey } from "@/utils/string";
import { getStatusToColor, mobileNumberFormatter } from "@/utils/styling";
import { TradeTestSpreadsheetData } from "@/utils/types";
import { Anchor, Badge, Button, createStyles, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";

const useStyles = createStyles((theme) => ({
  row: {
    "& td": {
      backgroundColor: theme.colors.blue[0],
    },
  },
}));

type Props = {
  item: TradeTestSpreadsheetData;
  hiddenColumnList: string[];
  handleUpdateTradeTestStatus: (
    status: string,
    data: TradeTestSpreadsheetData
  ) => void;
  handleCheckRow: (item: TradeTestSpreadsheetData) => Promise<boolean>;
};

const TradeTestMainTableRow = ({
  item,
  hiddenColumnList,
  handleUpdateTradeTestStatus,
  handleCheckRow,
}: Props) => {
  const { classes } = useStyles();
  const team = useActiveTeam();
  const teamMember = useUserTeamMember();

  const [isOverriding, setIsOverriding] = useState(false);

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
      onConfirm: async () => handleUpdateTradeTestStatus(action, item),
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
      {!hiddenColumnList.includes("trade_test_date_created") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {formatDate(new Date(item.trade_test_date_created))}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("trade_test_status") && (
        <td>
          <Badge
            variant="filled"
            color={getStatusToColor(item.trade_test_status)}
          >
            {item.trade_test_status}
          </Badge>
        </td>
      )}
      {!hiddenColumnList.includes("trade_test_schedule") && (
        <td>
          {item.trade_test_schedule ? (
            <>
              <Text sx={{ whiteSpace: "nowrap" }}>
                Date: {formatDate(new Date(item.trade_test_schedule))}
              </Text>
              <Text sx={{ whiteSpace: "nowrap" }}>
                Time: {formatTime(new Date(item.trade_test_schedule))}
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
      <td>
        {item.trade_test_status === "PENDING" &&
          teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
          !isOverriding && (
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
                    if (result) {
                      setIsOverriding(true);
                    }
                  },
                })
              }
            >
              Override
            </Button>
          )}
        {(teamMember?.team_member_id === item.assigned_hr_team_member_id ||
          isOverriding) &&
          item.trade_test_status === "PENDING" && (
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

export default TradeTestMainTableRow;
