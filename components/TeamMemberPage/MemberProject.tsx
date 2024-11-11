import { getTeamMemberProjectList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { TeamProjectTableRow } from "@/utils/types";
import {
  ActionIcon,
  Alert,
  Divider,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconAlertCircle, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SearchForm } from "../TeamPage/TeamPage";

type Props = {
  memberId: string;
  projectList: {
    team_project_member_id: string;
    team_project: TeamProjectTableRow;
  }[];
  projectCount: number;
};

const MemberProject = ({
  memberId,
  projectList: initialProjectList,
  projectCount: initialProjectCount,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const { register, handleSubmit, getValues } = useForm<SearchForm>();

  const [records, setRecords] = useState(
    initialProjectList.sort((a, b) =>
      a.team_project.team_project_name < b.team_project.team_project_name
        ? -1
        : a.team_project.team_project_name > b.team_project.team_project_name
        ? 1
        : 0
    )
  );
  const [count, setCount] = useState(initialProjectCount);
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchTeamProject = async (
    data: SearchForm & { page?: number }
  ) => {
    if (!data.page) {
      setActivePage(1);
    }
    try {
      setIsLoading(true);
      const { keyword } = data;
      const currentPage = data.page ?? 1;
      const offset = (currentPage - 1) * ROW_PER_PAGE;
      const { data: projectList, count: projectCount } =
        await getTeamMemberProjectList(supabaseClient, {
          teamMemberId: memberId,
          search: keyword,
          offset,
          limit: ROW_PER_PAGE,
        });
      setRecords(
        projectList as unknown as {
          team_project_member_id: string;
          team_project: TeamProjectTableRow;
        }[]
      );

      setCount(projectCount ? projectCount : 0);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper p="lg" shadow="xs" mt="xl">
      <Stack spacing={12}>
        <Text weight={600}>Project List</Text>
        <Divider />

        <form onSubmit={handleSubmit(handleSearchTeamProject)}>
          <TextInput
            placeholder="Search project"
            rightSection={
              <ActionIcon type="submit" disabled={isLoading}>
                <IconSearch size={14} />
              </ActionIcon>
            }
            maw={350}
            mt="xs"
            {...register("keyword")}
          />
        </form>
        {records.length !== 0 ? (
          <DataTable
            mt="xs"
            withBorder
            fw="bolder"
            c="dimmed"
            idAccessor="team_project_member_id"
            minHeight={390}
            records={records}
            columns={[
              {
                accessor: "team_project",
                title: "Project Name",
                render: ({ team_project }) => (
                  <Text>{team_project.team_project_name}</Text>
                ),
              },
              {
                accessor: "project_initials",
                title: "Project Initials",
                render: ({ team_project }) => (
                  <Text>{team_project.team_project_code}</Text>
                ),
              },
            ]}
            totalRecords={count}
            recordsPerPage={ROW_PER_PAGE}
            page={activePage}
            onPageChange={(page) => {
              setActivePage(page);
              handleSearchTeamProject({ keyword: getValues("keyword"), page });
            }}
            fetching={isLoading}
          />
        ) : (
          <Alert icon={<IconAlertCircle size="1rem" />} color="orange" mt="md">
            No project found.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default MemberProject;
