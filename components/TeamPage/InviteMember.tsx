import { checkUserEmail, getTeamInvitation } from "@/backend/api/get";
import { cancelTeamInvitation, createTeamInvitation } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { sendEmailTeamInvite } from "@/utils/functions";
import { PendingInviteType, TeamMemberType } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  LoadingOverlay,
  MultiSelect,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconMailPlus, IconSearch, IconUsersPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import moment from "moment";
import { useEffect, useState } from "react";
import validator from "validator";

type Props = {
  memberEmailList: string[];
  isOwnerOrAdmin: boolean;
  teamMemberList: TeamMemberType[];
};

type EmailListData = { value: string; label: string }[];

type ResendInviteTimeout = {
  invitation_email: string;
  invitation_resend_date_created: Date;
}[];

const InviteMember = ({ memberEmailList }: Props) => {
  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const supabaseClient = useSupabaseClient();
  const [emailListData, setEmailListData] = useState<EmailListData>([]);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [pendingInviteList, setPendingInviteList] = useState<
    PendingInviteType[]
  >([]);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [isResendingInvite, setIsResendingInvite] = useState(false);
  const [resendInviteTimeoutList, setResendInviteTimeoutList] =
    useLocalStorage<ResendInviteTimeout>({
      key: "formsly-resend-invite-timeout",
      defaultValue: [],
    });
  const [activePage, setActivePage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const handleInvite = async () => {
    try {
      if (!teamMember) return;
      setIsInvitingMember(true);
      const alreadyMemberEmailList = await checkUserEmail(supabaseClient, {
        emailList,
        teamId: team.team_id,
      });

      const filteredEmailList = emailList.filter(
        (email) => !alreadyMemberEmailList.includes(email)
      );
      if (!filteredEmailList.length) return;

      await createTeamInvitation(supabaseClient, {
        emailList: filteredEmailList,
        teamMemberId: teamMember.team_member_id,
        teamName: team.team_name,
      });

      await sendEmailTeamInvite({
        emailList: filteredEmailList,
        teamId: team.team_id,
        teamName: team.team_name,
      });
      await handleFetchPendingInviteList({ page: 1 });

      setEmailList([]);

      notifications.show({
        message: "Team member/s invited.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    try {
      setIsResendingInvite(true);
      await sendEmailTeamInvite({
        emailList: [email],
        teamId: team.team_id,
        teamName: team.team_name,
      });
      const dateNow = new Date();
      const resendInviteWithDateCreated = {
        invitation_email: email,
        invitation_resend_date_created: dateNow,
      };

      const isResendInviteExisting = resendInviteTimeoutList.find(
        (resendInvite) => resendInvite.invitation_email === email
      );

      if (isResendInviteExisting) {
        setResendInviteTimeoutList((prev) =>
          prev.map((resendInvite) => {
            if (resendInvite.invitation_email === email) {
              return resendInviteWithDateCreated;
            }

            return resendInvite;
          })
        );
      } else {
        const updatedResentInviteTimeout = [
          ...resendInviteTimeoutList,
          resendInviteWithDateCreated,
        ];

        setResendInviteTimeoutList(updatedResentInviteTimeout);
      }

      notifications.show({
        message: "Invitation resent",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsResendingInvite(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await cancelTeamInvitation(supabaseClient, {
        invitation_id: invitationId,
      });
      setPendingInviteList((prev) =>
        prev.filter((invite) => invite.invitation_id !== invitationId)
      );
      notifications.show({
        message: "Invitation canceled",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchPendingInviteList = async ({
    search,
    page,
  }: {
    search?: string;
    page: number;
  }) => {
    try {
      const { data, count } = await getTeamInvitation(supabaseClient, {
        teamId: team.team_id,
        status: "PENDING",
        page,
        limit: ROW_PER_PAGE,
        search,
      });

      setPendingInviteList(data);
      setPendingInviteCount(count);
    } catch (e) {
      notifications.show({
        message: "Error fetching pending invite list.",
        color: "red",
      });
    }
  };

  const handleSearchPendingInvite = async (search: string) => {
    setActivePage(1);
    handleFetchPendingInviteList({ search, page: 1 });
  };

  const handlePagination = async (page: number) => {
    setActivePage(page);
    handleFetchPendingInviteList({ search: searchInput, page });
  };

  useEffect(() => {
    handleFetchPendingInviteList({ page: activePage });
  }, []);

  return (
    <Container p={0} mt="xl" pos="relative" fluid>
      <LoadingOverlay
        visible={isInvitingMember}
        overlayBlur={2}
        transitionDuration={500}
      />

      <Paper p="lg" shadow="xs">
        <Stack spacing={12}>
          <Text weight={600}>Invite Member</Text>

          <Divider mt={-12} />

          <Text size={14} mb={12}>
            Invite will be sent via email. If the user is already registered,
            they will receive a notification within the app.
          </Text>

          <Flex direction={{ base: "column", sm: "row" }} gap={12}>
            <MultiSelect
              data={emailListData}
              placeholder="juandelacruz@email.ph"
              searchable
              creatable
              clearable
              clearSearchOnChange
              onChange={setEmailList}
              value={emailList}
              getCreateLabel={(query) => (
                <Flex align="center" gap={4}>
                  <IconMailPlus size={14} />
                  <Text>{query}</Text>
                </Flex>
              )}
              shouldCreate={(query: string) => {
                const isEmail = validator.isEmail(query);
                const isAddedAlready = emailListData
                  .map((email) => email.value)
                  .includes(query);
                return isEmail && !isAddedAlready;
              }}
              onCreate={(query) => {
                let valid = true;
                const isMemberAlready = memberEmailList.includes(query);
                if (emailListData.length > 60) {
                  notifications.show({
                    message: "You have exceeded the invite limit of 60.",
                    color: "orange",
                  });
                  valid = false;
                }

                if (isMemberAlready) {
                  notifications.show({
                    message: "A member with this email already exists.",
                    color: "orange",
                  });
                  valid = false;
                }

                if (valid) {
                  const item = { value: query, label: query };
                  setEmailListData((current) => [...current, item]);
                  return item;
                }
              }}
              w="100%"
            />

            <Button
              onClick={() => {
                handleInvite();
                setEmailListData([]);
              }}
              leftIcon={<IconUsersPlus size={14} />}
              disabled={emailList.length <= 0}
            >
              Invite
            </Button>
          </Flex>
        </Stack>
      </Paper>
      <Paper mt="lg" p="lg" shadow="xs">
        <Stack>
          <LoadingOverlay visible={isResendingInvite} />
          <Flex align="center" wrap="wrap" gap="lg">
            <Text weight={600}>
              {`Pending Invites (${pendingInviteCount})`}
            </Text>
            <TextInput
              miw={250}
              placeholder="Search by email"
              value={searchInput}
              onChange={async (e) => {
                setSearchInput(e.target.value);
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  handleSearchPendingInvite(searchInput);
                }
              }}
              rightSection={
                <ActionIcon
                  onClick={() => {
                    handleSearchPendingInvite(searchInput);
                  }}
                >
                  <IconSearch size={16} />
                </ActionIcon>
              }
            />
          </Flex>

          <DataTable
            idAccessor="invitation_id"
            fw="bolder"
            c="dimmed"
            withBorder
            minHeight={390}
            records={pendingInviteList}
            totalRecords={pendingInviteCount}
            recordsPerPage={ROW_PER_PAGE}
            page={activePage}
            onPageChange={handlePagination}
            columns={[
              {
                accessor: "invitation_to_email",
                title: "Email",
                render: ({ invitation_to_email }) => (
                  <Text>{invitation_to_email}</Text>
                ),
              },
              {
                accessor: "action",
                title: "Action",
                textAlignment: "center",
                width: 200,
                render: ({ invitation_id, invitation_to_email }) => {
                  const resendDateCreated =
                    resendInviteTimeoutList.find(
                      (resendInvite) =>
                        resendInvite.invitation_email === invitation_to_email
                    )?.invitation_resend_date_created || null;

                  const dateNow = new Date();
                  const isResendDisabled = resendDateCreated
                    ? !(moment(dateNow).diff(resendDateCreated, "minutes") > 1)
                    : false;

                  return (
                    <Group key={invitation_id} position="right">
                      <Button
                        variant="subtle"
                        onClick={() => handleCancelInvite(invitation_id)}
                      >
                        Cancel
                      </Button>
                      <Button
                        miw={84}
                        onClick={() => handleResendInvite(invitation_to_email)}
                        disabled={isResendDisabled}
                      >
                        {isResendDisabled ? "Sent" : "Resend"}
                      </Button>
                    </Group>
                  );
                },
              },
            ]}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default InviteMember;
