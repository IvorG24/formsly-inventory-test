import { createTicketComment } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey, parseJSONIfValid } from "@/utils/string";
import { CreateTicketFormValues, TicketType } from "@/utils/types";
import { Box, LoadingOverlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TicketForm from "../CreateTicketPage/TicketForm";
import TicketItemRequestForm from "../TicketItemRequestForm/TicketItemRequestForm";
import TicketRequestCustomCSIForm from "../TicketRequestCustomCSIForm/TicketRequestCustomCSIForm";
import TicketRequestItemCSIForm from "../TicketRequestItemCSIForm/TicketRequestItemCSIForm";
import TicketRequestItemOptionForm from "../TicketRequestItemOptionForm/TicketRequestItemOptionForm";
import TicketRequestPEDEquipmentPartForm from "../TicketRequestPEDEquipmentPartForm/TicketRequestPEDEquipmentPartForm";

type Props = {
  category: string;
  ticketForm: CreateTicketFormValues;
  memberId: string;
  ticket: TicketType;
  onOverrideTicket: () => void;
  onClose?: () => void;
  setRequestCommentList: Dispatch<SetStateAction<TicketType["ticket_comment"]>>;
};

const TicketOverride = ({
  ticket,
  category,
  ticketForm: initialTicketForm,
  memberId,
  onOverrideTicket,
  onClose,
  setRequestCommentList,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const user = useUserProfile();
  const userMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const currentUser = useUserProfile();

  const [isLoading, setIsLoading] = useState(false);
  const ticketForm: CreateTicketFormValues = {
    ticket_sections: initialTicketForm.ticket_sections.map((section) => ({
      ...section,
      ticket_section_fields: section.ticket_section_fields.map((field) => ({
        ...field,
        ticket_field_response: parseJSONIfValid(
          `${field.ticket_field_response}`
        ),
        ticket_field_response_referrence: parseJSONIfValid(
          `${field.ticket_field_response_referrence}`
        ),
      })),
    })),
  };
  const [oldTicketForm, setOldTicketForm] = useState(ticketForm);

  const handleOverrideResponseComment = async (
    newFormValues: CreateTicketFormValues
  ) => {
    try {
      const newCommentId = uuidv4();

      const oldSections = oldTicketForm.ticket_sections.filter(
        (section) => !section.ticket_section_is_duplicatable
      );
      const newSections = newFormValues.ticket_sections.filter(
        (section) => !section.ticket_section_is_duplicatable
      );

      const oldDuplicatableSections = oldTicketForm.ticket_sections.filter(
        (section) => section.ticket_section_is_duplicatable
      );
      const newDuplicatableSections = newFormValues.ticket_sections.filter(
        (section) => section.ticket_section_is_duplicatable
      );

      const bothIncluded = newDuplicatableSections.filter((newSections) =>
        oldDuplicatableSections
          .map((oldSections) => oldSections.field_section_duplicatable_id)
          .includes(newSections.field_section_duplicatable_id)
      );

      const added = newDuplicatableSections.filter(
        (newSections) =>
          !oldDuplicatableSections
            .map((oldSections) => oldSections.field_section_duplicatable_id)
            .includes(newSections.field_section_duplicatable_id)
      );

      const removed = oldDuplicatableSections.filter(
        (oldSections) =>
          !newDuplicatableSections
            .map((newSections) => newSections.field_section_duplicatable_id)
            .includes(oldSections.field_section_duplicatable_id)
      );

      let ticketChanges = "";

      oldSections.forEach((oldSection, oldSectionIdx) => {
        oldSection.ticket_section_fields.forEach((oldField, oldFieldIdx) => {
          const newResponse =
            newSections[oldSectionIdx].ticket_section_fields[oldFieldIdx]
              .ticket_field_response;
          const isFile = newResponse instanceof File;
          if (oldField.ticket_field_response !== newResponse) {
            if (isFile) {
              const file = newResponse as File;
              ticketChanges += `<p>The <strong>${oldField.ticket_field_name}</strong> file has been changed.
              <br>
              ${file.name}</p>`;
            } else {
              ticketChanges += `<p>The <strong>${oldField.ticket_field_name}</strong> has been changed.
              <br>
              <strong>From:</strong>
              ${oldField.ticket_field_response}
              <br>
              <strong>To:</strong>
              ${newResponse}</p>`;
            }
          }
        });
      });

      bothIncluded.forEach((section) => {
        const duplicatableSectionId = section.field_section_duplicatable_id;
        const bothOldSection = oldDuplicatableSections.find(
          (section) =>
            section.field_section_duplicatable_id === duplicatableSectionId
        );
        const bothNewSection = newDuplicatableSections.find(
          (section) =>
            section.field_section_duplicatable_id === duplicatableSectionId
        );
        if (!bothOldSection) return;
        if (!bothNewSection) return;
        bothOldSection.ticket_section_fields.forEach(
          (oldField, oldFieldIdx) => {
            const newResponse =
              bothNewSection.ticket_section_fields[oldFieldIdx]
                .ticket_field_response;
            const isFile = newResponse instanceof File;
            if (oldField.ticket_field_response !== newResponse) {
              if (isFile) {
                const file = newResponse as File;
                ticketChanges += `<p>The <strong>${oldField.ticket_field_name}</strong> file in <strong>${section.ticket_section_name}</strong> has been changed.
              <br>
              ${file.name}</p>`;
              } else {
                ticketChanges += `<p>The <strong>${oldField.ticket_field_name}</strong> in <strong>${section.ticket_section_name}</strong> has been changed.
              <br>
              <strong>From:</strong>
              ${oldField.ticket_field_response}
              <br>
              <strong>To:</strong>
              ${newResponse}</p>`;
              }
            }
          }
        );
      });

      added.forEach((section) => {
        ticketChanges += `<p>The <strong>${
          section.ticket_section_name
        }</strong> has been added.
        ${section.ticket_section_fields
          .map((field) => {
            if (field.ticket_field_type === "FILE") return;
            else
              return `<br><strong>${field.ticket_field_name}</strong>: ${field.ticket_field_response}`;
          })
          .join(" ")}
        </p>`;
      });

      removed.forEach((section) => {
        ticketChanges += `<p>The <strong>${
          section.ticket_section_name
        }</strong> has been removed.
        ${section.ticket_section_fields
          .map((field) => {
            if (field.ticket_field_type === "FILE") return;
            else
              return `<br><strong>${field.ticket_field_name}</strong>: ${field.ticket_field_response}`;
          })
          .join(" ")}
        </p>`;
      });

      if (!ticketChanges) return;
      setOldTicketForm(newFormValues);
      const data = await createTicketComment(supabaseClient, {
        commentInput: {
          ticket_comment_id: newCommentId,
          ticket_comment_content: `<p>${user?.user_first_name} ${user?.user_last_name} has made the following changes on the ticket.</p>\n${ticketChanges}`,
          ticket_comment_type: "ACTION_OVERRIDE",
          ticket_comment_team_member_id: `${userMember?.team_member_id}`,
          ticket_comment_ticket_id: ticket.ticket_id,
        },
        notificationInput: [
          {
            notification_app: "REQUEST",
            notification_type: "COMMENT",
            notification_content: `${`${user?.user_first_name} ${user?.user_last_name}`} overrode your ticket`,
            notification_redirect_url: `/${formatTeamNameToUrlKey(
              activeTeam.team_name ?? ""
            )}/tickets/${ticket.ticket_id}`,
            notification_user_id:
              ticket.ticket_requester.team_member_user.user_id,
            notification_team_id: userMember?.team_member_team_id,
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

  const renderTicketForm = () => {
    switch (category) {
      case "Request Custom CSI":
        return (
          <TicketRequestCustomCSIForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );
      case "Request Item CSI":
        return (
          <TicketRequestItemCSIForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );
      case "Request Item Option":
        return (
          <TicketRequestItemOptionForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );
      case "Request PED Equipment Part":
        return (
          <TicketRequestPEDEquipmentPartForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );
      case "Item Request":
        return (
          <TicketItemRequestForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );

      default:
        return (
          <TicketForm
            category={category}
            memberId={memberId}
            ticketForm={ticketForm}
            setIsLoading={setIsLoading}
            isEdit={true}
            onOverrideTicket={onOverrideTicket}
            onClose={onClose}
            onOverrideResponseComment={handleOverrideResponseComment}
          />
        );
    }
  };
  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={isLoading}
        overlayBlur={2}
        sx={{ position: "fixed" }}
      />
      {renderTicketForm()}{" "}
    </Box>
  );
};

export default TicketOverride;
