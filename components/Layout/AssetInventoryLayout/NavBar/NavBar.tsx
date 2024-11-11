import { useEventList } from "@/stores/useEventStore";
import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
import { useActiveTeam, useTeamList } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  Accordion,
  Badge,
  Box,
  Button,
  Group,
  Navbar as MantineNavbar,
  Menu,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBrandSuperhuman,
  IconBriefcaseOff,
  IconBuilding,
  IconCategory,
  IconCategory2,
  IconChevronDown,
  IconCirclePlus,
  IconDatabase,
  IconDots,
  IconFileImport,
  IconFileReport,
  IconGps,
  IconListDetails,
  IconLocation,
  IconPaperclip,
  IconPuzzle,
  IconReport,
  IconReportSearch,
  IconSettings,
  IconSettingsUp,
  IconTableColumn,
  IconTableOptions,
  IconTimelineEvent,
  IconTooltip,
  IconUserCancel,
  IconUserCode,
  TablerIconsProps,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Dispatch, useState } from "react";
import Navlink from "./NavLink";
import SelectTeam from "./SelectTeam";
type NavLink = {
  id: string;
  label: string;
  icon: (props: TablerIconsProps) => JSX.Element;
  href?: string;
  withIndicator?: boolean;
  subLinks?: NavLink[];
  nestedSubLinks?: NavLink[];
  isEvent?: boolean;
};
type Props = {
  openNavbar: boolean;
  setOpenNavbar: Dispatch<boolean>;
  indicatorCount: { assignedAsset: number };
};
const Navbar = ({ openNavbar, setOpenNavbar, indicatorCount }: Props) => {
  const teamList = useTeamList();
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const eventList = useEventList();
  const securityGroup = useSecurityGroup();

  const theme = useMantineTheme();
  const formattedTeamName = formatTeamNameToUrlKey(activeTeam.team_name ?? "");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(
    teamMember?.team_member_role ?? ""
  );

  const canAddAsset =
    securityGroup?.asset?.permissions.find(
      (permission) => permission.key === "addAssets"
    )?.value ?? false;

  const canView =
    securityGroup?.asset?.permissions.find(
      (permission) => permission.key === "viewOnly"
    )?.value ?? false;

  const canViewSetupSection = (id: keyof typeof securityGroup.privileges) => {
    return securityGroup.privileges[id]?.view ?? [];
  };

  const nonCustomEvents = securityGroup.asset.filter.event
    .filter((event) =>
      ["check in", "check out", "lease", "lease return", "dispose"].includes(
        event.toLowerCase()
      )
    )
    .map((event) => ({
      id: event,
      label: event.charAt(0).toUpperCase() + event.slice(1),
      icon: IconTimelineEvent,
      href: `/${formattedTeamName}/inventory/list/${
        event.charAt(0).toLowerCase() +
        event.slice(1).replace(/ /g, "-").toLowerCase()
      }`,
    }));

  const customEvents = eventList
    .filter((event) => event.event_is_custom_event)
    .map((customEvent) => ({
      id: customEvent.event_name.toLowerCase().replace(/ /g, "-"),
      label:
        customEvent.event_name.charAt(0).toUpperCase() +
        customEvent.event_name.slice(1),
      icon: IconTimelineEvent,
      href: `/${formattedTeamName}/inventory/list/${customEvent.event_name
        .toLowerCase()
        .replace(/ /g, "-")}`,
    }));

  const subLinks = [...nonCustomEvents, ...customEvents];

  const dynamicEventReportSubLinks: NavLink[] = eventList.map((event) => {
    const eventName = event.event_name.toLowerCase().replace(/ /g, "-");
    const baseHref = `/${formattedTeamName}/inventory/reports/${eventName}`;

    const nestedSubLinks: NavLink[] = [
      {
        id: `${eventName}-by-tag-id`,
        label: "By Tag ID",
        icon: IconDots,
        href: `${baseHref}/byTagId`,
      },
      event.has_site && {
        id: `${eventName}-by-site`,
        label: "By Site",
        icon: IconDots,
        href: `${baseHref}/bySite`,
      },
      event.has_assigned_to && {
        id: `${eventName}-by-person`,
        label: "By Person",
        icon: IconDots,
        href: `${baseHref}/byPerson`,
      },
      event.has_customer && {
        id: `${eventName}-by-customer`,
        label: "By Customer",
        icon: IconDots,
        href: `${baseHref}/byCustomer`,
      },
    ].filter(Boolean) as NavLink[];

    return {
      id: `event-${eventName}`,
      label: event.event_name,
      icon: IconReportSearch,
      nestedSubLinks,
      isEvent: true,
    };
  });

  const navlinkData: NavLink[] = [
    {
      id: "assigned-asset",
      icon: IconBrandSuperhuman,
      label: "Assigned Asset",
      withIndicator: Boolean(indicatorCount.assignedAsset),
      href: `/${formattedTeamName}/inventory/assigned-asset`,
    },
    ...(canView
      ? [
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
              ...subLinks,
            ],
          },
        ]
      : []),
    {
      id: "list",
      icon: IconTableColumn,
      label: "List",
      subLinks: [
        {
          id: "maintenance",
          label: "Maintenance",
          icon: IconTooltip,
          href: `/${formattedTeamName}/inventory/list/maintenance`,
        },
        {
          id: "warranty",
          label: "Warranty",
          icon: IconPaperclip,
          href: `/${formattedTeamName}/inventory/list/warranty`,
        },
      ],
    },
    {
      id: "report",
      icon: IconReport,
      label: "Report",
      subLinks: [
        ...(isOwnerOrAdmin
          ? [
              {
                id: "asset-report",
                label: "Assets Reports",
                icon: IconFileReport,
                href: `/${formattedTeamName}/inventory/reports/assets`,
              },
              ...dynamicEventReportSubLinks,
            ]
          : []),
      ],
    },
    {
      id: "advanced",
      icon: IconBriefcaseOff,
      label: "Advanced",
      subLinks: [
        ...(canViewSetupSection("employee")
          ? [
              {
                id: "employee",
                label: "List of Employee",
                icon: IconUserCode,
                href: `/${formattedTeamName}/inventory/employee`,
              },
            ]
          : []),
        ...(canViewSetupSection("customer")
          ? [
              {
                id: "customer",
                label: "List of Customer",
                icon: IconUserCode,
                href: `/${formattedTeamName}/inventory/customer`,
              },
            ]
          : []),

        ...(isOwnerOrAdmin
          ? [
              {
                id: "security-groups",
                label: "Security Group",
                icon: IconUserCancel,
                href: `/${formattedTeamName}/inventory/security-groups`,
              },
            ]
          : []),
      ],
    },
    {
      id: "setup",
      icon: IconSettings,
      label: "Setup",
      subLinks: [
        ...(canViewSetupSection("site")
          ? [
              {
                id: "site",
                label: "Sites",
                icon: IconGps,
                href: `/${formattedTeamName}/inventory/setup/sites`,
              },
            ]
          : []),
        ...(canViewSetupSection("location")
          ? [
              {
                id: "location",
                label: "Locations",
                icon: IconLocation,
                href: `/${formattedTeamName}/inventory/setup/location`,
              },
            ]
          : []),
        ...(canViewSetupSection("category")
          ? [
              {
                id: "category",
                label: "Categories",
                icon: IconCategory,
                href: `/${formattedTeamName}/inventory/setup/categories`,
              },
            ]
          : []),
        ...(canViewSetupSection("subCategory")
          ? [
              {
                id: "subCategory",
                label: "Sub Categories",
                icon: IconCategory2,
                href: `/${formattedTeamName}/inventory/setup/sub-categories`,
              },
            ]
          : []),
        ...(canViewSetupSection("department")
          ? [
              {
                id: "department",
                label: "Departments",
                icon: IconBuilding,
                href: `/${formattedTeamName}/inventory/setup/department`,
              },
            ]
          : []),
        {
          id: "databases",
          label: "Databases",
          icon: IconDatabase,
          nestedSubLinks: [
            {
              id: "assetCustomField",
              label: "Asset Setup",
              icon: IconSettingsUp,
              href: `/${formattedTeamName}/inventory/setup/asset-setup`,
            },
            {
              id: "employeeCustomField",
              label: "Employee Setup",
              icon: IconSettingsUp,
              href: `/${formattedTeamName}/inventory/setup/employee-setup`,
            },
            {
              id: "customerCustomField",
              label: "Customer Setup",
              icon: IconSettingsUp,
              href: `/${formattedTeamName}/inventory/setup/customer-setup`,
            },
            {
              id: "mentenanceCustomField",
              label: "Maintenance Setup",
              icon: IconSettingsUp,
              href: `/${formattedTeamName}/inventory/setup/maintenance-setup`,
            },
            {
              id: "warrantyCustomField",
              label: "Warranty Setup",
              icon: IconSettingsUp,
              href: `/${formattedTeamName}/inventory/setup/warranty-setup`,
            },
          ],
        },
        ...(isOwnerOrAdmin
          ? [
              {
                id: "events",
                label: "Events",
                icon: IconCategory2,
                href: `/${formattedTeamName}/inventory/events`,
              },
            ]
          : []),
      ],
    },
    ...(isOwnerOrAdmin
      ? [
          {
            id: "others",
            icon: IconTableOptions,
            label: "Others",
            subLinks: [
              {
                id: "import",
                label: "Import",
                icon: IconFileImport,
                href: `/${formattedTeamName}/inventory/others/import`,
              },
            ],
          },
        ]
      : []),
  ];

  const handleNavlinkClick = (href: string) => {
    if (isSmallScreen) {
      setOpenNavbar(false);
    }

    router.push(href);
  };

  const renderNavlinkData = navlinkData.map((link) => {
    if (!link.subLinks) {
      return (
        <Navlink
          key={link.id}
          label={link.label}
          onClick={() => handleNavlinkClick(link.href || "")}
          icon={<link.icon size={20} />}
          link={link.href}
          type="link"
          indicator={
            link.withIndicator ? (
              <Group>
                <Badge color="orange" variant="filled" radius="xl" size="md">
                  {indicatorCount.assignedAsset}
                </Badge>
              </Group>
            ) : null
          }
        />
      );
    }

    if (link) {
      return (
        <Accordion.Item
          sx={(theme) => ({
            width: "100%",
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
          <Accordion.Control icon={<link.icon size={20} />}>
            <Text fw={500} size="sm">
              {link.label}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack spacing={4}>
              {link.subLinks?.map((subLink) => {
                if (subLink && "id" in subLink && subLink.id === "databases") {
                  return (
                    <Box ml={10} key={subLink.id}>
                      <Menu
                        withinPortal
                        position={
                          isSmallScreen ? "bottom-start" : "right-start"
                        }
                      >
                        <Menu.Target>
                          <Button
                            variant="subtle"
                            leftIcon={<subLink.icon size={20} />}
                            fw={400}
                            fullWidth
                            mih={50}
                            mah={50}
                            styles={(theme) => ({
                              root: {
                                color:
                                  theme.colorScheme === "dark"
                                    ? theme.colors.gray[0]
                                    : theme.colors.dark[7],
                              },
                              inner: {
                                justifyContent: "flex-start",
                              },
                            })}
                          >
                            {subLink.label}
                          </Button>
                        </Menu.Target>
                        {!isCollapsed && (
                          <Menu.Dropdown>
                            <Menu.Label>Database Actions</Menu.Label>
                            {subLink.nestedSubLinks?.map(
                              (nestedSubLink) =>
                                nestedSubLink && (
                                  <Menu.Item
                                    key={nestedSubLink.id}
                                    onClick={() =>
                                      handleNavlinkClick(
                                        nestedSubLink.href || ""
                                      )
                                    }
                                  >
                                    {nestedSubLink.label}
                                  </Menu.Item>
                                )
                            )}
                          </Menu.Dropdown>
                        )}
                      </Menu>
                    </Box>
                  );
                }

                if (subLink && "id" in subLink && subLink.isEvent) {
                  return (
                    <Accordion key={subLink.id} variant="filled">
                      <Accordion.Item
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
                        value={subLink.id}
                      >
                        <Accordion.Control
                          icon={
                            <subLink.icon
                              color={
                                theme.colorScheme === "dark" ? "white" : "black"
                              }
                              size={20}
                            />
                          }
                        >
                          <Text
                            fw={400}
                            color={
                              theme.colorScheme === "dark" ? "white" : "dark.7"
                            }
                            size="sm"
                          >
                            {subLink.label}
                          </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                          {subLink.nestedSubLinks?.map(
                            (nestedSubLink) =>
                              nestedSubLink && (
                                <Navlink
                                  key={nestedSubLink.id}
                                  label={nestedSubLink.label}
                                  onClick={() =>
                                    handleNavlinkClick(nestedSubLink.href || "")
                                  }
                                  icon={<nestedSubLink.icon size={20} />}
                                  link={nestedSubLink.href || ""}
                                />
                              )
                          )}
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  );
                }
                if (subLink && "id" in subLink) {
                  return (
                    <Navlink
                      key={subLink.id}
                      label={subLink.label}
                      onClick={() => handleNavlinkClick(subLink.href || "")}
                      icon={<subLink.icon size={20} />}
                      link={subLink.href || ""}
                    />
                  );
                }
              })}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      );
    }
    return null;
  });

  if (isSmallScreen && !openNavbar) {
    return null;
  }

  return (
    <MantineNavbar
      width={{ base: isSmallScreen ? "100%" : isCollapsed ? 80 : 280 }}
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
      //   onMouseLeave={() =>
      //     isSmallScreen ? setIsCollapsed(false) : setIsCollapsed(true)
      //   }
    >
      <ScrollArea scrollbarSize={10}>
        <Stack p={16} spacing={12}>
          {teamList.length > 0 ? (
            <SelectTeam isCollapsed={isCollapsed} />
          ) : null}
          <Group>
            {canAddAsset && (
              <Button
                variant="subtle"
                onClick={() => {
                  router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name
                    )}/inventory-form/656a3009-7127-4960-9738-92afc42779a6/create`
                  );
                  if (isSmallScreen) {
                    setOpenNavbar(false);
                  }
                }}
                leftIcon={<IconCirclePlus size={26} />}
                fw={400}
                ml={4}
                fullWidth
                mih={50}
                mah={50}
                styles={(theme) => ({
                  root: {
                    "&:hover": {
                      backgroundColor:
                        theme.colorScheme === "dark"
                          ? theme.colors.dark[5]
                          : theme.colors.blue[0],
                      color:
                        theme.colorScheme === "dark"
                          ? theme.colors.blue[2]
                          : theme.colors.blue[7],
                    },
                    "&[data-active]": {
                      backgroundColor: "transparent",
                      color:
                        theme.colorScheme === "dark"
                          ? theme.colors.gray[5]
                          : theme.colors.blue[7],
                    },
                    fontFamily: theme.fontFamily,
                    fontWeight: 100, // Adjust to match the Navlink font weight
                    fontSize: theme.fontSizes.sm,
                  },
                  inner: {
                    justifyContent: "flex-start",
                  },
                })}
              >
                {isCollapsed ? null : "Add Asset"}
              </Button>
            )}
          </Group>
          <Accordion
            fw={400}
            chevron={isCollapsed ? null : <IconChevronDown size={14} />}
            value={isCollapsed ? null : undefined}
            variant="filled"
          >
            <Group spacing={10}>{renderNavlinkData}</Group>
          </Accordion>
        </Stack>
      </ScrollArea>
    </MantineNavbar>
  );
};

export default Navbar;
