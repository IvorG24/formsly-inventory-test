import { CreateTicketFormValues, TicketType } from "@/utils/types";
import { Box, Button, Divider, Flex, Group, Stack, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import TicketResponseValue from "./TicketResponseValue";

type Props = {
  ticket: TicketType;
  ticketStatus: string;
  ticketForm: CreateTicketFormValues;
  category: string;
  canUserEditResponse: boolean;
  setIsEditingResponse: Dispatch<SetStateAction<boolean>>;
  isEditingResponse: boolean;
};

const TicketResponseSection = ({
  ticketStatus,
  ticketForm,
  category,
  canUserEditResponse,
  isEditingResponse,
  setIsEditingResponse,
}: Props) => {
  return (
    <Stack>
      <Group position="apart">
        <Group spacing={8}>
          <Text weight={600}>Ticket Details</Text>
          {isEditingResponse && (
            <Text size="xs" color="blue">
              (Edit Mode)
            </Text>
          )}
        </Group>
        {canUserEditResponse &&
          ticketStatus === "UNDER REVIEW" &&
          (isEditingResponse ? (
            <Button
              sx={{ alignSelf: "flex-end" }}
              w={100}
              size="sm"
              variant="default"
              onClick={() => {
                setIsEditingResponse(false);
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              sx={{ alignSelf: "flex-end" }}
              w={100}
              size="sm"
              color="yellow"
              onClick={() => {
                setIsEditingResponse(true);
              }}
            >
              Override
            </Button>
          ))}
      </Group>

      {!isEditingResponse && (
        <Flex direction="column">
          {ticketForm.ticket_sections.map((section, sectionIdx) => (
            <Flex direction="column" key={sectionIdx}>
              {sectionIdx !== 0 && (
                <Flex align="center">
                  <Divider
                    label={`${section.ticket_section_name} #${sectionIdx}`}
                    sx={{ flex: 1 }}
                    mt="sm"
                  />
                </Flex>
              )}
              {section.ticket_section_fields.map((field, fieldIdx) => {
                if (!field.ticket_field_response) return null;
                return (
                  <Box
                    mt={sectionIdx === 0 && fieldIdx === 0 ? 0 : "sm"}
                    key={`${sectionIdx}-${fieldIdx}`}
                  >
                    <Text size={14} weight={600}>
                      {field.ticket_field_name}
                    </Text>
                    <TicketResponseValue category={category} field={field} />
                  </Box>
                );
              })}
            </Flex>
          ))}
        </Flex>
      )}
    </Stack>
  );
};

export default TicketResponseSection;
