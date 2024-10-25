import { unsortableFieldList } from "@/utils/constant";
import { useStyles } from "@/utils/styling";
import { BackgroundCheckSpreadsheetData } from "@/utils/types";
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
import BackgroundCheckMainTableRow from "./BackgroundCheckMainTableRow";

const columnList = [
  { field_id: "position", field_name: "Position" },
  { field_id: "application_information_full_name", field_name: "Full Name" },
  { field_id: "application_information_nickname", field_name: "Nickname" },
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
    field_id: "background_check_date_created",
    field_name: "Background Check Date Created",
  },
  {
    field_id: "background_check_status",
    field_name: "Background Check Status",
  },
  { field_id: "assigned_hr", field_name: "Assigned HR" },
  { field_id: "action", field_name: "Action" },
];

type Props = {
  data: BackgroundCheckSpreadsheetData[];
  isLoading: boolean;
  page: number;
  handlePagination: (page: number) => void;
  sort: { sortBy: string; order: string };
  setSort: Dispatch<SetStateAction<{ sortBy: string; order: string }>>;
  isMax: boolean;
  hiddenColumnList: string[];
  handleUpdateBackgroundCheckStatus: (
    status: string,
    data: BackgroundCheckSpreadsheetData
  ) => void;
  setData: Dispatch<SetStateAction<BackgroundCheckSpreadsheetData[]>>;
  handleCheckRow: (item: BackgroundCheckSpreadsheetData) => Promise<boolean>;
  handleOverride: (hrTeamMemberId: string, rowId: string) => void;
};

const BackgroundCheckSpreadsheetTable = ({
  data,
  isLoading,
  page,
  handlePagination,
  sort,
  setSort,
  isMax,
  hiddenColumnList,
  handleUpdateBackgroundCheckStatus,
  setData,
  handleCheckRow,
  handleOverride,
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
  const renderBackgroundCheckFieldList = () => {
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
              <tr>{renderBackgroundCheckFieldList()}</tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <BackgroundCheckMainTableRow
                  key={item.application_information_request_id}
                  item={item}
                  hiddenColumnList={hiddenColumnList}
                  handleUpdateBackgroundCheckStatus={
                    handleUpdateBackgroundCheckStatus
                  }
                  setData={setData}
                  handleCheckRow={handleCheckRow}
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

export default BackgroundCheckSpreadsheetTable;
