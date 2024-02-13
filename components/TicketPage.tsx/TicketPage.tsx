import { getTicketOnLoad } from "@/backend/api/get";
import { createNotification, createTicketComment } from "@/backend/api/post";
import { assignTicket } from "@/backend/api/update";
import useRealtimeTicketCommentList from "@/hooks/useRealtimeTicketCommentList";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
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
  const [ticket, setTicket] = useState(initialTicket);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [ticketForm, setTicketForm] =
    useState<CreateTicketFormValues>(initialTicketForm);
  const requestCommentList = useRealtimeTicketCommentList(supabaseClient, {
    ticketId: ticket.ticket_id,
    initialCommentList: ticket.ticket_comment,
  });

  const canUserEditResponse =
    ticket.ticket_approver_team_member_id === user.team_member_id;

  const handleOverrideTicket = async () => {
    try {
      const newTicket = await getTicketOnLoad(supabaseClient, {
        ticketId: ticket.ticket_id,
        userId: user.team_member_user.user_id,
      });

      setTicketForm(newTicket.ticketForm);
    } catch (error) {
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
      });
      setTicket(updatedTicket);

      const newCommentId = uuidv4();
      const { error } = await createTicketComment(supabaseClient, {
        ticket_comment_id: newCommentId,
        ticket_comment_content: `${currentUserFullName} is reviewing this ticket`,
        ticket_comment_type: "ACTION_UNDER_REVIEW",
        ticket_comment_team_member_id: user.team_member_id,
        ticket_comment_ticket_id: ticket.ticket_id,
      });
      if (error) throw error;

      if (!error) {
        if (ticket.ticket_requester_team_member_id !== user.team_member_id) {
          // create notification
          await createNotification(supabaseClient, {
            notification_app: "REQUEST",
            notification_type: "COMMENT",
            notification_content: `An approver, ${user.team_member_user.user_first_name} ${user.team_member_user.user_last_name}, has self-assigned as the ticket approver`,
            notification_redirect_url: `/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/tickets/${ticket.ticket_id}`,
            notification_user_id:
              ticket.ticket_requester.team_member_user.user_id,
            notification_team_id: teamMember.team_member_team_id,
          });
        }
      }
    } catch (error) {
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
          {ticket.ticket_status === "PENDING" &&
            ticket.ticket_approver_team_member_id === null &&
            ticket.ticket_requester_team_member_id !== user.team_member_id &&
            ["ADMIN", "OWNER"].includes(user.team_member_role) && (
              <Tooltip label="You will be assigned to review this ticket.">
                <Button size="md" onClick={handleAssignTicketToUser}>
                  Assign To Me
                </Button>
              </Tooltip>
            )}
          <TicketDetailSection ticket={ticket} />

          <Divider mt="md" />
          <TicketResponseSection
            ticket={ticket}
            ticketForm={ticketForm}
            category={ticket.ticket_category}
            canUserEditResponse={canUserEditResponse}
            isEditingResponse={isEditingResponse}
            setIsEditingResponse={setIsEditingResponse}
            setTicketForm={setTicketForm}
          />

          {isEditingResponse && (
            <TicketOverride
              category={ticket.ticket_category}
              ticketForm={ticketForm}
              onOverrideTicket={() => handleOverrideTicket()}
              memberId={`${ticket.ticket_approver_team_member_id}`}
              onClose={() => setIsEditingResponse(false)}
            />
          )}

          {ticket.ticket_status === "UNDER REVIEW" &&
            isEditingResponse &&
            ticket.ticket_requester_team_member_id !== user.team_member_id && (
              <>
                <Divider mt="md" />
                <TicketActionSection
                  ticket={ticket}
                  setTicket={setTicket}
                  user={user}
                />
                <Divider mt="xl" />
              </>
            )}

          <TicketCommentSection
            ticket={ticket}
            commentList={requestCommentList}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default TicketPage;
