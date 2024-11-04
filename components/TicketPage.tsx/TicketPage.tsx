import { getTicketOnLoad } from "@/backend/api/get";
import { createTicketComment } from "@/backend/api/post";
import { assignTicket } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { READ_ONLY_TICKET_CATEGORY_LIST } from "@/utils/constant";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CreateTicketFormValues,
  CreateTicketPageOnLoad,
  TicketType,
} from "@/utils/types";
import {
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TicketActionSection from "./TicketActionSection";
import TicketCommentSection from "./TicketCommentSection";
import TicketDetailSection from "./TicketDetailSection";
import TicketOverride from "./TicketOverride";
import TicketResponseSection from "./TicketResponseSection";

type Props = {
  ticket: TicketType;
  user: CreateTicketPageOnLoad["member"];
  ticketForm: CreateTicketFormValues;
};

const TicketPage = ({
  ticket: initialTicket,
  ticketForm: initialTicketForm,
  user,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const currentUser = useUserProfile();
  const [ticket, setTicket] = useState(initialTicket);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [ticketForm, setTicketForm] =
    useState<CreateTicketFormValues>(initialTicketForm);
  const [requestCommentList, setRequestCommentList] = useState(
    ticket.ticket_comment
  );

  const ticketStatus = ticket.ticket_status;

  const canUserEditResponse =
    ticket.ticket_approver_team_member_id === user.team_member_id &&
    !READ_ONLY_TICKET_CATEGORY_LIST.includes(ticket.ticket_category);

  const isTicketPendingOrUnderReview = ["PENDING", "UNDER REVIEW"].includes(
    ticketStatus
  );
  const isNotApproverOrCreator = ![
    ticket.ticket_approver_team_member_id,
    ticket.ticket_requester_team_member_id,
  ].includes(user.team_member_id);
  const isUserAdminOrOwner = ["ADMIN", "OWNER"].includes(user.team_member_role);

  const canAssignTicket =
    isTicketPendingOrUnderReview &&
    isNotApproverOrCreator &&
    isUserAdminOrOwner;

  const handleOverrideTicket = async () => {
    try {
      const newTicket = await getTicketOnLoad(supabaseClient, {
        ticketId: ticket.ticket_id,
        userId: user.team_member_user.user_id,
      });

      setTicketForm(newTicket.ticketForm);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleAssignTicketToUser = async () => {
    if (!teamMember) return;
    try {
      const currentUserFullName = `${user.team_member_user.user_first_name} ${user.team_member_user.user_last_name}`;
      const updatedTicket = await assignTicket(supabaseClient, {
        teamMemberId: user.team_member_id,
        ticketId: ticket.ticket_id,
        currentTicketStatus: ticketStatus,
      });

      if (!updatedTicket) {
        notifications.show({
          message:
            "Ticket is already assigned. Please refresh the page to see the updated changes.",
          color: "orange",
        });
        return;
      }

      setTicket(updatedTicket);

      const newCommentId = uuidv4();
      const data = await createTicketComment(supabaseClient, {
        commentInput: {
          ticket_comment_id: newCommentId,
          ticket_comment_content: `${currentUserFullName} is reviewing this ticket`,
          ticket_comment_type: "ACTION_UNDER_REVIEW",
          ticket_comment_team_member_id: user.team_member_id,
          ticket_comment_ticket_id: ticket.ticket_id,
        },
        notificationInput: [
          {
            notification_app: "REQUEST",
            notification_type: "COMMENT",
            notification_content: `An approver, ${user.team_member_user.user_first_name} ${user.team_member_user.user_last_name}, has self-assigned as the ticket approver`,
            notification_redirect_url: `/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/tickets/${ticket.ticket_id}`,
            notification_user_id:
              ticket.ticket_requester.team_member_user.user_id,
            notification_team_id: teamMember.team_member_team_id,
          },
        ],
      });

      setRequestCommentList((prev) => [
        {
          ...data,
          ticket_comment_attachment: [],
          ticket_comment_team_member: {
            team_member_user: {
              user_id: `${currentUser?.user_id}`,
              user_first_name: currentUser ? currentUser.user_first_name : "",
              user_last_name: currentUser ? currentUser.user_last_name : "",
              user_username: currentUser ? currentUser.user_username : "",
              user_avatar: currentUser ? currentUser.user_avatar : "",
            },
          },
        },
        ...prev,
      ]);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  return (
    <Container>
      <Paper p="md" withBorder>
        <Stack>
          {canAssignTicket && (
            <Tooltip label="You will be assigned to review this ticket.">
              <Button size="md" onClick={handleAssignTicketToUser}>
                {`${
                  ticketStatus === "UNDER REVIEW" ? "Reassign" : "Assign"
                } To Me`}
              </Button>
            </Tooltip>
          )}
          <TicketDetailSection ticket={ticket} ticketStatus={ticketStatus} />

          <Divider mt="md" />
          <TicketResponseSection
            ticket={ticket}
            ticketStatus={ticketStatus}
            ticketForm={ticketForm}
            category={ticket.ticket_category}
            canUserEditResponse={canUserEditResponse}
            isEditingResponse={isEditingResponse}
            setIsEditingResponse={setIsEditingResponse}
          />

          {isEditingResponse && (
            <TicketOverride
              ticket={ticket}
              category={ticket.ticket_category}
              ticketForm={ticketForm}
              onOverrideTicket={() => handleOverrideTicket()}
              memberId={`${ticket.ticket_approver_team_member_id}`}
              onClose={() => setIsEditingResponse(false)}
              setRequestCommentList={setRequestCommentList}
            />
          )}

          {ticketStatus === "UNDER REVIEW" &&
            !isEditingResponse &&
            ticket.ticket_requester_team_member_id !== user.team_member_id &&
            !canAssignTicket && (
              <>
                <Divider mt="md" />
                <TicketActionSection
                  ticket={ticket}
                  ticketForm={ticketForm}
                  setTicket={setTicket}
                  user={user}
                  setRequestCommentList={setRequestCommentList}
                />
                <Divider mt="xl" />
              </>
            )}

          <TicketCommentSection
            ticket={ticket}
            commentList={requestCommentList}
            setRequestCommentList={setRequestCommentList}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default TicketPage;
