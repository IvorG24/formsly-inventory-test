import {
  checkCSICodeDescriptionExists,
  checkCustomCSICodeValidity,
} from "@/backend/api/get";
import { createTicket, editTicket } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { escapeQuotes, formatTeamNameToUrlKey } from "@/utils/string";
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

const TicketRequestCustomCSIForm = ({
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
  const { handleSubmit, control, setError } = createTicketFormMethods;

  const { fields: ticketSections, replace: replaceSection } = useFieldArray({
    control,
    name: "ticket_sections",
  });

  const handleCreateTicket = async (data: CreateTicketFormValues) => {
    try {
      setIsLoading(true);
      if (!user) return;

      // check if csi exists
      const csiCodeDescription =
        data.ticket_sections[0].ticket_section_fields[1].ticket_field_response;
      const csiCode =
        data.ticket_sections[0].ticket_section_fields[2].ticket_field_response;

      const csiValid = await checkIfCSIValid(
        `${csiCode}`,
        escapeQuotes(`${csiCodeDescription}`.trim())
      );

      if (!csiValid) return;

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

      // check if csi exists
      const csiCodeDescription =
        data.ticket_sections[0].ticket_section_fields[1].ticket_field_response;
      const csiCode =
        data.ticket_sections[0].ticket_section_fields[2].ticket_field_response;

      const csiValid = await checkIfCSIValid(
        `${csiCode}`,
        `${csiCodeDescription}`
      );
      if (!csiValid) return;

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

  const checkIfCSIValid = async (
    csiCode: string,
    csiCodeDescription: string
  ) => {
    const csiCodeDescriptionExists = await checkCSICodeDescriptionExists(
      supabaseClient,
      {
        csiCodeDescription: `${csiCodeDescription}`,
      }
    );
    if (csiCodeDescriptionExists)
      setError(
        `ticket_sections.0.ticket_section_fields.1.ticket_field_response`,
        { message: "CSI Code Description already exists" }
      );

    const {
      csiCodeLevelThreeIdExists,
      csiCodeLevelTwoMinorGroupIdExists,
      csiCodeLevelTwoMajorGroupIdExists,
      csiCodeDivisionIdExists,
    } = await checkCustomCSICodeValidity(supabaseClient, {
      csiCode: `${csiCode}`,
    });
    let error = "";
    if (csiCodeLevelThreeIdExists) error = "CSI Code already exists";
    else if (!csiCodeLevelTwoMinorGroupIdExists)
      error = "CSI Code Invalid, level two minor group id doesn't exists";
    else if (!csiCodeLevelTwoMajorGroupIdExists)
      error = "CSI Code Invalid, level two major group id doesn't exists";
    else if (!csiCodeDivisionIdExists)
      error = "CSI Code Invalid, division id doesn't exists";

    if (error) {
      setError(
        `ticket_sections.0.ticket_section_fields.2.ticket_field_response`,
        { message: error }
      );
    }

    return !Boolean(error);
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

export default TicketRequestCustomCSIForm;
