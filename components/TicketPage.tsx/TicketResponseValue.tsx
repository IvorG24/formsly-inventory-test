import { getMemberUser } from "@/backend/api/get";
import { Database } from "@/utils/database";
import { isUUID, parseJSONIfValid } from "@/utils/string";
import {
  getAvatarColor,
  getFileType,
  getFileTypeColor,
  shortenFileName,
} from "@/utils/styling";
import { CreateTicketFormValues, TeamMemberWithUser } from "@/utils/types";
import { Avatar, Button, Flex, Text } from "@mantine/core";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

type Props = {
  category: string;
  field: CreateTicketFormValues["ticket_sections"][0]["ticket_section_fields"][0];
};

const TicketResponseValue = ({ category, field }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const parsedValue = parseJSONIfValid(`${field.ticket_field_response}`);
  const [memberProfile, setMemberProfile] = useState<TeamMemberWithUser | null>(
    null
  );
  const getMemberProfile = async () => {
    const member = await getMemberUser(supabaseClient, {
      teamMemberId: parsedValue,
    });
    setMemberProfile(member);
  };

  useEffect(() => {
    if (
      field.ticket_field_type === "SELECT" &&
      category === "Incident Report for Employees" &&
      isUUID(parsedValue) &&
      field.ticket_field_name === "Reportee"
    ) {
      getMemberProfile();
    }
  }, [parsedValue]);

  const getResponse = () => {
    switch (field.ticket_field_type) {
      case "SELECT":
        if (isUUID(parsedValue) && field.ticket_field_name === "Reportee") {
          return (
            memberProfile && (
              <Flex gap="xs" mt="xs">
                <Avatar
                  size={40}
                  src={memberProfile.team_member_user?.user_avatar}
                  color={getAvatarColor(
                    Number(
                      `${memberProfile.team_member_user?.user_id.charCodeAt(0)}`
                    )
                  )}
                  radius="xl"
                >
                  {(
                    memberProfile.team_member_user?.user_first_name[0] +
                    memberProfile.team_member_user?.user_last_name[0]
                  ).toUpperCase()}
                </Avatar>
                <Flex direction="column">
                  <Text size="sm">{`${memberProfile.team_member_user.user_first_name} ${memberProfile.team_member_user.user_last_name}`}</Text>
                  <Text size="xs" color="dimmed">
                    {memberProfile.team_member_user.user_username}
                  </Text>
                </Flex>
              </Flex>
            )
          );
        } else {
          return (
            <Flex direction="column">
              {`${parsedValue}`.split("\n").map((text, textId) => (
                <Text key={textId}>{text}</Text>
              ))}
            </Flex>
          );
        }

      case "FILE":
        const fileName = parsedValue;

        return (
          <Button
            variant="light"
            color="gray"
            px={4}
            onClick={() => {
              window.open(parsedValue, "_blank");
            }}
            mt="xs"
            leftIcon={
              <Flex sx={{ flex: 1 }} align="center" gap="sm">
                <Avatar size="sm" color={getFileTypeColor(fileName)}>
                  {getFileType(fileName)}
                </Avatar>
                <Text truncate size="xs">
                  {shortenFileName(fileName, 30)}
                </Text>
              </Flex>
            }
          ></Button>
        );

      default:
        return (
          <Text>
            {`${parsedValue}`.split("\n").map((text, textId) => (
              <Text key={textId}>{text}</Text>
            ))}
          </Text>
        );
    }
  };

  return getResponse();
};

export default TicketResponseValue;
