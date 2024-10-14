import { pedPartCheck } from "@/backend/api/get";
import { createTicket, editTicket } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { CreateTicketFormValues } from "@/utils/types";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import TicketFormSection from "../CreateTicketPage/TicketFormSection";

type Props = {
  category: string;
  memberId: string;
  ticketForm: CreateTicketFormValues | null;
  isEdit?: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  onOverrideTicket?: () => void;
  onClose?: () => void;
  onOverrideResponseComment?: (
    formValues: CreateTicketFormValues
  ) => Promise<void>;
};

const TicketRequestPEDEquipmentPartForm = ({
  category,
  memberId,
  ticketForm,
  isEdit,
  setIsLoading,
  onOverrideTicket,
  onClose,
  onOverrideResponseComment,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const { ticketId } = router.query;
  const user = useUserProfile();

  const createTicketFormMethods = useForm<CreateTicketFormValues>();
  const { handleSubmit, control } = createTicketFormMethods;

  const { fields: ticketSections, replace: replaceSection } = useFieldArray({
    control,
    name: "ticket_sections",
  });

  const handleCreateTicket = async (data: CreateTicketFormValues) => {
    try {
      if (!user) return;

      setIsLoading(true);

      const pedPartExists = await pedPartCheck(supabaseClient, {
        equipmentName: data.ticket_sections[0].ticket_section_fields[0]
          .ticket_field_response as string,
        partName:
          `${data.ticket_sections[0].ticket_section_fields[1].ticket_field_response}`
            .trim()
            .toUpperCase(),
        partNumber:
          `${data.ticket_sections[0].ticket_section_fields[2].ticket_field_response}`
            .trim()
            .toUpperCase()
            .replace(/[^a-zA-Z0-9]/g, ""),
        brand:
          `${data.ticket_sections[0].ticket_section_fields[3].ticket_field_response}`
            .trim()
            .toUpperCase(),
        model:
          `${data.ticket_sections[0].ticket_section_fields[4].ticket_field_response}`
            .trim()
            .toUpperCase(),
        unitOfMeasure:
          `${data.ticket_sections[0].ticket_section_fields[5].ticket_field_response}`.trim(),
        category:
          `${data.ticket_sections[0].ticket_section_fields[6].ticket_field_response}`
            .trim()
            .toUpperCase(),
      });

      if (pedPartExists) {
        notifications.show({
          message: "PED Part already exists.",
          color: "orange",
        });
        return;
      }

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

      const pedPartExists = await pedPartCheck(supabaseClient, {
        equipmentName: data.ticket_sections[0].ticket_section_fields[0]
          .ticket_field_response as string,
        partName:
          `${data.ticket_sections[0].ticket_section_fields[1].ticket_field_response}`
            .trim()
            .toUpperCase(),
        partNumber:
          `${data.ticket_sections[0].ticket_section_fields[2].ticket_field_response}`
            .trim()
            .toUpperCase()
            .replace(/[^a-zA-Z0-9]/g, ""),
        brand:
          `${data.ticket_sections[0].ticket_section_fields[3].ticket_field_response}`
            .trim()
            .toUpperCase(),
        model:
          `${data.ticket_sections[0].ticket_section_fields[4].ticket_field_response}`
            .trim()
            .toUpperCase(),
        unitOfMeasure:
          `${data.ticket_sections[0].ticket_section_fields[5].ticket_field_response}`.trim(),
        category:
          `${data.ticket_sections[0].ticket_section_fields[6].ticket_field_response}`
            .trim()
            .toUpperCase(),
      });

      if (pedPartExists) {
        notifications.show({
          message: "PED Part already exists.",
          color: "orange",
        });
        return;
      }

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
          {ticketSections.map((ticketSection, ticketSectionIdx) => (
            <TicketFormSection
              category={category}
              ticketSection={ticketSection}
              ticketSectionIdx={ticketSectionIdx}
              key={ticketSection.id}
            />
          ))}
          <Button type="submit" mt="lg" fullWidth>
            {isEdit ? "Save Changes" : "Submit"}
          </Button>
        </form>
      </FormProvider>
    </>
  );
};

export default TicketRequestPEDEquipmentPartForm;
