import {
  checkCSICodeDescriptionExists,
  checkCSICodeItemExists,
  checkCustomCSICodeValidity,
  getItem,
  getTicket,
} from "@/backend/api/get";
import {
  createCustomCSI,
  createItemDescriptionField,
  createItemDivision,
  createItemFromTicketRequest,
  createPedPartFromTicketRequest,
  createTicketComment,
  joinTeamGroupByTicketRequest,
  joinTeamProjectByTicketRequest,
} from "@/backend/api/post";
import { updateTicketStatus } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey, parseJSONIfValid } from "@/utils/string";
import {
  CreateTicketFormValues,
  CreateTicketPageOnLoad,
  TicketType,
} from "@/utils/types";
import { Button, Flex, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

type Props = {
  ticket: TicketType;
  ticketForm: CreateTicketFormValues;
  setTicket: Dispatch<SetStateAction<TicketType>>;
  user: CreateTicketPageOnLoad["member"];
  setRequestCommentList: Dispatch<SetStateAction<TicketType["ticket_comment"]>>;
};

const TicketActionSection = ({
  ticket,
  ticketForm,
  setTicket,
  user,
  setRequestCommentList,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const currentUser = useUserProfile();
  const rejectTicketFormMethods = useForm<{ rejectionMessage: string }>({
    defaultValues: { rejectionMessage: "" },
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateTicketStatus = async (
    status: string,
    rejectionMessage: string | null
  ) => {
    if (!teamMember) return;
    try {
      setIsLoading(true);
      const data = await updateTicketStatus(supabaseClient, {
        ticketId: ticket.ticket_id,
        status,
        rejectionMessage,
      });

      const newCommentId = uuidv4();
      let commentContent = "";
      let notificationContent = "";
      let notificationType = "REQUEST";

      if (status === "INCORRECT" && rejectionMessage) {
        commentContent = `rejected this ticket with note: ${rejectionMessage}`;
        notificationContent = `rejected your ticket`;
        notificationType = "REJECT";
      }
      if (status === "CLOSED") {
        commentContent = `closed this ticket`;
        notificationContent = `closed your ticket`;
        notificationType = "APPROVE";
      }

      const commentData = await createTicketComment(supabaseClient, {
        commentInput: {
          ticket_comment_id: newCommentId,
          ticket_comment_content: `${user.team_member_user.user_first_name} ${user.team_member_user.user_last_name} ${commentContent}`,
          ticket_comment_type: `ACTION_${status}`,
          ticket_comment_team_member_id: user.team_member_id,
          ticket_comment_ticket_id: ticket.ticket_id,
        },
        notificationInput: [
          {
            notification_app: "REQUEST",
            notification_type: notificationType,
            notification_content: `${`${user.team_member_user.user_first_name} ${user.team_member_user.user_last_name}`} ${notificationContent}`,
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
          ...commentData,
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
      setTicket((ticket) => ({ ...ticket, ticket_status: data.ticket_status }));
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTicketAction = () =>
    modals.open({
      modalId: "rejectTicket",
      title: "Please add a reason why you rejected this ticket",
      centered: true,
      children: (
        <>
          <form
            onSubmit={rejectTicketFormMethods.handleSubmit(async (data) => {
              await handleUpdateTicketStatus(
                "INCORRECT",
                data.rejectionMessage
              );
              modals.close("rejectTicket");
            })}
          >
            <TextInput
              label="Rejection Message"
              {...rejectTicketFormMethods.register("rejectionMessage", {
                required: "This field is required",
              })}
            />
            <Flex mt="md" align="center" justify="flex-end" gap="sm">
              <Button
                variant="default"
                color="dimmed"
                onClick={() => {
                  modals.close("rejectTicket");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" color="red" loading={isLoading}>
                Reject
              </Button>
            </Flex>
          </form>
        </>
      ),
    });

  const handleTicketClosing = async () => {
    const currentTicket = await getTicket(supabaseClient, {
      ticketId: ticket.ticket_id,
    });

    if (!currentTicket) {
      notifications.show({
        message: "Ticket is undefined.",
        color: "red",
      });
      return;
    }

    const isAdminCurrentApprover =
      currentTicket.ticket_approver_team_member_id ===
      teamMember?.team_member_id;

    if (!isAdminCurrentApprover) {
      notifications.show({
        message:
          "This ticket has been reassigned. Please refresh the page to see the updated changes.",
        color: "red",
        autoClose: false,
      });
      return;
    }

    switch (ticket.ticket_category) {
      case "Request Custom CSI":
        return handleCustomCSIClosing();
      case "Request Item CSI":
        return handleItemCSIClosing();
      case "Request Item Option":
        return handleItemOptionClosing();
      case "Request PED Equipment Part":
        return handleRequestPedEquipmentPartClosing();
      case "Item Request":
        return handleItemRequestClosing();
      case "Request to Join Team Group":
        return handleRequestToJoinTeamGroupClosing();
      case "Request to Join Team Project":
        return handleRequestToJoinTeamProjectClosing();
      default:
        handleUpdateTicketStatus("CLOSED", null);
        return;
    }
  };

  const handleCustomCSIClosing = async () => {
    try {
      setIsLoading(true);

      // check if csi exists
      const itemName = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[0].ticket_field_response}`
      );
      const csiCodeDescription = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[1].ticket_field_response}`
      );
      const csiCode = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[2].ticket_field_response}`
      );

      const csiCodeDescriptionExists = await checkCSICodeDescriptionExists(
        supabaseClient,
        { csiCodeDescription }
      );

      const {
        csiCodeLevelThreeIdExists,
        csiCodeLevelTwoMinorGroupIdExists,
        csiCodeLevelTwoMajorGroupIdExists,
        csiCodeDivisionIdExists,
      } = await checkCustomCSICodeValidity(supabaseClient, {
        csiCode: `${csiCode}`,
      });

      if (
        !csiCodeDescriptionExists &&
        !csiCodeLevelThreeIdExists &&
        csiCodeLevelTwoMinorGroupIdExists &&
        csiCodeLevelTwoMajorGroupIdExists &&
        csiCodeDivisionIdExists
      ) {
        // add custom csi
        await createCustomCSI(supabaseClient, {
          csiCode,
          csiCodeDescription,
          itemName,
        });

        handleUpdateTicketStatus("CLOSED", null);
      } else {
        notifications.show({
          message: "Create custom CSI Code failed. Please try again later.",
          color: "red",
        });
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemCSIClosing = async () => {
    try {
      setIsLoading(true);

      // check if csi exists
      const itemName = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[0].ticket_field_response}`
      );
      const csiCode = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[2].ticket_field_response}`
      );
      const divisionId = `${csiCode}`.split(" ")[0];
      const item = await getItem(supabaseClient, {
        itemName,
        teamId: activeTeam.team_id,
      });

      if (!item) return;
      const csiCodeItemExists = await checkCSICodeItemExists(supabaseClient, {
        divisionId,
        itemId: item.item_id,
      });
      if (!csiCodeItemExists) {
        // add custom csi
        await createItemDivision(supabaseClient, {
          itemId: item.item_id,
          divisionId,
        });
      }
      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemOptionClosing = async () => {
    try {
      setIsLoading(true);

      // check if csi exists
      const itemName = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[0].ticket_field_response}`
      );
      const itemDescription = parseJSONIfValid(
        `${ticketForm.ticket_sections[0].ticket_section_fields[1].ticket_field_response}`
      );
      const item = await getItem(supabaseClient, {
        itemName,
        teamId: activeTeam.team_id,
      });

      const itemDescriptionData = item.item_description.find(
        (description) => description.item_description_label === itemDescription
      );

      if (!itemDescriptionData) return;
      const isWithUom =
        itemDescriptionData.item_description_field[0].item_description_field_uom
          .length > 0;
      const itemDescriptionId = itemDescriptionData?.item_description_id;
      const valueExistsList = itemDescriptionData?.item_description_field.map(
        (field) => {
          if (isWithUom)
            return `${field.item_description_field_value} ${field.item_description_field_uom[0]?.item_description_field_uom}`.toLowerCase();
          else return field.item_description_field_value.toLowerCase();
        }
      );

      const fieldValueList: { value: string; uom: string }[] = [];
      ticketForm.ticket_sections.slice(1).map((section) => {
        const value = parseJSONIfValid(
          `${section.ticket_section_fields[0].ticket_field_response}`
        );
        const valueUom = parseJSONIfValid(
          `${section.ticket_section_fields[1].ticket_field_response}`
        );
        const fullValue = isWithUom ? `${value} ${valueUom}` : value;

        const valueExists = valueExistsList?.includes(fullValue.toLowerCase());
        if (!valueExists) fieldValueList.push({ value: value, uom: valueUom });
      });

      if (fieldValueList.length > 0) {
        await createItemDescriptionField(
          supabaseClient,
          fieldValueList.map(({ value, uom }) => {
            return {
              item_description_field_value: `${value}`,
              item_description_field_is_available: true,
              item_description_field_item_description_id: `${itemDescriptionId}`,
              item_description_field_uom: uom,
            };
          })
        );
      }

      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPedEquipmentPartClosing = async () => {
    try {
      setIsLoading(true);
      if (!teamMember) throw new Error();

      await createPedPartFromTicketRequest(supabaseClient, {
        equipmentName: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[0]
            .ticket_field_response as string
        ),
        partName: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[1]
            .ticket_field_response as string
        ),
        partNumber: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[2]
            .ticket_field_response as string
        ),
        brand: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[3]
            .ticket_field_response as string
        ),
        model: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[4]
            .ticket_field_response as string
        ),
        unitOfMeasure: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[5]
            .ticket_field_response as string
        ),
        category: JSON.parse(
          ticketForm.ticket_sections[0].ticket_section_fields[6]
            .ticket_field_response as string
        ),
        teamId: activeTeam.team_id,
      });

      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemRequestClosing = async () => {
    try {
      setIsLoading(true);
      if (!teamMember) throw new Error();

      await createItemFromTicketRequest(supabaseClient, {
        generalName: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[0]
            .ticket_field_response as string
        ),
        unitOfMeasurement: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[1]
            .ticket_field_response as string
        ),
        glAccount: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[2]
            .ticket_field_response as string
        ),
        divisionList: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[3]
            .ticket_field_response as string
        ).split(","),
        divisionDescription: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[4]
            .ticket_field_response as string
        ),
        isPedItem: Boolean(
          safeParse(
            ticketForm.ticket_sections[0].ticket_section_fields[5]
              .ticket_field_response as string
          )
        ),
        isITAssetItem: Boolean(
          safeParse(
            ticketForm.ticket_sections[0].ticket_section_fields[6]
              .ticket_field_response as string
          )
        ),
        descriptionList: ticketForm.ticket_sections.slice(1).map((section) => {
          return {
            description: safeParse(
              section.ticket_section_fields[0].ticket_field_response as string
            ),
            isWithUom: Boolean(
              safeParse(
                section.ticket_section_fields[1].ticket_field_response as string
              )
            ),
          };
        }),
        teamId: activeTeam.team_id,
      });

      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestToJoinTeamGroupClosing = async () => {
    try {
      setIsLoading(true);
      if (!teamMember) throw new Error();

      await joinTeamGroupByTicketRequest(supabaseClient, {
        groupList: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[0]
            .ticket_field_response as string
        )
          .split(",")
          .map((groupName: string) => `'${groupName}'`),
        teamMemberId: ticket.ticket_requester_team_member_id,
        teamId: activeTeam.team_id,
      });

      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestToJoinTeamProjectClosing = async () => {
    try {
      setIsLoading(true);
      if (!teamMember) throw new Error();

      await joinTeamProjectByTicketRequest(supabaseClient, {
        projectList: safeParse(
          ticketForm.ticket_sections[0].ticket_section_fields[0]
            .ticket_field_response as string
        )
          .split(",")
          .map((projectName: string) => `'${projectName}'`),
        teamMemberId: ticket.ticket_requester_team_member_id,
        teamId: activeTeam.team_id,
      });

      handleUpdateTicketStatus("CLOSED", null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Text weight={600}>Ticket Action</Text>
      <Flex gap="xl" wrap="wrap">
        <Button
          sx={{ flex: 1 }}
          size="md"
          color="red"
          onClick={handleRejectTicketAction}
          loading={isLoading}
        >
          Reject
        </Button>
        <Button
          sx={{ flex: 1 }}
          size="md"
          color="green"
          loading={isLoading}
          onClick={async () => {
            await handleTicketClosing();
          }}
        >
          Close
        </Button>
      </Flex>
    </>
  );
};

export default TicketActionSection;
