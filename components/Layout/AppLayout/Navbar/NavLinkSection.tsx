import {
  Accordion,
  Badge,
  Box,
  Group,
  NavLink,
  NavLinkProps,
  Stack,
  Text,
} from "@mantine/core";
import { useRouter } from "next/router";
import { ReactNode } from "react";

export type NavLinkType = {
  label: string;
  icon?: ReactNode;
  href: string;
  withIndicator?: boolean;
  indicatorLabel?: string;
};

type NavLinkSectionProps = {
  label?: string;
  links: NavLinkType[];
} & NavLinkProps;

const NavLinkSection = ({
  label,
  links,
  rightSection,
  ...props
}: NavLinkSectionProps) => {
  const router = useRouter();

  return (
    <Box h="fit-content">
      <Accordion variant="separated">
        <Accordion.Item value="dynamicItem">
          <Accordion.Control>
            <Text mb={4} size="sm" weight={400}>
              {label}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack spacing={0}>
              {links.map((link, idx) => (
                <NavLink
                  key={`navLink-${idx}`}
                  label={
                    link.withIndicator ? (
                      <Group>
                        <Text>{link.label}</Text>
                        <Badge
                          px={6}
                          w="fit-content"
                          color="red"
                          variant="filled"
                          radius="xl"
                          sx={{ fontSize: "14px", fontWeight: 400 }}
                        >
                          {link.indicatorLabel}
                        </Badge>
                      </Group>
                    ) : (
                      link.label
                    )
                  }
                  style={{ borderRadius: 5 }}
                  icon={link.icon ? link.icon : null}
                  px="xl"
                  active={
                    link.label === "Manage Automation"
                      ? router.pathname.includes("jira") &&
                        router.pathname.includes("settings")
                      : link.label === "Manage Team"
                      ? router.pathname.includes("settings") &&
                        !router.pathname.includes("jira")
                      : link.label === "Application List"
                      ? router.pathname.includes("request") &&
                        !router.pathname.includes("application")
                      : router.pathname.includes(
                          link.label.split(" ")[0].toLowerCase()
                        )
                  }
                  onClick={async () => await router.push(link.href)}
                  rightSection={rightSection ? rightSection : <></>}
                  {...props}
                />
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
};

export default NavLinkSection;
