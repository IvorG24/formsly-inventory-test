import { checkCSICodeItemExists, getCSICode, getItem } from "@/backend/api/get";
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

const TicketRequestItemCSIForm = ({
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
  const { handleSubmit, getValues, control, setError } =
    createTicketFormMethods;

  const {
    fields: ticketSections,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "ticket_sections",
  });

  const handleCreateTicket = async (data: CreateTicketFormValues) => {
    try {
      setIsLoading(true);
      if (!user) return;

      // check if csi exists
      const itemName =
        data.ticket_sections[0].ticket_section_fields[0].ticket_field_response;
      const csiCode =
        data.ticket_sections[0].ticket_section_fields[2].ticket_field_response;
      const divisionId = `${csiCode}`.split(" ")[0];
      const csiExists = await checkIfCSIExists(`${divisionId}`, `${itemName}`);
      if (csiExists) return;

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
      const itemName =
        data.ticket_sections[0].ticket_section_fields[0].ticket_field_response;
      const csiCode =
        data.ticket_sections[0].ticket_section_fields[2].ticket_field_response;
      const divisionId = `${csiCode}`.split(" ")[0];
      const csiExists = await checkIfCSIExists(`${divisionId}`, `${itemName}`);
      if (csiExists) return;

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

  const checkIfCSIExists = async (divisionId: string, itemName: string) => {
    const item = await getItem(supabaseClient, {
      itemName,
      teamId: activeTeam.team_id,
    });
    if (!item) return;
    const csiCodeItemExists = await checkCSICodeItemExists(supabaseClient, {
      divisionId,
      itemId: item.item_id,
    });

    if (csiCodeItemExists)
      setError(
        `ticket_sections.0.ticket_section_fields.1.ticket_field_response`,
        { message: `CSI Code already exists for ${itemName}` }
      );

    return csiCodeItemExists;
  };

  const handleCSICodeChange = async (index: number, value: string | null) => {
    const newSection = getValues(`ticket_sections.${index}`);

    if (value) {
      const csiCode = await getCSICode(supabaseClient, { csiCode: value });

      const generalField = [
        ...newSection.ticket_section_fields.slice(0, 2),
        {
          ...newSection.ticket_section_fields[2],
          ticket_field_response: csiCode?.csi_code_section,
        },
        {
          ...newSection.ticket_section_fields[3],
          ticket_field_response: csiCode?.csi_code_division_description,
        },
        {
          ...newSection.ticket_section_fields[4],
          ticket_field_response:
            csiCode?.csi_code_level_two_major_group_description,
        },
        {
          ...newSection.ticket_section_fields[5],
          ticket_field_response:
            csiCode?.csi_code_level_two_minor_group_description,
        },
      ];

      updateSection(index, {
        ...newSection,
        ticket_section_fields: generalField,
      });
    } else {
      const generalField = [
        ...newSection.ticket_section_fields.slice(0, 2),
        ...newSection.ticket_section_fields.slice(2, 6).map((field) => {
          return {
            ...field,
            ticket_field_response: "",
          };
        }),
      ];
      updateSection(index, {
        ...newSection,
        ticket_section_fields: generalField,
      });
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
              requestItemCSIMethods={{
                onCSICodeChange: handleCSICodeChange,
              }}
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

export default TicketRequestItemCSIForm;
