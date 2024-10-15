import { useActiveTeam, useTeamList } from "@/stores/useTeamStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  Accordion,
  Button,
  Group,
  Navbar as MantineNavbar,
  NavLink,
  Stack,
} from "@mantine/core";
import {
  IconBriefcaseOff,
  IconBuilding,
  IconCategory,
  IconCategory2,
  IconChevronDown,
  IconCirclePlus,
  IconDatabase,
  IconGps,
  IconListDetails,
  IconLocation,
  IconPuzzle,
  IconSettings,
  IconUserCancel,
  IconUserPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import SelectTeam from "./SelectTeam";

const Navbar = () => {
  const teamList = useTeamList();
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const formattedTeamName = formatTeamNameToUrlKey(activeTeam.team_name ?? "");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navlinkData = [
    {
      id: "asset",
      icon: IconListDetails,
      label: "Asset",
      subLinks: [
        {
          id: "asset-list",
          label: "Asset List",
          icon: IconPuzzle,
          href: `/${formattedTeamName}/inventory`,
        },
        {
          id: "check-in",
          label: "Check In",
          icon: IconUserPlus,
          href: `/${formattedTeamName}/inventory/check-in`,
        },
        {
          id: "check-out",
          label: "Check Out",
          icon: IconUserCancel,
          href: `/${formattedTeamName}/inventory/check-out`,
        },
      ],
    },
    {
      id: "advanced",
      icon: IconBriefcaseOff,
      label: "Advanced",
      subLinks: [
        // {
        //   id: "customers",
        //   label: "Customer",
        //   icon: IconPuzzle,
        //   href: `/${formattedTeamName}/inventory/customer`,
        // },
        // {
        //   id: "users",
        //   label: "Users",
        //   icon: IconUserPlus,
        //   href: `/${formattedTeamName}/inventory/users`,
        // },
        {
          id: "security-groups",
          label: "Security Group",
          icon: IconUserCancel,
          href: `/${formattedTeamName}/inventory/security-groups`,
        },
      ],
    },
    {
      id: "setup",
      icon: IconSettings,
      label: "Setup",
      subLinks: [
        // {
        //   id: "team-info",
        //   label: "Team info",
        //   icon: IconBriefcase,
        //   href: `/${formattedTeamName}/inventory/setup/team-info`,
        // },
        {
          id: "sites",
          label: "Sites",
          icon: IconGps,
          href: `/${formattedTeamName}/inventory/setup/sites`,
        },
        {
          id: "locations",
          label: "Locations",
          icon: IconLocation,
          href: `/${formattedTeamName}/inventory/setup/location`,
        },
        {
          id: "categories",
          label: "Categories",
          icon: IconCategory,
          href: `/${formattedTeamName}/inventory/setup/categories`,
        },
        {
          id: "sub-categories",
          label: "Sub Categories",
          icon: IconCategory2,
          href: `/${formattedTeamName}/inventory/setup/sub-categories`,
        },
        {
          id: "departments",
          label: "Departments",
          icon: IconBuilding,
          href: `/${formattedTeamName}/inventory/setup/department`,
        },
        {
          id: "databases",
          label: "Databases",
          icon: IconDatabase,
        },
        // {
        //   id: "manage-forms",
        //   label: "Manage Forms",
        //   icon: IconEditCircle,
        // },
      ],
    },
  ];

  const handleNavlinkClick = (href: string) => {
    router.push(href);
  };

  const renderNavlinkData = navlinkData.map((link) => {
    if (link.subLinks) {
      return (
        <Accordion.Item
          style={{ width: "100%" }}
          sx={(theme) => ({
            "&:hover": {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[5]
                  : theme.colors.blue[0],
            },
            "&[data-active]": {
              backgroundColor: "transparent",
            },
          })}
          key={link.id}
          value={link.id}
        >
          <Accordion.Control
            icon={<link.icon fontWeight={100} size={20} />}
            style={{
              fontSize: ".9rem",
              justifyContent: isCollapsed ? "flex-end" : "flex-start",
            }}
            styles={(theme) => ({
              control: {
                color:
                  theme.colorScheme === "dark"
                    ? theme.colors.gray[0]
                    : theme.colors.dark[7],
                "&:hover": {
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.colors.gray[0],
                },
                padding: isCollapsed ? "10px 0" : "10px 16px",
              },
              label: {
                marginLeft: isCollapsed ? 0 : "12px",
                display: isCollapsed ? "none" : "block",
              },
            })}
          >
            {link.label}
          </Accordion.Control>
          <Accordion.Panel>
            <Stack spacing={4} pl={4}>
              {link.subLinks.map((subLink) => (
                <NavLink
                  key={subLink.id}
                  label={subLink.label}
                  onClick={() => handleNavlinkClick(subLink.href || "")}
                  icon={<subLink.icon size={20} />}
                  // Removed 'link' prop as it does not exist on NavLink
                  styles={(theme) => ({
                    root: {
                      color:
                        theme.colorScheme === "dark"
                          ? theme.colors.gray[0]
                          : theme.colors.blue[6],
                      "&:hover": {
                        backgroundColor:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[5]
                            : theme.colors.blue[1],
                      },
                    },
                  })}
                />
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      );
    }
  });

  return (
    <MantineNavbar
      width={{ base: isCollapsed ? 80 : 280 }}
      styles={(theme) => ({
        root: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[1],
          transition: "width 0.3s ease",
        },
      })}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <Stack p={16} spacing={12}>
        {teamList.length > 0 ? (
          <Group>
            <SelectTeam isCollapsed={isCollapsed} />
          </Group>
        ) : null}
        <Group>
          <Button
            ml={4}
            onClick={() => {
              router.push(
                `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory-form/656a3009-7127-4960-9738-92afc42779a6/create`
              );
            }}
            leftIcon={<IconCirclePlus size={26} />}
            variant="subtle"
          >
            {isCollapsed ? null : "Add Asset"}
          </Button>
        </Group>
        <Accordion
          chevron={isCollapsed ? null : <IconChevronDown size={14} />}
          value={isCollapsed ? null : undefined}
          variant="filled"
        >
          <Group spacing={10}>{renderNavlinkData}</Group>
        </Accordion>
      </Stack>
    </MantineNavbar>
  );
};

export default Navbar;
