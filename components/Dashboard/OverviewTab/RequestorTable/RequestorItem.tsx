import { startCase } from "@/utils/string";
import { getAvatarColor, getStatusToColor } from "@/utils/styling";
import { DashboardRequestorAndSignerType, TeamMemberType } from "@/utils/types";
import {
  Avatar,
  Badge,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";

type RequestorItemProps = {
  requestor: DashboardRequestorAndSignerType;
  teamMemberData: TeamMemberType;
};

const RequestorItem = ({ requestor, teamMemberData }: RequestorItemProps) => {
  const progressSections = requestor.request.map(({ label, value }) => ({
    value: (value / requestor.total) * 100,
    color: `${getStatusToColor(label) || "dark"}`,
    tooltip: `${startCase(label)}: ${value}`,
    // label: `${startCase(key)}: ${value}`,
  }));
  const user = teamMemberData.team_member_user;
  const requestorFullname = startCase(
    `${user.user_first_name} ${user.user_last_name}`
  );
  const progressSectionsWithoutTotal = progressSections.filter(
    (section) => !section.tooltip.includes("Total")
  );

  return (
    <Stack spacing="xs">
      <Group position="apart">
        <Tooltip label={requestorFullname}>
          <Group spacing="xs">
            <Avatar
              size="sm"
              radius="xl"
              src={user.user_avatar ?? null}
              color={getAvatarColor(Number(`${user.user_id.charCodeAt(0)}`))}
            >
              {!user.user_avatar &&
                `${user.user_first_name[0]}${user.user_last_name[0]}`}
            </Avatar>
            <Text weight={500} maw={120} truncate>
              {requestorFullname}
            </Text>
          </Group>
        </Tooltip>
        <Tooltip
          label={progressSectionsWithoutTotal.map((section, idx) => (
            <Text key={section.tooltip + idx}>{section.tooltip}</Text>
          ))}
        >
          <Badge size="sm" variant="filled" color="dark">
            Total: {requestor.total.toLocaleString()}
          </Badge>
        </Tooltip>
      </Group>
      <Progress size="md" radius="lg" sections={progressSectionsWithoutTotal} />
    </Stack>
  );
};

export default RequestorItem;
