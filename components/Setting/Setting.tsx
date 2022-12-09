import { Container, Tabs, Title } from "@mantine/core";
import { useRouter } from "next/router";
import MembersPage from "../MembersPage/MembersPage";
import NotificationsPage from "../NotificationsPage/NotificationsPage";
import ProfileSettingsPage from "../ProfileSettingsPage/ProfileSettingsPage";

type Props = {
  activeTab: string;
};

const Setting = ({ activeTab }: Props) => {
  const router = useRouter();

  return (
    <Container fluid px="xs" py="sm">
      <Title>Settings</Title>
      <Tabs
        value={activeTab}
        onTabChange={(value) => router.push(`/settings/${value}`)}
        defaultValue={activeTab}
        mt="xl"
      >
        <Tabs.List>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="members">Member</Tabs.Tab>
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="notification">Notification</Tabs.Tab>
          <Tabs.Tab value="billing">Billing</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="xl">
          {/* <General /> */}
        </Tabs.Panel>
        <Tabs.Panel value="members" pt="xl">
          <MembersPage />
        </Tabs.Panel>
        <Tabs.Panel value="profile" pt="xl">
          <ProfileSettingsPage />
        </Tabs.Panel>
        <Tabs.Panel value="notification" pt="xl">
          <NotificationsPage />
        </Tabs.Panel>
        <Tabs.Panel value="billing" pt="xl">
          {/* <Billing /> */}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default Setting;
