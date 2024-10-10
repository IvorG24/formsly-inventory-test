import {
  getApproverRequestCount,
  getHRIndicatorCount,
} from "@/backend/api/get";
import { useFormList } from "@/stores/useFormStore";
import { useUnreadNotificationCount } from "@/stores/useNotificationStore";
import { useActiveTeam, useTeamList } from "@/stores/useTeamStore";
import {
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import { REQUEST_LIST_HIDDEN_FORMS } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isEmpty } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { FormTableRow, TeamMemberTableRow } from "@/utils/types";
import {
  Box,
  Button,
  Divider,
  Menu,
  Portal,
  Space,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconBell,
  IconBriefcase,
  IconCode,
  IconDashboard,
  IconFile,
  IconFileCertificate,
  IconFileDescription,
  IconFilePlus,
  IconFileReport,
  IconFileStack,
  IconFileText,
  IconFiles,
  IconInfoCircle,
  IconListDetails,
  IconPhoneCall,
  IconQuestionMark,
  IconReportAnalytics,
  IconSettingsAutomation,
  IconShieldCheck,
  IconTerminal,
  IconTicket,
  IconTools,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavLinkSection from "./NavLinkSection";

type HRIndicatorCountType = {
  applicationInformation: number;
  hrPhoneInterview: number;
  tradeTest: number;
  technicalInterview1: number;
  technicalInterview2: number;
  directorInterview: number;
  backgroundCheck: number;
  jobOffer: number;
};

const ReviewAppNavLink = () => {
  const defaultIconProps = { size: 20, stroke: 1 };
  const defaultNavLinkProps = { px: 0 };
  const defaultNavLinkContainerProps = { py: 5, mt: 3 };

  const [userNotificationCount, setUserNotificationCount] = useState(0);
  const [hrIndicatorCount, setHrIndicatorCount] = useState({
    applicationInformation: 0,
    hrPhoneInterview: 0,
    tradeTest: 0,
    technicalInterview1: 0,
    technicalInterview2: 0,
    directorInterview: 0,
    backgroundCheck: 0,
    jobOffer: 0,
  });

  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const teamList = useTeamList();
  const hasTeam = teamList.length > 0;
  const forms = useFormList();
  const userTeamMemberData = useUserTeamMember();
  const unreadNotificationCount = useUnreadNotificationCount();
  const activeTeamNameToUrl = formatTeamNameToUrlKey(
    activeTeam.team_name ?? ""
  );
  const teamMemberGroup = useUserTeamMemberGroupList();
  const teamMemberGroups = useUserTeamMemberGroupList();

  const router = useRouter();
  const unhiddenForms = forms.filter(
    (form) => !REQUEST_LIST_HIDDEN_FORMS.includes(form.form_name)
  );
  const createRequestFormList = forms.filter(
    (form) =>
      ![
        ...REQUEST_LIST_HIDDEN_FORMS,
        "Petty Cash Voucher Balance",
        "Request For Payment Code",
        "Bill of Quantity",
      ].includes(form.form_name) && !form.form_is_public_form
  );

  const itemForm = forms.filter(
    (form) => form.form_is_formsly_form && form.form_name === "Item"
  )[0] as unknown as FormTableRow & {
    form_team_group: string[];
  };

  const analyticsMenuOptions = ["Human Resources"];

  const handleRedirectToAnalyticsPage = (option: string) => {
    const url = `/${activeTeamNameToUrl}/analytics/${formatTeamNameToUrlKey(
      option
    )}`;
    switch (option) {
      case "Human Resources":
        const isUserAllowed =
          teamMemberGroups.includes("HUMAN RESOURCES") ||
          teamMemberGroups.includes("HUMAN RESOURCES VIEWER");
        if (!isUserAllowed) {
          notifications.show({
            message: "You do not have permission to access this page.",
            color: "red",
          });
          return;
        }
        break;

      default:
        break;
    }

    router.push(url);
  };

  const renderCreateRequestMenu = () => {
    return (
      <Box h="fit-content" mt="md">
        <Text size="xs" weight={400}>
          Create
        </Text>
        <Menu
          shadow="1px 1px 3px rgba(0, 0, 0, .25)"
          withArrow
          position="right"
        >
          <Stack align="start" {...defaultNavLinkContainerProps}>
            <Menu.Target>
              <Button
                fw={400}
                leftIcon={<IconFile {...defaultIconProps} />}
                variant="transparent"
              >
                Create Request
              </Button>
            </Menu.Target>
            <Button
              fw={400}
              leftIcon={<IconTicket {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/tickets/create`)
              }
            >
              Create Ticket
            </Button>
            <Button
              fw={400}
              leftIcon={<IconFileDescription {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/memo/create`)
              }
            >
              Create Memo
            </Button>
          </Stack>

          <Portal>
            <Menu.Dropdown>
              {createRequestFormList
                .sort((a, b) => a.form_name.localeCompare(b.form_name))
                .map((form) => (
                  <Menu.Item
                    key={form.form_id}
                    onClick={async () =>
                      await router.push(
                        `/${activeTeamNameToUrl}/forms/${form.form_id}/create`
                      )
                    }
                  >
                    {form.form_name}
                  </Menu.Item>
                ))}
            </Menu.Dropdown>
          </Portal>
        </Menu>
      </Box>
    );
  };

  const renderManageFormMenu = () => {
    return (
      <Box h="fit-content">
        <Menu
          shadow="1px 1px 3px rgba(0, 0, 0, .25)"
          withArrow
          position="right"
        >
          <Stack align="start" {...defaultNavLinkContainerProps}>
            <Menu.Target>
              <Button
                fw={400}
                leftIcon={<IconFileText {...defaultIconProps} />}
                variant="transparent"
              >
                Manage Form{unhiddenForms.length > 1 ? "s" : ""} ({forms.length}
                )
              </Button>
            </Menu.Target>
            <Button
              fw={400}
              leftIcon={<IconFilePlus {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/forms/build`)
              }
            >
              Build Form
            </Button>
          </Stack>

          <Portal>
            <Menu.Dropdown>
              <Menu.Item
                key={"all-form"}
                onClick={async () =>
                  await router.push(`/${activeTeamNameToUrl}/forms/`)
                }
                c="blue"
              >
                View All
              </Menu.Item>
              <Divider />
              {unhiddenForms
                .sort((a, b) => a.form_name.localeCompare(b.form_name))
                .map((form) => (
                  <Menu.Item
                    key={form.form_id}
                    onClick={async () =>
                      await router.push(
                        `/${activeTeamNameToUrl}/forms/${form.form_id}`
                      )
                    }
                  >
                    {form.form_name}
                  </Menu.Item>
                ))}
            </Menu.Dropdown>
          </Portal>
        </Menu>
      </Box>
    );
  };

  const renderMetricsMenu = () => {
    return (
      <Box h="fit-content" mt="md">
        <Text size="xs" weight={400}>
          Metrics
        </Text>
        <Menu
          shadow="1px 1px 3px rgba(0, 0, 0, .25)"
          withArrow
          position="right"
        >
          <Stack align="start" {...defaultNavLinkContainerProps}>
            <Button
              fw={400}
              leftIcon={<IconDashboard {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/dashboard`)
              }
            >
              Dashboard
            </Button>
            <Menu.Target>
              <Button
                fw={400}
                leftIcon={<IconTicket {...defaultIconProps} />}
                variant="transparent"
              >
                Analytics
              </Button>
            </Menu.Target>
            <Button
              fw={400}
              leftIcon={<IconFileReport {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/sla`)
              }
            >
              SLA
            </Button>
            <Button
              fw={400}
              leftIcon={<IconReportAnalytics {...defaultIconProps} />}
              variant="transparent"
              onClick={async () =>
                await router.push(`/${activeTeamNameToUrl}/report`)
              }
            >
              Report
            </Button>
          </Stack>

          <Portal>
            <Menu.Dropdown>
              {analyticsMenuOptions.map((option, index) => (
                <Menu.Item
                  key={index}
                  onClick={() => handleRedirectToAnalyticsPage(option)}
                >
                  {option}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Portal>
        </Menu>
      </Box>
    );
  };

  const createSection = [
    {
      label: "Create Request",
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconFile {...defaultIconProps} />
        </Box>
      ),
      href: itemForm
        ? `/${activeTeamNameToUrl}/forms/${itemForm.form_id}/create`
        : "",
    },
    {
      label: "Create Ticket",
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconTicket {...defaultIconProps} />
        </Box>
      ),
      href: itemForm ? `/${activeTeamNameToUrl}/tickets/create` : "",
    },
    {
      label: "Create Memo",
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconFileDescription {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/memo/create`,
    },
  ];

  const listSection = [
    {
      label: `Request List`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconFiles {...defaultIconProps} />
        </Box>
      ),
      href: activeTeam.team_id
        ? `/${activeTeamNameToUrl}/requests`
        : `/user/requests`,
    },
    {
      label: `Notification List`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconBell {...defaultIconProps} />
        </Box>
      ),
      href: `/user/notification`,
      withIndicator: userNotificationCount > 0,
      indicatorLabel: `${userNotificationCount}`,
    },
    {
      label: `Ticket List`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconListDetails {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/tickets`,
    },
    {
      label: `Memo List`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconFileStack {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/memo`,
    },
  ];

  const teamSectionWithManageTeam = [
    {
      label: "Manage Team",
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconUsersGroup {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/settings`,
    },
    // {
    //   label: "Create Team",
    //   icon: (
    //     <Box ml="sm" {...defaultNavLinkContainerProps}>
    //       <IconCirclePlus {...defaultIconProps} />
    //     </Box>
    //   ),
    //   href: `/create-team`,
    // },
  ];

  const hrSection = [
    {
      label: `Application Information`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconInfoCircle {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/application-information-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.applicationInformation),
      indicatorLabel: `${hrIndicatorCount.applicationInformation}`,
    },
    {
      label: `HR Interview`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconPhoneCall {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/hr-phone-interview-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.hrPhoneInterview),
      indicatorLabel: `${hrIndicatorCount.hrPhoneInterview}`,
    },
    {
      label: `Practical Test`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconTools {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/trade-test-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.tradeTest),
      indicatorLabel: `${hrIndicatorCount.tradeTest}`,
    },
    {
      label: `Department Interview`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconCode {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/technical-interview-1-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.technicalInterview1),
      indicatorLabel: `${hrIndicatorCount.technicalInterview1}`,
    },
    {
      label: `Requestor Interview`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconTerminal {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/technical-interview-2-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.technicalInterview2),
      indicatorLabel: `${hrIndicatorCount.technicalInterview2}`,
    },
    {
      label: `Director Interview`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconBriefcase {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/director-interview-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.directorInterview),
      indicatorLabel: `${hrIndicatorCount.directorInterview}`,
    },
    {
      label: `Background Check`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconShieldCheck {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/background-check-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.backgroundCheck),
      indicatorLabel: `${hrIndicatorCount.backgroundCheck}`,
    },
    {
      label: `Job Offer`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconFileCertificate {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/requests/job-offer-spreadsheet-view`,
      withIndicator: Boolean(hrIndicatorCount.jobOffer),
      indicatorLabel: `${hrIndicatorCount.jobOffer}`,
    },
    {
      label: `Questionnaire List`,
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconQuestionMark {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/technical-question`,
    },
  ];

  // const teamSection = [
  //   {
  //     label: "Create Team",
  //     icon: (
  //       <Box ml="sm" {...defaultNavLinkContainerProps}>
  //         <IconCirclePlus {...defaultIconProps} />
  //       </Box>
  //     ),
  //     href: `/create-team`,
  //   },
  // ];

  const jiraSection = [
    {
      label: "Manage Automation",
      icon: (
        <Box ml="sm" {...defaultNavLinkContainerProps}>
          <IconSettingsAutomation {...defaultIconProps} />
        </Box>
      ),
      href: `/${activeTeamNameToUrl}/jira/settings`,
    },
  ];

  useEffect(() => {
    const fetchApproverRequestCount = async (
      userTeamMemberData: TeamMemberTableRow
    ) => {
      const pendingRequestCount = await getApproverRequestCount(
        supabaseClient,
        {
          teamMemberId: userTeamMemberData.team_member_id,
          status: "PENDING",
        }
      );

      setUserNotificationCount(pendingRequestCount + unreadNotificationCount);
    };
    const fetchHrIndicatorCount = async (
      userTeamMemberData: TeamMemberTableRow
    ) => {
      const count = await getHRIndicatorCount(supabaseClient, {
        teamMemberId: userTeamMemberData.team_member_id,
      });

      setHrIndicatorCount(count as HRIndicatorCountType);
    };
    if (userTeamMemberData) {
      if (userTeamMemberData.team_member_role === "APPROVER") {
        fetchApproverRequestCount(userTeamMemberData);
      }
      if (teamMemberGroup.includes("HUMAN RESOURCES")) {
        fetchHrIndicatorCount(userTeamMemberData);
      }
    }
  }, [supabaseClient, unreadNotificationCount, userTeamMemberData]);

  return (
    <>
      {!isEmpty(activeTeam) && hasTeam
        ? // <NavLinkSection
          //   label={"Metrics"}
          //   links={metricsSection}
          //   {...defaultNavLinkProps}
          // />
          renderMetricsMenu()
        : null}

      {!isEmpty(activeTeam) &&
        hasTeam &&
        (teamMemberGroup.includes("HUMAN RESOURCES") ||
          teamMemberGroup.includes("HUMAN RESOURCES VIEWER")) && (
          <NavLinkSection
            label={"Human Resources"}
            links={hrSection}
            {...defaultNavLinkProps}
          />
        )}

      {itemForm &&
      itemForm.form_is_hidden === false &&
      itemForm.form_team_group.length &&
      hasTeam ? (
        unhiddenForms.length > 1 ? (
          renderCreateRequestMenu()
        ) : (
          <NavLinkSection
            label="Create"
            links={createSection}
            {...defaultNavLinkProps}
          />
        )
      ) : null}

      {!isEmpty(activeTeam) && hasTeam ? (
        <NavLinkSection
          label={"List"}
          links={listSection}
          {...defaultNavLinkProps}
        />
      ) : (
        <NavLinkSection
          label={"List"}
          links={listSection.slice(0, 2)}
          {...defaultNavLinkProps}
        />
      )}

      {!isEmpty(activeTeam) && hasTeam && (
        <NavLinkSection
          label={"Team"}
          links={teamSectionWithManageTeam}
          {...defaultNavLinkProps}
        />
      )}

      {forms.length > 0 && (
        <>
          {(userTeamMemberData?.team_member_role === "ADMIN" ||
            userTeamMemberData?.team_member_role === "OWNER") && (
            <>
              <NavLinkSection
                label={"Form"}
                links={[]}
                {...defaultNavLinkProps}
              />
              {/* <NavLinkSection
                label={"Form"}
                links={ownerAndAdminFormSection}
                {...defaultNavLinkProps}
              /> */}
              {renderManageFormMenu()}
            </>
          )}
        </>
      )}

      {(userTeamMemberData?.team_member_role === "ADMIN" ||
        userTeamMemberData?.team_member_role === "OWNER") && (
        <>
          <NavLinkSection
            label={"Jira"}
            links={jiraSection}
            {...defaultNavLinkProps}
          />
        </>
      )}

      <Space h="sm" />
    </>
  );
};

export default ReviewAppNavLink;
