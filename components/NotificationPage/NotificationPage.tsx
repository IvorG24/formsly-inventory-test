import {
  getNotificationList,
  getUnresolvedRequestListPerApprover,
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
  ApproverUnresolvedRequestListType,
  NotificationTableRow,
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
import { startCase } from "utils/string";
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
  const [approverUnresolvedRequestList, setApproverUnresolvedRequestList] =
    useState<ApproverUnresolvedRequestListType[]>([]);

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
    }
    setIsLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
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
        unreadOnly: currentTab === "unread" ?? tab === "unread",
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
      closeOnEscape: false,
      closeOnClickOutside: false,
      withCloseButton: false,
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
    if (router.query.onboarding === "true" && !hasInvitation)
      openJoinTeamModal();
    else modals.closeAll();
  }, [router.query, storeNotificationList]);

  useEffect(() => {
    if (router.query.page === "1") {
      setPageNotificationList(
        storeNotificationList.slice(0, DEFAULT_NOTIFICATION_LIST_LIMIT)
      );
    }
  }, [storeNotificationList, router.query]);

  useEffect(() => {
    const fetchApproverRequestList = async () => {
      if (!userTeamMemberData) return;
      const unresolvedRequestList = await getUnresolvedRequestListPerApprover(
        supabaseClient,
        {
          teamMemberId: userTeamMemberData.team_member_id,
        }
      );
      setApproverUnresolvedRequestList(unresolvedRequestList);
    };
    fetchApproverRequestList();
  }, [supabaseClient, userTeamMemberData]);

  return (
    <Container p={0}>
      <Title order={2}>{startCase(app)} Notifications </Title>
      {approverUnresolvedRequestList.length > 0 && (
        <ApproverNotification
          approverUnresolvedRequestList={approverUnresolvedRequestList}
        />
      )}

      <Paper p="md">
        <Tabs
          defaultValue={tab}
          onTabChange={(value) =>
            router
              .replace(`/user/notification?tab=${value}`)
              .then(() => handleGetNotificationList(1, value as string))
          }
        >
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="unread">Unread</Tabs.Tab>
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
            setActivePage(value);
            await router.push(`/user/notification?tab=${tab}&page=${value}`);
            await handleGetNotificationList(value);
          }}
          mt="xl"
          position="right"
        />
      </Paper>
    </Container>
  );
};

export default NotificationPage;
