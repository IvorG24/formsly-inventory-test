import {
  useNotificationActions,
  useNotificationStore,
  useUnreadNotificationCount,
} from "@/stores/useNotificationStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  Box,
  Burger,
  Header as MantineHeader,
  MediaQuery,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";

import { formatTeamNameToUrlKey } from "@/utils/string";
import Image from "next/image";
import { useRouter } from "next/router";
import { MouseEventHandler, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";

type HeaderProps = {
  openNavbar: boolean;
  setOpenNavbar: MouseEventHandler<HTMLButtonElement>;
};

const Header = ({ openNavbar, setOpenNavbar }: HeaderProps) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const activeTeam = useActiveTeam();

  const { notificationList } = useNotificationStore();
  const unreadNotificationCount = useUnreadNotificationCount();
  const { setNotificationList, setUnreadNotification } =
    useNotificationActions();

  useEffect(() => {
    setNotificationList(notificationList);
    setUnreadNotification(unreadNotificationCount);
  }, [notificationList, unreadNotificationCount]);

  return (
    <MantineHeader height={{ base: 50, md: 70 }} p="md">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <MediaQuery largerThan="sm" styles={{ display: "none" }}>
          <Burger
            opened={openNavbar}
            onClick={setOpenNavbar}
            size="sm"
            color={theme.colors.gray[6]}
            mr="xl"
          />
        </MediaQuery>

        <UnstyledButton
          onClick={async () =>
            await router.push(
              `/${formatTeamNameToUrlKey(activeTeam.team_name)}/dashboard`
            )
          }
        >
          <Image
            src={`/logo-request-${theme.colorScheme.toLowerCase()}.svg`}
            width={127}
            height={45}
            alt="Formsly Logo"
          />
        </UnstyledButton>

        <HeaderMenu />
      </Box>
    </MantineHeader>
  );
};

export default Header;
