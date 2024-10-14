import { createTicket, editTicket } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { CreateTicketFormValues } from "@/utils/types";
import { Button, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import TicketFormSection from "../CreateTicketPage/TicketFormSection";

type Props = {
  category: string | null;
  memberId: string;
  ticketForm: CreateTicketFormValues | null;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isEdit?: boolean;
  onOverrideTicket?: () => void;
  onClose?: () => void;
  onOverrideResponseComment?: (
    formValues: CreateTicketFormValues
  ) => Promise<void>;
};

const TicketForm = ({
  category,
  memberId,
  ticketForm,
  setIsLoading,
  isEdit,
  onClose,
  onOverrideTicket,
  onOverrideResponseComment,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const { ticketId } = router.query;
  const user = useUserProfile();

  const createTicketFormMethods = useForm<CreateTicketFormValues>();
  const { handleSubmit, control, getValues } = createTicketFormMethods;

  const {
    fields: ticketSections,
    replace: replaceSection,
    insert: insertSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "ticket_sections",
  });

  const handleCreateTicket = async (data: CreateTicketFormValues) => {
    try {
      setIsLoading(true);
      if (!category || !user) return;
      const ticket = await createTicket(supabaseClient, {
        category,
        teamMemberId: memberId,
        ticketFormValues: data,
        userId: user.user_id,
      });

      notifications.show({
        message: "Ticket created.",
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/tickets/${
          ticket.ticket_id
        }`
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTicket = async (data: CreateTicketFormValues) => {
    try {
      setIsLoading(true);
      if (!category && !ticketId && user) return;
      if (!user) return;

      const edited = await editTicket(supabaseClient, {
        ticketId: `${ticketId}`,
        ticketFormValues: data,
        userId: user.user_id,
      });
      if (!edited) return;

      if (onOverrideResponseComment) await onOverrideResponseComment(data);
      if (onOverrideTicket) onOverrideTicket();
      if (onClose) onClose();

      notifications.show({
        message: "Ticket overriden.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionLastIndex = ticketSections
      .map((sectionItem) => sectionItem.ticket_section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = ticketSections.find(
      (section) => section.ticket_section_id === sectionId
    );
    if (sectionMatch) {
      const sectionDuplicatableId = uuidv4();
      const duplicatedFieldsWithDuplicatableId =
        sectionMatch.ticket_section_fields.map((field) => ({
          ...field,
          ticket_field_response: "",
          ticket_field_section_id: sectionDuplicatableId,
        }));
      const newSection = {
        ...sectionMatch,
        field_section_duplicatable_id: sectionDuplicatableId,
        ticket_section_fields: duplicatedFieldsWithDuplicatableId,
      };
      insertSection(sectionLastIndex + 1, newSection);
      return;
    }
  };

  const handleRemoveSection = (sectionDuplicatableId: string) => {
    const sectionMatchIndex = ticketSections.findIndex(
      (section) =>
        section.field_section_duplicatable_id === sectionDuplicatableId
    );
    if (sectionMatchIndex) {
      removeSection(sectionMatchIndex);
      return;
    }
  };

  useEffect(() => {
    if (ticketForm) {
      replaceSection(ticketForm.ticket_sections);
    }
  }, []);

  return (
    <>
      <FormProvider {...createTicketFormMethods}>
        <form
          onSubmit={handleSubmit(
            isEdit ? handleEditTicket : handleCreateTicket
          )}
        >
          {ticketSections.map((ticketSection, ticketSectionIdx) => {
            const sectionIdToFind = ticketSection.ticket_section_id;
            const sectionLastIndex = getValues("ticket_sections")
              .map((sectionItem) => sectionItem.ticket_section_id)
              .lastIndexOf(sectionIdToFind);

            return (
              <Flex direction="column" key={ticketSection.id}>
                <TicketFormSection
                  category={`${category}`}
                  ticketSection={ticketSection}
                  ticketSectionIdx={ticketSectionIdx}
                  isEdit={isEdit}
                  onRemoveSection={() =>
                    handleRemoveSection(
                      ticketSection.field_section_duplicatable_id ?? ""
                    )
                  }
                />
                {ticketSection.ticket_section_is_duplicatable &&
                  ticketSectionIdx === sectionLastIndex && (
                    <Button
                      mt="md"
                      variant="light"
                      onClick={() =>
                        handleDuplicateSection(ticketSection.ticket_section_id)
                      }
                      fullWidth
                    >
                      {ticketSection.ticket_section_name} +
                    </Button>
                  )}
              </Flex>
            );
          })}

          {ticketSections.length > 0 && (
            <Button type="submit" mt="lg" fullWidth>
              {isEdit ? "Save Changes" : "Submit"}
            </Button>
          )}
        </form>
      </FormProvider>
    </>
  );
};

export default TicketForm;
