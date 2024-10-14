import {
  checkItemName,
  getCSIDescriptionOptionBasedOnDivisionId,
  getItemDivisionOption,
  getItemUnitOfMeasurementOption,
} from "@/backend/api/get";
import { createTicket, editTicket } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { GL_ACCOUNT_CHOICES } from "@/utils/constant";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { CreateTicketFormValues } from "@/utils/types";
import { Box, Button, Flex, Skeleton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
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

const TicketItemRequestForm = ({
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

  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  const createTicketFormMethods = useForm<CreateTicketFormValues>();
  const { handleSubmit, control, setError, clearErrors, setValue, getValues } =
    createTicketFormMethods;

  const {
    fields: ticketSections,
    replace: replaceSection,
    update: updateSection,
    insert: insertSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "ticket_sections",
  });

  useEffect(() => {
    if (ticketForm) {
      const fetchOptions = async () => {
        try {
          setIsFetchingOptions(true);
          const divisionOption = (
            await getItemDivisionOption(supabaseClient)
          ).map((divisionId) => {
            return {
              label: `${divisionId.csi_code_division_description}`,
              value: `${divisionId.csi_code_division_id}`,
            };
          });

          const unitOfMeasurementOption = (
            await getItemUnitOfMeasurementOption(supabaseClient, {
              teamId: activeTeam.team_id,
            })
          ).map((uom) => {
            return {
              label: `${uom.item_unit_of_measurement}`,
              value: `${uom.item_unit_of_measurement}`,
            };
          });

          const divisionResponse =
            `${ticketForm.ticket_sections[0].ticket_section_fields[3].ticket_field_response}`
              .split(",")
              .map((division) => {
                const response = divisionOption.find(
                  (option) => option.value === division
                );
                return response?.value;
              });

          let divisionDescriptionOption: { label: string; value: string }[] =
            [];
          if (divisionResponse) {
            const data = await getCSIDescriptionOptionBasedOnDivisionId(
              supabaseClient,
              {
                divisionId: divisionResponse as string[],
              }
            );
            divisionDescriptionOption = data.map((description) => {
              return {
                label: description.csi_code_level_three_description,
                value: description.csi_code_level_three_description,
              };
            });
          }

          replaceSection([
            {
              ...ticketForm.ticket_sections[0],
              ticket_section_fields: [
                ticketForm.ticket_sections[0].ticket_section_fields[0],
                {
                  ...ticketForm.ticket_sections[0].ticket_section_fields[1],
                  ticket_field_option: unitOfMeasurementOption,
                },
                {
                  ...ticketForm.ticket_sections[0].ticket_section_fields[2],
                  ticket_field_option: GL_ACCOUNT_CHOICES,
                },
                {
                  ...ticketForm.ticket_sections[0].ticket_section_fields[3],
                  ticket_field_option: divisionOption,
                  ticket_field_response: divisionResponse,
                },
                {
                  ...ticketForm.ticket_sections[0].ticket_section_fields[4],
                  ticket_field_is_read_only: false,
                  ticket_field_option: divisionDescriptionOption,
                },
                ...ticketForm.ticket_sections[0].ticket_section_fields.slice(5),
              ],
            },
            ...ticketForm.ticket_sections.slice(1),
          ]);
        } catch (e) {
          notifications.show({
            message: "Something went wrong. Please try again later.",
            color: "red",
          });
        } finally {
          setIsFetchingOptions(false);
        }
      };
      fetchOptions();
    }
  }, []);

  const handleCreateTicket = async (data: CreateTicketFormValues) => {
    try {
      setIsLoading(true);
      if (!user) return;
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

  const handleGeneralNameBlur = async (value: string | null) => {
    if (!value) {
      clearErrors(
        "ticket_sections.0.ticket_section_fields.0.ticket_field_response"
      );
      return;
    }
    try {
      setLoadingFieldList([{ sectionIndex: 0, fieldIndex: 0 }]);
      const isExisting = await checkItemName(supabaseClient, {
        itemName: value.toUpperCase().trim(),
        teamId: activeTeam.team_id,
      });

      if (isExisting) {
        setError(
          "ticket_sections.0.ticket_section_fields.0.ticket_field_response",
          { message: "Item already exists" }
        );
      } else {
        clearErrors(
          "ticket_sections.0.ticket_section_fields.0.ticket_field_response"
        );
      }
    } catch {
      setValue(
        "ticket_sections.0.ticket_section_fields.0.ticket_field_response",
        ""
      );
      clearErrors(
        "ticket_sections.0.ticket_section_fields.0.ticket_field_response"
      );
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleDivisionBlur = async (value: string[] | null) => {
    const newSection = getValues("ticket_sections.0");
    try {
      setLoadingFieldList([{ sectionIndex: 0, fieldIndex: 5 }]);

      if (value?.length) {
        const data = await getCSIDescriptionOptionBasedOnDivisionId(
          supabaseClient,
          {
            divisionId: value,
          }
        );
        const divisionDescriptionOption = data.map((description) => {
          return {
            label: description.csi_code_level_three_description,
            value: description.csi_code_level_three_description,
          };
        });

        updateSection(0, {
          ...newSection,
          ticket_section_fields: [
            ...newSection.ticket_section_fields.slice(0, 4),
            {
              ...newSection.ticket_section_fields[4],
              ticket_field_response: "",
              ticket_field_option: divisionDescriptionOption,
              ticket_field_is_read_only: false,
            },
            ...newSection.ticket_section_fields.slice(5),
          ],
        });
      } else {
        updateSection(0, {
          ...newSection,
          ticket_section_fields: [
            ...newSection.ticket_section_fields.slice(0, 4),
            {
              ...newSection.ticket_section_fields[4],
              ticket_field_response: "",
              ticket_field_option: [],
              ticket_field_is_read_only: true,
            },
            ...newSection.ticket_section_fields.slice(5),
          ],
        });
      }
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setValue(
        "ticket_sections.0.ticket_section_fields.4.ticket_field_response",
        ""
      );
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePEDItemChange = async (value: boolean) => {
    if (value) {
      setValue(
        "ticket_sections.0.ticket_section_fields.6.ticket_field_response",
        !value
      );
    }
  };

  const handleITAssetItemChange = async (value: boolean) => {
    if (value) {
      setValue(
        "ticket_sections.0.ticket_section_fields.5.ticket_field_response",
        !value
      );
    }
  };

  if (isFetchingOptions) {
    return (
      <Box>
        <Skeleton height={14} mt="md" w="40%" radius="xs" />
        <Skeleton height={32} mt={6} radius="xs" />
        <Skeleton height={14} mt="md" w="40%" radius="xs" />
        <Skeleton height={200} mt={6} radius="xs" />

        <Skeleton height={32} mt="md" radius="xs" />
      </Box>
    );
  }

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
                  loadingFieldList={loadingFieldList}
                  sectionIndex={ticketSectionIdx}
                  category={category}
                  ticketSection={ticketSection}
                  ticketSectionIdx={ticketSectionIdx}
                  key={ticketSection.id}
                  itemRequestMethods={{
                    onGeneralNameBlur: handleGeneralNameBlur,
                    onDivisionBlur: handleDivisionBlur,
                    onPEDItemChange: handlePEDItemChange,
                    onITAssetItemChange: handleITAssetItemChange,
                  }}
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
          <Button type="submit" mt="lg" fullWidth>
            {isEdit ? "Save Changes" : "Submit"}
          </Button>
        </form>
      </FormProvider>
    </>
  );
};

export default TicketItemRequestForm;
