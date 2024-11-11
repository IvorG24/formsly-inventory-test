import {
  getApproverUnresolvedRequestCount,
  getNotificationList,
} from "@/backend/api/get";
import {
  readAllNotification,
  updateNotificationStatus,
} from "@/backend/api/update";
import {
  useNotificationActions,
  useNotificationStore,
  useUnreadNotificationCount,
} from "@/stores/useNotificationStore";
import { useUserStore, useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NOTIFICATION_LIST_LIMIT } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  AppType,
  ApproverUnresolvedRequestCountType,
  NotificationTableRow,
  TeamMemberTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Center,
  Container,
  CopyButton,
  Pagination,
  Paper,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ApproverNotification from "./ApproverNotification";
import NotificationList from "./NotificationList";

type Props = {
  app: AppType;
  notificationList: NotificationTableRow[];
  totalNotificationCount: number;
  tab: "all" | "unread";
};

const NotificationPage = ({
  app,
  notificationList: initialNotificationList,
  totalNotificationCount: initialTotalNotificationCount,
  tab,
}: Props) => {
  const router = useRouter();
  const initialPage = Number(router.query.page) || 1;
  const supabaseClient = createPagesBrowserClient<Database>();
  const { userProfile } = useUserStore();
  const userId = userProfile?.user_id || "";
  const teamId = userProfile?.user_active_team_id || "";
  const userTeamMemberData = useUserTeamMember();

  const { notificationList: storeNotificationList } = useNotificationStore();
  const unreadNotificationCount = useUnreadNotificationCount();
  const [pageNotificationList, setPageNotificationList] = useState(
    initialNotificationList
  );
  const [totalNotificationCount, setTotalNotificationCount] = useState(
    initialTotalNotificationCount
  );

  const {
    setUnreadNotification,
    setNotificationList: setStoreNotificationList,
  } = useNotificationActions();
  const [activePage, setActivePage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [approverUnresolvedRequestCount, setApproverUnresolvedRequestCount] =
    useState<ApproverUnresolvedRequestCountType | null>(null);

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await readAllNotification(supabaseClient, {
        userId: userId,
        appType: app,
      });
      const readAllStoreNotificationList = storeNotificationList.map(
        (notification) => ({ ...notification, notification_is_read: true })
      );
      const readAllPageNotificationList = pageNotificationList.map(
        (notification) => ({ ...notification, notification_is_read: true })
      );
      setStoreNotificationList(readAllStoreNotificationList);
      setPageNotificationList(readAllPageNotificationList);
      setUnreadNotification(0);
      notifications.show({
        message: "All notifications read.",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsLoading(true);
      await updateNotificationStatus(supabaseClient, { notificationId });
      const updatedStoreNotificationList = storeNotificationList.map(
        (notification) => {
          if (notification.notification_id === notificationId) {
            return {
              ...notification,
              notification_is_read: true,
            };
          }
          return notification;
        }
      );
      const updateUnreadNotificationCount = unreadNotificationCount - 1;
      setStoreNotificationList(updatedStoreNotificationList);
      setUnreadNotification(
        updateUnreadNotificationCount > 0 ? updateUnreadNotificationCount : 0
      );
    } catch {
      setIsLoading(false);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleGetNotificationList = async (
    page: number,
    currentTab?: string
  ) => {
    try {
      setIsLoading(true);

      const { data, count } = await getNotificationList(supabaseClient, {
        app,
        limit: DEFAULT_NOTIFICATION_LIST_LIMIT,
        page: Number(page),
        userId,
        teamId,
        unreadOnly: currentTab === "unread",
      });

      const result = data as NotificationTableRow[];

      setPageNotificationList(result);
      setTotalNotificationCount(count || 0);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openJoinTeamModal = () =>
    modals.open({
      centered: true,
      closeOnEscape: true,
      closeOnClickOutside: true,
      withCloseButton: true,
      children: (
        <Box>
          <Title order={3}>Team Invitation Required</Title>
          <Text mt="xs">
            To join a team, you need an invitation. Send a request to the team
            administrator using the email address below.
          </Text>

          <Text weight="bold" mt="md">
            Email:
            <Text weight="normal" underline span>
              {` ${userProfile?.user_email}`}
            </Text>
          </Text>

          <CopyButton value={`${userProfile?.user_email}`}>
            {({ copied, copy }) => (
              <Button
                color={copied ? "teal" : "blue"}
                onClick={copy}
                fullWidth
                mt="md"
              >
                {copied ? "Copied email" : "Copy email"}
              </Button>
            )}
          </CopyButton>
          <Button onClick={router.reload} mt="md" variant="outline" fullWidth>
            Refresh
          </Button>
        </Box>
      ),
    });

  useEffect(() => {
    const hasInvitation =
      storeNotificationList.filter(
        (notification) => notification.notification_type === "INVITE"
      ).length > 0;
    if (
      router.query.onboarding === "true" &&
      !hasInvitation &&
      userProfile?.user_email
    ) {
      openJoinTeamModal();
    } else {
      modals.closeAll();
    }
  }, [router.query, storeNotificationList]);

  // useEffect(() => {
  //   if (router.query.page === "1") {
  //     setPageNotificationList(
  //       storeNotificationList.slice(0, DEFAULT_NOTIFICATION_LIST_LIMIT)
  //     );
  //   }
  // }, [storeNotificationList, router.query]);

  useEffect(() => {
    const fetchApproverRequestCount = async (
      userTeamMemberData: TeamMemberTableRow
    ) => {
      const unresolvedRequestCount = await getApproverUnresolvedRequestCount(
        supabaseClient,
        {
          teamMemberId: userTeamMemberData.team_member_id,
        }
      );
      setApproverUnresolvedRequestCount(unresolvedRequestCount);
    };
    if (
      userTeamMemberData &&
      userTeamMemberData.team_member_role === "APPROVER"
    ) {
      fetchApproverRequestCount(userTeamMemberData);
    }
  }, [supabaseClient, userTeamMemberData]);

  return (
    <Container p={0}>
      <Title order={2}>Notifications</Title>
      {approverUnresolvedRequestCount &&
        approverUnresolvedRequestCount.approvedRequestCount.total > 0 && (
          <ApproverNotification
            approverUnresolvedRequestCount={approverUnresolvedRequestCount}
          />
        )}

      <Paper p="md" mt="xl">
        <Tabs
          defaultValue={tab}
          onTabChange={async (value) => {
            if (value === tab) return;
            setIsLoading(true);
            await router
              .replace(`/user/notification?tab=${value}`)
              .then(() => handleGetNotificationList(1, value as string));
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="all" disabled={isLoading}>
              All
            </Tabs.Tab>
            <Tabs.Tab value="unread" disabled={isLoading}>
              Unread
            </Tabs.Tab>
          </Tabs.List>

          {pageNotificationList.length > 0 ? (
            <NotificationList
              notificationList={pageNotificationList}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkAsRead={handleMarkAsRead}
              isLoading={isLoading}
            />
          ) : null}
          {pageNotificationList.length <= 0 ? (
            <Center mt="xl">
              <Text c="dimmed">No notifications yet</Text>
            </Center>
          ) : null}
        </Tabs>

        <Pagination
          value={activePage}
          total={Math.ceil(
            totalNotificationCount / DEFAULT_NOTIFICATION_LIST_LIMIT
          )}
          onChange={async (value) => {
            setIsLoading(true);
            setActivePage(value);
            await router.push(`/user/notification?tab=${tab}&page=${value}`);
            await handleGetNotificationList(value);
          }}
          mt="xl"
          position="right"
          disabled={isLoading}
        />
      </Paper>
    </Container>
  );
};

export default NotificationPage;
