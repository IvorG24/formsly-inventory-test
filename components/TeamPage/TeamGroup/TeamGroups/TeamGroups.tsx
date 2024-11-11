import { getTeamGroupList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import { TeamGroupTableRow } from "@/utils/types";
import { Box, Center, Paper, Space, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import CreateGroup from "./CreateGroup";
import GroupList from "./GroupList";
import GroupMembers from "./GroupMembers";

type Props = {
  teamGroups: TeamGroupTableRow[];
  teamGroupsCount: number;
  isOwnerOrAdmin: boolean;
  teamId: string;
};

const TeamGroups = ({
  teamGroups,
  teamGroupsCount,
  isOwnerOrAdmin,
  teamId,
}: Props) => {
  const supabaseClient = useSupabaseClient();

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupList, setGroupList] = useState(teamGroups);
  const [groupCount, setGroupCount] = useState(teamGroupsCount);
  const [selectedGroup, setSelectedGroup] = useState<TeamGroupTableRow | null>(
    null
  );
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async (search: string, page: number) => {
    setIsLoading(true);
    try {
      const { data, count } = await getTeamGroupList(supabaseClient, {
        teamId: teamId,
        search,
        limit: ROW_PER_PAGE,
        page: page,
      });
      setGroupList(data as TeamGroupTableRow[]);
      setGroupCount(Number(count));
    } catch {
      notifications.show({
        message: "Error on fetching group list",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box mt="xl">
      <Paper p="xl" shadow="xs">
        {!isCreatingGroup ? (
          <GroupList
            groupList={groupList}
            setGroupList={setGroupList}
            setGroupCount={setGroupCount}
            setIsCreatingGroup={setIsCreatingGroup}
            setSelectedGroup={setSelectedGroup}
            setIsFetchingMembers={setIsFetchingMembers}
            selectedGroup={selectedGroup}
            isOwnerOrAdmin={isOwnerOrAdmin}
            isLoading={isLoading}
            handleFetch={handleFetch}
            isFetchingMembers={isFetchingMembers}
            groupCount={groupCount}
          />
        ) : null}
        {isCreatingGroup ? (
          <CreateGroup
            setIsCreatingGroup={setIsCreatingGroup}
            handleFetch={handleFetch}
          />
        ) : null}
      </Paper>
      <Space h="xl" />
      <Paper p="xl" shadow="xs">
        {!selectedGroup ? (
          <Center>
            <Text color="dimmed">No group selected</Text>
          </Center>
        ) : null}
        {selectedGroup ? (
          <GroupMembers
            teamId={teamId}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            isFetchingMembers={isFetchingMembers}
            setIsFetchingMembers={setIsFetchingMembers}
            isOwnerOrAdmin={isOwnerOrAdmin}
          />
        ) : null}
      </Paper>
    </Box>
  );
};

export default TeamGroups;
