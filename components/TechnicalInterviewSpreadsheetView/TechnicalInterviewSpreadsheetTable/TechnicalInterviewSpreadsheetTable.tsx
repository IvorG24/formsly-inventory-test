import { unsortableFieldList } from "@/utils/constant";
import { useStyles } from "@/utils/styling";
import { TechnicalInterviewSpreadsheetData } from "@/utils/types";
import {
  Button,
  Center,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowsVertical,
  IconArrowUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";
import TechnicalInterviewMainTableRow from "./TechnicalInterviewMainTableRow";

type Props = {
  data: TechnicalInterviewSpreadsheetData[];
  isLoading: boolean;
  page: number;
  handlePagination: (page: number) => void;
  sort: { sortBy: string; order: string };
  setSort: Dispatch<SetStateAction<{ sortBy: string; order: string }>>;
  isMax: boolean;
  hiddenColumnList: string[];
  handleUpdateTechnicalInterviewStatus: (
    status: string,
    data: TechnicalInterviewSpreadsheetData
  ) => void;
  handleCheckRow: (item: TechnicalInterviewSpreadsheetData) => Promise<boolean>;
  technicalInterviewNumber: number;
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

const TechnicalInterviewSpreadsheetTable = ({
  data,
  isLoading,
  page,
  handlePagination,
  sort,
  setSort,
  isMax,
  hiddenColumnList,
  handleUpdateTechnicalInterviewStatus,
  handleCheckRow,
  technicalInterviewNumber,
  handleAssignEvaluator,
  handleOverride,
}: Props) => {
  const { classes } = useStyles();
  const label = technicalInterviewNumber === 1 ? "Derpartment" : "Requestor";

  const columnList = [
    { field_id: "position", field_name: "Position" },
    { field_id: "application_information_full_name", field_name: "Name" },
    {
      field_id: "application_information_contact_number",
      field_name: "Contact Number",
    },
    { field_id: "application_information_email", field_name: "Email" },
    {
      field_id: "application_information_request_id",
      field_name: "Application Information Request ID",
    },
    {
      field_id: "application_information_score",
      field_name: "Application Information Score",
    },
    {
      field_id: "general_assessment_request_id",
      field_name: "General Assessment Request ID",
    },
    {
      field_id: "general_assessment_score",
      field_name: "General Assessment Score",
    },
    {
      field_id: "technical_assessment_request_id",
      field_name: "Technical Assessment Request ID",
    },
    {
      field_id: "technical_assessment_score",
      field_name: "Technical Assessment Score",
    },
    {
      field_id: "technical_interview_date_created",
      field_name: `${label} Interview Date Created`,
    },
    {
      field_id: "technical_interview_status",
      field_name: `${label} Interview Status`,
    },
    {
      field_id: "technical_interview_schedule",
      field_name: `${label} Interview Schedule`,
    },
    { field_id: "assigned_hr", field_name: "Assigned HR" },
    { field_id: "meeting_link", field_name: "Meeting Link" },
    { field_id: "evaluation", field_name: "Evaluation" },
    { field_id: "action", field_name: "Action" },
  ];

  const handleSortClick = (sortBy: string) => {
    setSort((prev) => {
      if (prev.sortBy === sortBy) {
        return {
          sortBy,
          order: prev.order === "ASC" ? "DESC" : "ASC",
        };
      } else {
        return {
          sortBy,
          order: "DESC",
        };
      }
    });
  };

  const sortButtons = (sortBy: string) => {
    return (
      <Group>
        {sort.sortBy !== sortBy && <IconArrowsVertical size={14} />}
        {sort.sortBy === sortBy && sort.order === "ASC" && (
          <IconArrowUp size={14} />
        )}
        {sort.sortBy === sortBy && sort.order === "DESC" && (
          <IconArrowDown size={14} />
        )}
      </Group>
    );
  };
  const renderTechnicalInterviewFieldList = () => {
    return columnList
      .filter((field) => !hiddenColumnList.includes(field.field_id))
      .map((field, index) => (
        <th
          key={index}
          onClick={
            !unsortableFieldList.includes(field.field_name)
              ? () => handleSortClick(field.field_id)
              : undefined
          }
          style={{
            cursor: !unsortableFieldList.includes(field.field_name)
              ? "pointer"
              : "default",
          }}
        >
          <Flex gap="xs" align="center" justify="space-between">
            <Text>{field.field_name}</Text>
            {!unsortableFieldList.includes(field.field_name) &&
              sortButtons(field.field_id)}
          </Flex>
        </th>
      ));
  };
  return (
    <Stack>
      <Paper p="xs" pos="relative">
        <ScrollArea type="auto" scrollbarSize={10}>
          <LoadingOverlay
            visible={isLoading}
            overlayBlur={0}
            overlayOpacity={0}
          />
          <Table withBorder withColumnBorders className={classes.parentTable}>
            <thead>
              <tr>{renderTechnicalInterviewFieldList()}</tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <TechnicalInterviewMainTableRow
                  key={item.application_information_request_id}
                  item={item}
                  hiddenColumnList={hiddenColumnList}
                  handleUpdateTechnicalInterviewStatus={
                    handleUpdateTechnicalInterviewStatus
                  }
                  handleCheckRow={handleCheckRow}
                  handleAssignEvaluator={handleAssignEvaluator}
                  handleOverride={handleOverride}
                />
              ))}
            </tbody>
          </Table>
        </ScrollArea>
        {!isMax && (
          <Center mt="md">
            <Button
              leftIcon={<IconChevronDown size={16} />}
              onClick={() => handlePagination(page + 1)}
              disabled={isLoading}
              variant="subtle"
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </Center>
        )}
      </Paper>
    </Stack>
  );
};

export default TechnicalInterviewSpreadsheetTable;
