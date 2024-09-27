import { unsortableFieldList } from "@/utils/constant";
import { useStyles } from "@/utils/styling";
import { HRPhoneInterviewSpreadsheetData } from "@/utils/types";
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
import HRPhoneInterviewMainTableRow from "./HRPhoneInterviewMainTableRow";

const columnList = [
  { field_id: "position", field_name: "Position", field_type: "TEXT" },
  {
    field_id: "application_information_full_name",
    field_name: "Name",
    field_type: "TEXT",
  },
  {
    field_id: "application_information_contact_number",
    field_name: "Contact Number",
    field_type: "NUMBER",
  },
  {
    field_id: "application_information_email",
    field_name: "Email",
    field_type: "TEXT",
  },
  {
    field_id: "application_information_request_id",
    field_name: "Application Information Request ID",
    field_type: "NUMBER",
  },
  {
    field_id: "application_information_score",
    field_name: "Application Information Score",
    field_type: "TEXT",
  },
  {
    field_id: "general_assessment_request_id",
    field_name: "General Assessment Request ID",
    field_type: "TEXT",
  },
  {
    field_id: "general_assessment_score",
    field_name: "General Assessment Score",
    field_type: "NUMBER",
  },
  {
    field_id: "technical_assessment_request_id",
    field_name: "Technical Assessment Request ID",
    field_type: "TEXT",
  },
  {
    field_id: "technical_assessment_score",
    field_name: "Technical Assessment Score",
    field_type: "NUMBER",
  },
  {
    field_id: "hr_phone_interview_date_created",
    field_name: "HR Phone Interview Date Created",
    field_type: "DATE",
  },
  {
    field_id: "hr_phone_interview_status",
    field_name: "HR Phone Interview Status",
    field_type: "TEXT",
  },
  {
    field_id: "hr_phone_interview_schedule",
    field_name: "HR Phone Interview Schedule",
    field_type: "DATE",
  },
  { field_id: "assigned_hr", field_name: "Assigned HR", field_type: "TEXT" },
  { field_id: "action", field_name: "Action", field_type: "TEXT" },
];

type Props = {
  data: HRPhoneInterviewSpreadsheetData[];
  isLoading: boolean;
  page: number;
  handlePagination: (page: number) => void;
  sort: { sortBy: string; order: string };
  setSort: Dispatch<SetStateAction<{ sortBy: string; order: string }>>;
  isMax: boolean;
  hiddenColumnList: string[];
  handleUpdateHRPhoneInterviewStatus: (
    status: string,
    data: HRPhoneInterviewSpreadsheetData
  ) => void;
  handleCheckRow: (item: HRPhoneInterviewSpreadsheetData) => Promise<boolean>;
};

const HRPhoneInterviewSpreadsheetTable = ({
  data,
  isLoading,
  page,
  handlePagination,
  sort,
  setSort,
  isMax,
  hiddenColumnList,
  handleUpdateHRPhoneInterviewStatus,
  handleCheckRow,
}: Props) => {
  const { classes } = useStyles();

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

  const renderHRPhoneInterviewFieldList = () => {
    return columnList
      .filter((field) => !hiddenColumnList.includes(field.field_id)) // Filter based on field_id for consistency
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
              <tr>{renderHRPhoneInterviewFieldList()}</tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <HRPhoneInterviewMainTableRow
                  key={item.application_information_request_id}
                  item={item}
                  hiddenColumnList={hiddenColumnList}
                  handleUpdateHRPhoneInterviewStatus={
                    handleUpdateHRPhoneInterviewStatus
                  }
                  handleCheckRow={handleCheckRow}
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

export default HRPhoneInterviewSpreadsheetTable;
