import { deleteTeamMembershipRequest } from "@/backend/api/delete";
import {
  getExistingTeams,
  getUserTeamMembershipRequest,
} from "@/backend/api/get";
import { insertError, sendRequestToJoinTeam } from "@/backend/api/post";
import { useTeamList } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import { getAvatarColor } from "@/utils/styling";
import { TeamMembershipRequestTableRow, TeamTableRow } from "@/utils/types";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import {
  IconInfoCircle,
  IconRefresh,
  IconReload,
  IconSearch,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { useState } from "react";

type AvailableTeam = Pick<
  TeamTableRow,
  "team_id" | "team_name" | "team_logo"
>[];

type Props = {
  teams: AvailableTeam;
  teamsCount: number;
  teamMembershipRequestList: TeamMembershipRequestTableRow[];
};

const TeamMembershipRequestPage = ({
  teams,
  teamsCount,
  teamMembershipRequestList,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const user = useUser();
  const router = useRouter();
  const teamList = useTeamList();
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembershipRequest, setTeamMembershipRequest] = useState<
    TeamMembershipRequestTableRow[]
  >(teamMembershipRequestList);
  const [availableTeamList, setAvailableTeamList] =
    useState<AvailableTeam>(teams);
  const [availableTeamCount, setAvailableTeamCount] = useState(teamsCount);
  const [searchInput, setSearchInput] = useState("");

  const teamMembershipRequestId = teamMembershipRequest.map(
    (request) => request.team_membership_request_to_team_id
  );

  const userTeamIdList = teamList.map((t) => t.team_id);

  const handleFetchTeams = async ({
    page,
    emptySearch = false,
  }: {
    page: number;
    emptySearch?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setActivePage(page);
      const teamsData = await getExistingTeams(supabaseClient, {
        page,
        search: emptySearch ? undefined : searchInput,
      });
      setAvailableTeamList(teamsData.data);
      setAvailableTeamCount(teamsData.count);

      const allUserTeamMembershipRequest: TeamMembershipRequestTableRow[] = [];
      let offset = 0;
      const limit = 500;
      let fetchMoreUserTeamMembershipRequest = true;

      while (fetchMoreUserTeamMembershipRequest) {
        const userId = `${user?.id}`;
        const data = await getUserTeamMembershipRequest(supabaseClient, {
          userId,
          offset,
        });
        if (data.length > 0) {
          allUserTeamMembershipRequest.push(...data);
          offset += limit;
        }
        fetchMoreUserTeamMembershipRequest = data.length === limit;
      }

      setTeamMembershipRequest(allUserTeamMembershipRequest);
    } catch (error) {
      notifications.show({
        message: "Failed to fetch teams",
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleFetchTeams",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequestToJoin = async (teamId: string) => {
    try {
      if (!user) {
        notifications.show({
          message: "User not authenticated.",
          color: "red",
        });
        return;
      }

      setIsLoading(true);
      const newJoinRequest = await sendRequestToJoinTeam(supabaseClient, {
        teamId,
        userId: user.id,
      });
      setTeamMembershipRequest((prev) => [...prev, newJoinRequest]);
      notifications.show({
        message: "Request sent!",
        color: "green",
      });
    } catch (error) {
      if (isError(error)) {
        const errorMessage = error.message;

        if (errorMessage === "Member already exists") {
          modals.open({
            title: <Text fw={500}>You are already a member of this team.</Text>,
            centered: true,
            children: (
              <>
                <Alert color="blue" icon={<IconInfoCircle size={16} />}>
                  Please refresh the page to see the changes.
                </Alert>
                <Button
                  fullWidth
                  onClick={() => {
                    modals.closeAll();
                    router.reload();
                  }}
                  mt="md"
                  leftIcon={<IconRefresh size={16} />}
                >
                  Refresh Page
                </Button>
              </>
            ),
          });
        }
      } else {
        notifications.show({
          message: "Failed to join team. Please contact IT",
          color: "red",
        });
        if (isError(error)) {
          await insertError(supabaseClient, {
            errorTableRow: {
              error_message: error.message,
              error_url: router.asPath,
              error_function: "handleSendRequestToJoin",
              error_user_email: user?.email,
              error_user_id: user?.id,
            },
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequestToJoin = async (teamId: string) => {
    try {
      setIsLoading(true);
      await deleteTeamMembershipRequest(supabaseClient, {
        teamId,
        userIdList: [`${user?.id}`],
      });
      setTeamMembershipRequest((prev) =>
        prev.filter(
          (team) => team.team_membership_request_to_team_id !== teamId
        )
      );
    } catch (error) {
      notifications.show({
        message: "Failed to cancel team membership request",
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleCancelRequestToJoin",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maw={3840} h="100%">
      <Stack>
        <Box>
          <Title order={4}>Join Team Page</Title>
          <Text>Select a team and send a membership request.</Text>
        </Box>
        <Flex gap="sm" wrap="wrap">
          <TextInput
            w={300}
            placeholder="Search team name..."
            rightSection={
              <ActionIcon
                onClick={() => {
                  if (searchInput) {
                    handleFetchTeams({ page: 1 });
                  }
                }}
              >
                <IconSearch size={16} />
              </ActionIcon>
            }
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.currentTarget.value);
              if (e.currentTarget.value === "") {
                handleFetchTeams({ page: 1, emptySearch: true });
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (searchInput) {
                  handleFetchTeams({ page: 1 });
                }
              }
            }}
          />
          <Button
            variant="light"
            leftIcon={<IconReload size={16} />}
            onClick={() => handleFetchTeams({ page: 1 })}
          >
            Refresh
          </Button>
        </Flex>
        <DataTable
          idAccessor="team_id"
          withBorder
          fw="bolder"
          c="dimmed"
          minHeight={390}
          fetching={isLoading}
          recordsPerPage={ROW_PER_PAGE}
          totalRecords={availableTeamCount}
          page={activePage}
          onPageChange={(page: number) => handleFetchTeams({ page })}
          records={availableTeamList}
          columns={[
            {
              accessor: "team_name",
              title: "Team Name",
              render: ({ team_id, team_name, team_logo }) => {
                const hasUserSentRequest =
                  teamMembershipRequestId.includes(team_id);

                const isUserAlreadyAMember = userTeamIdList.includes(team_id);

                return (
                  <Flex gap="xs" align="center" wrap="wrap">
                    <Avatar
                      size="sm"
                      src={team_logo}
                      color={getAvatarColor(Number(team_name.charCodeAt(0)))}
                    >
                      {(team_name[0] + team_name[1]).toUpperCase()}
                    </Avatar>
                    <Text>{team_name}</Text>
                    {hasUserSentRequest && <Badge>Request Sent</Badge>}
                    {isUserAlreadyAMember && (
                      <Badge color="green">Already a Member</Badge>
                    )}
                  </Flex>
                );
              },
            },
            {
              accessor: "team_id",
              title: "Join Team",
              width: 240,
              textAlignment: "center",
              render: ({ team_id }) => {
                const hasUserSentRequest =
                  teamMembershipRequestId.includes(team_id);

                const isUserAlreadyAMember = userTeamIdList.includes(team_id);

                return (
                  <Flex gap="sm" align="center" justify="center">
                    {hasUserSentRequest ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequestToJoin(team_id)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequestToJoin(team_id)}
                        disabled={
                          isUserAlreadyAMember ||
                          hasUserSentRequest ||
                          isLoading
                        }
                      >
                        Join
                      </Button>
                    )}
                  </Flex>
                );
              },
            },
          ]}
        />
      </Stack>
    </Container>
  );
};

export default TeamMembershipRequestPage;
