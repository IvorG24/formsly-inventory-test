import { getAvatarColor } from "@/utils/styling";
import {
  TeamGroupTableRow,
  TeamMemberTableRow,
  TeamProjectTableRow,
  UserTableRow,
  UserValidIDTableRow,
} from "@/utils/types";
import {
  Avatar,
  Badge,
  Container,
  Divider,
  Flex,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import MemberGroup from "./MemberGroup";
import MemberProject from "./MemberProject";

type Props = {
  member: TeamMemberTableRow & {
    team_member_user: UserTableRow & { user_employee_number: string };
  };
  userValidId: UserValidIDTableRow | undefined;
  groupList: {
    team_group_member_id: string;
    team_group: TeamGroupTableRow;
  }[];
  groupCount: number;
  projectList: {
    team_project_member_id: string;
    team_project: TeamProjectTableRow;
  }[];
  projectCount: number;
};

const TeamMemberPage = ({
  member,
  userValidId,
  groupList,
  groupCount,
  projectList,
  projectCount,
}: Props) => {
  const getValidIDStatus = () => {
    if (!userValidId) return;
    let label = "";
    let color = "";
    if (userValidId.user_valid_id_status === "APPROVED") {
      label = "VERIFIED";
      color = "green";
    } else if (userValidId.user_valid_id_status === "REJECTED") {
      label = "REJECTED";
      color = "red";
    } else {
      label = "PENDING";
      color = "yellow";
    }

    return {
      label,
      color,
    };
  };

  const validIDStatus = getValidIDStatus();

  return (
    <Container>
      <Title order={2}>Member Profile</Title>
      <Paper p="lg" shadow="xs" mt="xl">
        <Stack spacing={12}>
          <Text weight={600}>Personal Info</Text>
          <Divider />

          <Flex mt="md" justify="space-between" gap="xl" wrap="wrap">
            <Avatar
              size={150}
              src={member.team_member_user.user_avatar}
              color={getAvatarColor(
                Number(`${member.team_member_user.user_id.charCodeAt(0)}`)
              )}
              radius={150}
            >
              {member.team_member_user.user_first_name[0].toUpperCase()}
              {member.team_member_user.user_last_name[0].toUpperCase()}
            </Avatar>

            {userValidId && validIDStatus && (
              <Badge
                variant="filled"
                pr={0}
                rightSection={
                  <Badge color={validIDStatus.color}>
                    {validIDStatus.label}
                  </Badge>
                }
              >
                {userValidId.user_valid_id_type}
              </Badge>
            )}
          </Flex>

          <Flex direction={{ base: "column", md: "row" }} gap={16}>
            <TextInput
              w="100%"
              label="Email"
              variant="filled"
              readOnly
              value={member.team_member_user.user_email}
            />
            <TextInput
              w="100%"
              label="Employee Number"
              variant="filled"
              readOnly
              value={`${member.team_member_user.user_employee_number ?? "---"}`}
            />
          </Flex>

          <Flex direction={{ base: "column", md: "row" }} gap={16}>
            <TextInput
              w="100%"
              label="First Name"
              variant="filled"
              readOnly
              value={member.team_member_user.user_first_name}
            />
            <TextInput
              w="100%"
              label="Last Name"
              variant="filled"
              readOnly
              value={member.team_member_user.user_last_name}
            />
          </Flex>

          <Flex direction={{ base: "column", md: "row" }} gap={16}>
            <TextInput
              w="100%"
              label="Mobile Number"
              maxLength={10}
              icon="+63"
              variant="filled"
              readOnly
              value={member.team_member_user.user_phone_number ?? ""}
            />
            <TextInput
              w="100%"
              label="Job Title"
              variant="filled"
              readOnly
              value={`${member.team_member_user.user_job_title}`}
            />
          </Flex>
        </Stack>
      </Paper>

      <MemberGroup
        memberId={member.team_member_id}
        groupList={groupList}
        groupCount={groupCount}
      />

      <MemberProject
        memberId={member.team_member_id}
        projectList={projectList}
        projectCount={projectCount}
      />
    </Container>
  );
};

export default TeamMemberPage;
