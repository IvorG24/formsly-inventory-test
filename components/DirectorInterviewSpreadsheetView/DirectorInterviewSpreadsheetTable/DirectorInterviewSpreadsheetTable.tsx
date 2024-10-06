import { DirectorInterviewSpreadsheetData } from "@/utils/types";
import {
  Button,
  Center,
  createStyles,
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
import DirectorInterviewMainTableRow from "./DirectorInterviewMainTableRow";
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
    field_id: "director_interview_date_created",
    field_name: "Director Interview Date Created",
  },
  {
    field_id: "director_interview_status",
    field_name: "Director Interview Status",
  },
  {
    field_id: "director_interview_schedule",
    field_name: "Director Interview Schedule",
  },
  { field_id: "assigned_hr", field_name: "Assigned HR" },
  { field_id: "meeting_link", field_name: "Meeting Link" },
  { field_id: "action", field_name: "Action" },
];
const unsortableFieldList = [
  "Name",
  "Contact Number",
  "Email",
  "Assigned HR",
  "Action",
];

const useStyles = createStyles((theme) => ({
  parentTable: {
    "&& th": {
      color: "white",
      fontSize: 14,
      fontWeight: 900,
      backgroundColor: theme.colors.blue[5],
      transition: "background-color 0.3s ease",
      padding: "10px",
      "& svg": {
        fill: "white",
        color: "white",
      },
      "&:hover": {
        backgroundColor: "#0042ab !important",
        color: "white !important",
        "& svg": {
          fill: "white",
          color: "white",
        },
      },
    },
    "&& td": {
      borderBottom: "1px solid #CDD1D6",
      minWidth: 150,
      width: "100%",
      padding: "10px",
    },
  },
}));

type Props = {
  data: DirectorInterviewSpreadsheetData[];
  isLoading: boolean;
  page: number;
  handlePagination: (page: number) => void;
  sort: { sortBy: string; order: string };
  setSort: Dispatch<SetStateAction<{ sortBy: string; order: string }>>;
  isMax: boolean;
  hiddenColumnList: string[];
  handleUpdateDirectorInterviewStatus: (
    status: string,
    data: DirectorInterviewSpreadsheetData
  ) => void;
  handleCheckRow: (item: DirectorInterviewSpreadsheetData) => Promise<boolean>;
};

const DirectorInterviewSpreadsheetTable = ({
  data,
  isLoading,
  page,
  handlePagination,
  sort,
  setSort,
  isMax,
  hiddenColumnList,
  handleUpdateDirectorInterviewStatus,
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
  const renderDirectorInterviewFieldList = () => {
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
              <tr>{renderDirectorInterviewFieldList()}</tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <DirectorInterviewMainTableRow
                  key={item.application_information_request_id}
                  item={item}
                  hiddenColumnList={hiddenColumnList}
                  handleUpdateDirectorInterviewStatus={
                    handleUpdateDirectorInterviewStatus
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

export default DirectorInterviewSpreadsheetTable;
