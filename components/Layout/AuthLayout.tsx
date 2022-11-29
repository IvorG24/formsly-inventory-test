import { Moon, Sun } from "@/components/Icon";
import {
  ActionIcon,
  Container,
  Flex,
  Group,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { ReactNode } from "react";
import { Logo } from "../Icon";
import styles from "./AuthLayout.module.scss";

type Props = {
  children: ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <div
      className={styles.mainContainer}
      style={{
        background: `linear-gradient(90deg, #edf9f1 50%, ${
          colorScheme === "light" ? "#ffffff" : "#1A1B1E"
        } 50%)`,
      }}
    >
      <Group>
        <ActionIcon
          variant="default"
          onClick={() => toggleColorScheme()}
          className={styles.darkModeToggler}
        >
          {colorScheme === "dark" ? <Sun /> : <Moon />}
        </ActionIcon>
      </Group>
      <Container className={styles.container}>
        <Flex wrap="wrap">
          <Flex className={styles.welcome}>
            <Stack w={300}>
              <div className={styles.logo} data-testid="logo">
                <Logo />
              </div>
              <Title order={1} size={50} color="dark.6">
                Welcome to Formsly
              </Title>
              <Text color="gray.7">
                We help businesses automate all their requests and processes
                with their teams
              </Text>
            </Stack>
          </Flex>
          {children}
        </Flex>
      </Container>
    </div>
  );
};

export default AuthLayout;
