import { useUserTeamMember } from "@/stores/useUserStore";
import { startCase } from "@/utils/string";
import { MemberRoleType, TeamMemberType } from "@/utils/types";
import { ActionIcon, Menu, Text } from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import {
  IconArrowsLeftRight,
  IconDotsVertical,
  IconTrash,
  IconUserDown,
  IconUserShare,
  IconUserUp,
} from "@tabler/icons-react";
import { useRouter } from "next/router";

type Props = {
  member: TeamMemberType;
  onUpdateMemberRole: (memberId: string, role: MemberRoleType) => void;
  onRemoveFromTeam: (memberId: string) => void;
  onTransferOwnership: (ownerId: string, memberId: string) => void;
};

const TeamMemberMenu = ({
  member,
  onRemoveFromTeam,
  onUpdateMemberRole,
  onTransferOwnership,
}: Props) => {
  const defaultMenuIconProps = { size: 20 };
  const router = useRouter();
  const authTeamMember = useUserTeamMember();

  const authUserRole = authTeamMember ? authTeamMember.team_member_role : null;
  const canUserUpdateMember =
    (authUserRole === "OWNER" &&
      authTeamMember?.team_member_user_id !==
        member.team_member_user.user_id) ||
    (authUserRole === "ADMIN" &&
      authTeamMember?.team_member_user_id !== member.team_member_user.user_id &&
      member.team_member_role !== "OWNER" &&
      member.team_member_role !== "ADMIN");

  const canUserAccessDangerZone =
    authTeamMember && authTeamMember.team_member_role === "OWNER";

  return (
    <Menu position="left-start" width={200} withArrow>
      <Menu.Target>
        <ActionIcon>
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          c="indigo"
          icon={<IconUserShare {...defaultMenuIconProps} />}
          onClick={async () =>
            await router.push(`/member/${member.team_member_id}`)
          }
        >
          View Profile
        </Menu.Item>
        {canUserUpdateMember && (
          <>
            {member.team_member_role !== "OWNER" && (
              <>
                <Menu.Divider />
                <Menu.Label>Team Role</Menu.Label>
                {member.team_member_role !== "APPROVER" ? (
                  <Menu.Item
                    icon={<IconUserUp {...defaultMenuIconProps} />}
                    onClick={() =>
                      openConfirmModal({
                        title: <Text>Change Role</Text>,
                        children: (
                          <Text size={14}>
                            Are you sure you want to promote
                            <Text weight={700} span>
                              &nbsp;
                              {startCase(
                                `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`
                              )}
                              &nbsp;
                            </Text>
                            to approver?
                          </Text>
                        ),
                        labels: { confirm: "Confirm", cancel: "Cancel" },
                        centered: true,
                        onConfirm: () =>
                          onUpdateMemberRole(member.team_member_id, "APPROVER"),
                      })
                    }
                  >
                    Promote to Approver
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    icon={<IconUserDown {...defaultMenuIconProps} />}
                    onClick={() =>
                      openConfirmModal({
                        title: <Text>Change Role</Text>,
                        children: (
                          <Text size={14}>
                            Are you sure you want to demote
                            <Text weight={700} span>
                              &nbsp;
                              {startCase(
                                `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`
                              )}
                              &nbsp;
                            </Text>
                            to member?
                          </Text>
                        ),
                        labels: { confirm: "Confirm", cancel: "Cancel" },
                        centered: true,
                        onConfirm: () =>
                          onUpdateMemberRole(member.team_member_id, "MEMBER"),
                      })
                    }
                  >
                    Demote to Member
                  </Menu.Item>
                )}
              </>
            )}

            {canUserAccessDangerZone && (
              <>
                <Menu.Divider />
                <Menu.Label>Danger zone</Menu.Label>

                {authTeamMember.team_member_role === "OWNER" && (
                  <Menu.Item
                    icon={<IconArrowsLeftRight {...defaultMenuIconProps} />}
                    onClick={() =>
                      openConfirmModal({
                        title: <Text>Transfer Ownership</Text>,
                        children: (
                          <Text size={14}>
                            Are you sure you want to transfer the ownership of
                            this team to
                            <Text weight={700} span>
                              &nbsp;
                              {startCase(
                                `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`
                              )}
                            </Text>
                            ?
                          </Text>
                        ),
                        labels: { confirm: "Transfer", cancel: "Cancel" },
                        centered: true,
                        onConfirm: () =>
                          onTransferOwnership(
                            authTeamMember.team_member_id,
                            member.team_member_id
                          ),

                        confirmProps: { color: "red" },
                      })
                    }
                  >
                    Transfer Team Ownership
                  </Menu.Item>
                )}

                <Menu.Item
                  color="red"
                  icon={<IconTrash {...defaultMenuIconProps} />}
                  onClick={() =>
                    openConfirmModal({
                      title: <Text>Remove Team Member</Text>,
                      children: (
                        <Text size={14}>
                          Are you sure you want to remove
                          <Text weight={700} span>
                            &nbsp;
                            {startCase(
                              `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`
                            )}
                            &nbsp;
                          </Text>
                          from this team?
                        </Text>
                      ),
                      labels: { confirm: "Remove", cancel: "Cancel" },
                      centered: true,
                      onConfirm: () => onRemoveFromTeam(member.team_member_id),
                      confirmProps: { color: "red" },
                    })
                  }
                >
                  Remove From Team
                </Menu.Item>
              </>
            )}
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default TeamMemberMenu;
