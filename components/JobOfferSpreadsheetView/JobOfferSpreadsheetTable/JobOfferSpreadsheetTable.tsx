import { unsortableFieldList } from "@/utils/constant";
import { useStyles } from "@/utils/styling";
import {
  HRProjectType,
  JobOfferSpreadsheetData,
  OptionType,
  TeamMemberTableRow,
  TeamMemberType,
  TeamTableRow,
  UserTableRow,
} from "@/utils/types";
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
import JobOfferMainTableRow from "./JobOfferMainTableRow";

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
  { field_id: "job_offer_date_created", field_name: "Job Offer Date Created" },
  { field_id: "job_offer_status", field_name: "Job Offer Status" },
  {
    field_id: "job_offer_attachment",
    field_name: "Job Offer Attachment",
    minWidth: 120,
  },
  {
    field_id: "job_offer_project_assignment",
    field_name: "Job Offer Project Assignment",
    minWidth: 120,
  },
  {
    field_id: "job_offer_history",
    field_name: "Job Offer History",
    minWidth: 120,
  },
  { field_id: "assigned_hr", field_name: "Assigned HR" },
  { field_id: "action", field_name: "Action" },
];

type Props = {
  data: JobOfferSpreadsheetData[];
  isLoading: boolean;
  page: number;
  handlePagination: (page: number) => void;
  sort: { sortBy: string; order: string };
  setSort: Dispatch<SetStateAction<{ sortBy: string; order: string }>>;
  isMax: boolean;
  hiddenColumnList: string[];
  setData: Dispatch<SetStateAction<JobOfferSpreadsheetData[]>>;
  positionOptionList: OptionType[];
  handleCheckRow: (item: JobOfferSpreadsheetData) => Promise<boolean>;
  user: UserTableRow | null;
  teamMember: TeamMemberTableRow | null;
  team: TeamTableRow;
  projectOptions: HRProjectType[];
  teamMemberGroupList: string[];
  teamMemberOptions: TeamMemberType[];
  handleOverride: (hrTeamMemberId: string, rowId: string) => void;
};

const JobOfferSpreadsheetTable = ({
  data,
  isLoading,
  page,
  handlePagination,
  sort,
  setSort,
  isMax,
  hiddenColumnList,
  setData,
  positionOptionList,
  handleCheckRow,
  user,
  teamMember,
  team,
  projectOptions,
  teamMemberGroupList,
  teamMemberOptions,
  handleOverride
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
  const renderJobOfferFieldList = () => {
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
              <tr>{renderJobOfferFieldList()}</tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <JobOfferMainTableRow
                  key={item.application_information_request_id}
                  item={item}
                  hiddenColumnList={hiddenColumnList}
                  setData={setData}
                  positionOptionList={positionOptionList}
                  handleCheckRow={handleCheckRow}
                  user={user}
                  teamMember={teamMember}
                  team={team}
                  projectOptions={projectOptions}
                  teamMemberGroupList={teamMemberGroupList}
                  teamMemberOptions={teamMemberOptions}
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

export default JobOfferSpreadsheetTable;
