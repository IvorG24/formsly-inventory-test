// import { getAllNotification, getFormList } from "@/backend/api/get";
// import { useFormActions } from "@/stores/useFormStore";
import {
  useUserAvatar,
  useUserIntials,
  useUserProfile,
} from "@/stores/useUserStore";
import {
  // NOTIFICATION_LIST_LIMIT,
  SIGN_IN_PAGE_PATH,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { getAvatarColor } from "@/utils/styling";
// import { AppType } from "@/utils/types";
import { startCase } from "@/utils/string";
import {
  ActionIcon,
  Avatar,
  Divider,
  Group,
  Menu,
  useMantineColorScheme,
} from "@mantine/core";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconHelpCircle,
  IconLogout,
  IconMoonStars,
  IconSun,
  // IconSwitch2,
  IconUserCircle,
} from "@tabler/icons-react";
import { useRouter } from "next/router";

const HeaderMenu = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();

  const userAvatar = useUserAvatar();
  const userInitials = useUserIntials();
  const user = useUserProfile();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    await router.push(SIGN_IN_PAGE_PATH);
  };

  return (
    <Group spacing={16}>
      {/* {!teamMember && (
        <Menu
          shadow="xs"
          width={300}
          radius={0}
          closeOnItemClick={false}
          position="bottom-end"
        >
          <Menu.Target>
            <Indicator
              disabled={false}
              size="xs"
              color="red"
              label={unreadNotificationCount || ""}
            >
              <ActionIcon p={4}>
                <IconBell />
              </ActionIcon>
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Notification />
          </Menu.Dropdown>
        </Menu>
      )} */}

      <Menu
        shadow="md"
        width={200}
        position="bottom-end"
        withArrow
        withinPortal
      >
        <Menu.Target data-cy="header-account-button">
          <ActionIcon>
            <Avatar
              size={28}
              src={userAvatar}
              color={getAvatarColor(Number(`${user?.user_id.charCodeAt(0)}`))}
            >
              {userInitials}
            </Avatar>
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Account</Menu.Label>
          <Menu.Item
            icon={<IconUserCircle size={14} />}
            data-cy="header-profile-page-button"
            onClick={async () => await router.push("/user/settings")}
          >
            Profile
          </Menu.Item>

          <Menu.Label>Appearance</Menu.Label>
          <Menu.Item
            onClick={() => toggleColorScheme()}
            icon={
              colorScheme === "dark" ? (
                <IconSun size={16} />
              ) : (
                <IconMoonStars size={16} />
              )
            }
          >
            {`${startCase(colorScheme === "dark" ? "light" : "dark")} Mode`}
          </Menu.Item>

          <Menu.Label>Support</Menu.Label>
          <Menu.Item
            icon={<IconHelpCircle size={16} />}
            onClick={async () => await router.push("/help")}
          >
            Help
          </Menu.Item>

          <Divider mt="sm" />
          <Menu.Item
            icon={<IconLogout size={14} />}
            data-cy="header-button-logout"
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};

export default HeaderMenu;
