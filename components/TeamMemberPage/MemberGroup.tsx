import { getTeamMemberGroupList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { TeamGroupTableRow } from "@/utils/types";
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
  groupList: {
    team_group_member_id: string;
    team_group: TeamGroupTableRow;
  }[];
  groupCount: number;
};

const MemberGroup = ({ memberId, groupList, groupCount }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const { register, handleSubmit } = useForm<SearchForm>();

  const [records, setRecords] = useState(groupList);
  const [count, setCount] = useState(groupCount);
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchTeamGroup = async (data: SearchForm) => {
    try {
      setActivePage(1);
      setIsLoading(true);
      const { keyword } = data;
      const { data: groupList, count: groupCount } =
        await getTeamMemberGroupList(supabaseClient, {
          teamMemberId: memberId,
          search: keyword,
          page: 1,
          limit: ROW_PER_PAGE,
        });
      setRecords(
        groupList as unknown as {
          team_group_member_id: string;
          team_group: TeamGroupTableRow;
        }[]
      );
      setCount(groupCount ? groupCount : 0);
    } catch {
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
        <Text weight={600}>Group List</Text>
        <Divider />

        <form onSubmit={handleSubmit(handleSearchTeamGroup)}>
          <TextInput
            placeholder="Search group"
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
            idAccessor="team_group_member_id"
            minHeight={390}
            records={records}
            columns={[
              {
                accessor: "team_group",
                title: "Group Name",
                render: ({ team_group }) => (
                  <Text>{team_group.team_group_name}</Text>
                ),
              },
            ]}
            totalRecords={count}
            recordsPerPage={ROW_PER_PAGE}
            page={activePage}
            onPageChange={(page) => {
              setActivePage(page);
            }}
            fetching={isLoading}
          />
        ) : (
          <Alert icon={<IconAlertCircle size="1rem" />} color="orange" mt="md">
            No group found.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default MemberGroup;
