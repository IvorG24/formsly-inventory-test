import { deleteTeamMembershipRequest } from "@/backend/api/delete";
import { getTeamTeamMembershipRequest } from "@/backend/api/get";
import { acceptTeamMembershipRequest, insertError } from "@/backend/api/post";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import { TeamTeamMembershipRequest } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Checkbox,
  Container,
  Flex,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import {
  IconCircleCheck,
  IconCircleCheckFilled,
  IconCircleX,
  IconReload,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
  teamId: string;
};

const TeamMembershipRequestAdminView = ({ teamId }: Props) => {
  const user = useUser();
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [teamMembershipRequestList, setTeamMembershipRequestList] = useState<
    TeamTeamMembershipRequest[]
  >([]);
  const [teamMembershipRequestCount, setTeamMembershipRequestCount] =
    useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [
    checkedMembershipRequestUserIdList,
    setCheckedMembershipRequestUserIdList,
  ] = useState<string[]>([]);

  const handleFetchTeamMembershipRequest = async (page: number) => {
    try {
      setIsLoading(true);
      setActivePage(page);
      const responseData = await getTeamTeamMembershipRequest(supabaseClient, {
        page,
        teamId,
        search: searchInput,
      });
      setTeamMembershipRequestList(responseData.data);
      setTeamMembershipRequestCount(responseData.count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch team membership requests",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleFetchTeamMembershipRequest",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptMembershipRequest = async (userIdList: string[]) => {
    try {
      setIsLoading(true);
      await acceptTeamMembershipRequest(supabaseClient, {
        userIdList,
        teamId,
        memberRole: "MEMBER",
      });
      setTeamMembershipRequestList((prev) =>
        prev.filter((request) => !userIdList.includes(request.user_id))
      );
      setCheckedMembershipRequestUserIdList((prev) =>
        prev.filter(
          (membershipRequestUserId) =>
            !userIdList.includes(membershipRequestUserId)
        )
      );
      notifications.show({
        message: "Member accepted.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        message: "Failed to accept team membership request",
        color: "red",
      });
      if (isError(error)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: error.message,
            error_url: router.asPath,
            error_function: "handleAcceptMembershipRequest",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTeamMembershipRequest = async (userIdList: string[]) => {
    try {
      setIsLoading(true);
      await deleteTeamMembershipRequest(supabaseClient, {
        teamId,
        userIdList,
      });
      setTeamMembershipRequestList((prev) =>
        prev.filter((request) => !userIdList.includes(request.user_id))
      );
      setCheckedMembershipRequestUserIdList((prev) =>
        prev.filter(
          (membershipRequestUserId) =>
            !userIdList.includes(membershipRequestUserId)
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

  const toggleCheckMembershipRequest = (userId: string) => {
    const membershipRequestIsChecked =
      checkedMembershipRequestUserIdList.includes(userId);

    if (membershipRequestIsChecked) {
      setCheckedMembershipRequestUserIdList((prev) =>
        prev.filter(
          (membershipRequestUserId) => membershipRequestUserId !== userId
        )
      );
    } else {
      setCheckedMembershipRequestUserIdList((prev) => [...prev, userId]);
    }
  };

  useEffect(() => {
    handleFetchTeamMembershipRequest(1);
  }, []);

  return (
    <Container p={0} mt="xl" pos="relative" fluid>
      <Paper p="lg" shadow="xs">
        <Stack>
          <Title order={4}>Team Membership Request</Title>
          <Flex gap="sm" justify="space-between" align="center" wrap="wrap">
            <Flex gap="sm" align="center" wrap="wrap">
              <TextInput
                w={250}
                placeholder="Search user by name or email"
                rightSection={
                  <ActionIcon
                    onClick={() => {
                      if (searchInput) {
                        handleFetchTeamMembershipRequest(1);
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
                    handleFetchTeamMembershipRequest(1);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    if (searchInput) {
                      handleFetchTeamMembershipRequest(1);
                    }
                  }
                }}
              />
              <Button
                variant="light"
                leftIcon={<IconReload size={16} />}
                onClick={() => handleFetchTeamMembershipRequest(1)}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Flex>
            {checkedMembershipRequestUserIdList.length > 0 && (
              <Flex gap="sm">
                <Button
                  color="green"
                  leftIcon={<IconCircleCheck size={16} />}
                  onClick={() =>
                    handleAcceptMembershipRequest(
                      checkedMembershipRequestUserIdList
                    )
                  }
                >
                  Accept All {`(${checkedMembershipRequestUserIdList.length})`}
                </Button>
                <Button
                  color="red"
                  variant="light"
                  leftIcon={<IconCircleX size={16} />}
                  onClick={() =>
                    handleCancelTeamMembershipRequest(
                      checkedMembershipRequestUserIdList
                    )
                  }
                >
                  Delete All {`(${checkedMembershipRequestUserIdList.length})`}
                </Button>
              </Flex>
            )}
          </Flex>
          <DataTable
            idAccessor="team_membership_request_id"
            withBorder
            fw="bolder"
            c="dimmed"
            minHeight={390}
            fetching={isLoading}
            recordsPerPage={ROW_PER_PAGE}
            totalRecords={teamMembershipRequestCount}
            page={activePage}
            onPageChange={(page: number) =>
              handleFetchTeamMembershipRequest(page)
            }
            records={teamMembershipRequestList}
            columns={[
              {
                accessor: "team_membership_request_id",
                title: "Select",
                width: 80,
                render: ({ team_membership_request_id, user_id }) => (
                  <Checkbox
                    key={team_membership_request_id}
                    ml="sm"
                    size="xs"
                    checked={checkedMembershipRequestUserIdList.includes(
                      user_id
                    )}
                    onChange={() => toggleCheckMembershipRequest(user_id)}
                  />
                ),
              },
              {
                accessor: "user_id",
                title: "Name",
                render: ({ user_first_name, user_last_name }) => (
                  <Text>
                    {`${user_first_name} ${user_last_name}`.toUpperCase()}
                  </Text>
                ),
              },
              {
                accessor: "user_email",
                title: "Email",
                render: ({ user_email }) => <Text>{user_email}</Text>,
              },
              {
                accessor: "action",
                title: "Action",
                width: 120,
                textAlignment: "center",
                render: ({ user_id }) => (
                  <Flex gap="xs" justify="center">
                    <Tooltip label="Accept">
                      <ActionIcon
                        size="sm"
                        color="green"
                        onClick={() => handleAcceptMembershipRequest([user_id])}
                      >
                        <IconCircleCheckFilled />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Decline">
                      <ActionIcon
                        size="sm"
                        color="red"
                        onClick={() =>
                          handleCancelTeamMembershipRequest([user_id])
                        }
                      >
                        <IconX />
                      </ActionIcon>
                    </Tooltip>
                  </Flex>
                ),
              },
            ]}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default TeamMembershipRequestAdminView;
