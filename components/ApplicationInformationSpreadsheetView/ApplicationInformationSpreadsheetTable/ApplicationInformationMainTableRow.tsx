import RequestSignerList from "@/components/RequestListPage/RequestSignerList";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { formatDate } from "@/utils/constant";
import { capitalizeEachWord, formatTeamNameToUrlKey } from "@/utils/string";
import { getStatusToColor } from "@/utils/styling";
import {
  ApplicationInformationSpreadsheetData,
  RequestListItemSignerType,
} from "@/utils/types";
import { Anchor, Badge, Center, createStyles, Text } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  parentTable: {
    "& td": {
      minWidth: 130,
      width: "100%",
    },
  },
  Request: {
    backgroundColor: theme.colors.blue[0],
  },
  Header: {
    backgroundColor: theme.colors.cyan[0],
  },
  "Personal Information": {
    backgroundColor: theme.colors.teal[0],
  },
}));

type Props = {
  item: ApplicationInformationSpreadsheetData;
  hiddenColumnList: string[];
};

const ApplicationInformationMainTableRow = ({
  item,
  hiddenColumnList,
}: Props) => {
  const { classes } = useStyles();
  const activeTeam = useActiveTeam();
  const teamMemberList = useTeamMemberList();

  const signerList = item.request_signer_list.map((signer) => {
    const signerTeamMemberData = teamMemberList.find(
      (member) =>
        member.team_member_id === signer.request_signer.signer_team_member_id
    );

    return {
      ...signer,
      signer_team_member_user: signerTeamMemberData?.team_member_user,
    };
  });

  return (
    <tr>
      {!hiddenColumnList.includes("Request ID") && (
        <td className={classes["Request"]}>
          <Anchor
            href={`/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/requests/${item.request_formsly_id}`}
            target="_blank"
          >
            {item.request_formsly_id}
          </Anchor>
        </td>
      )}

      {!hiddenColumnList.includes("Date Created") && (
        <td className={classes["Request"]}>
          {formatDate(new Date(item.request_date_created))}
        </td>
      )}
      {!hiddenColumnList.includes("Status") && (
        <td className={classes["Request"]}>
          <Center>
            <Badge
              variant="filled"
              color={getStatusToColor(item.request_status)}
            >
              {item.request_status}
            </Badge>
          </Center>
        </td>
      )}
      {!hiddenColumnList.includes("Date Updated") && (
        <td className={classes["Request"]}>
          {item.request_status_date_updated
            ? formatDate(new Date(item.request_status_date_updated))
            : ""}
        </td>
      )}
      {!hiddenColumnList.includes("Approver") && (
        <td className={classes["Request"]}>
          {signerList.length && teamMemberList.length ? (
            <RequestSignerList
              signerList={signerList as RequestListItemSignerType[]}
            />
          ) : null}
        </td>
      )}
      {!hiddenColumnList.includes("Score") && (
        <td className={classes["Request"]}>
          <Text>{item.request_score_value}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("Position") && (
        <td className={classes["Header"]}>
          <Text>
            {item.application_information_additional_details_position}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("First Name") && (
        <td className={classes["Personal Information"]}>
          <Text>
            {capitalizeEachWord(
              item.application_information_additional_details_first_name
            )}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("Middle Name") && (
        <td className={classes["Personal Information"]}>
          <Text>
            {item.application_information_additional_details_middle_name
              ? capitalizeEachWord(
                  item.application_information_additional_details_middle_name
                )
              : ""}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("Last Name") && (
        <td className={classes["Personal Information"]}>
          <Text>
            {capitalizeEachWord(
              item.application_information_additional_details_last_name
            )}
          </Text>
        </td>
      )}
    </tr>
  );
};

export default ApplicationInformationMainTableRow;
