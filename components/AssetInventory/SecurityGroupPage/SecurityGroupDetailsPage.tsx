import {
  CategoryTableRow,
  EventTableRow,
  SecurityGroupData,
  SiteTableRow,
  TeamGroupTableRow,
} from "@/utils/types";
import { Container, Tabs, Text, Title } from "@mantine/core";
import AssetsSecurityPanel from "./AssetsSecurityPanel";
import { Department } from "./SecurityGroupPage";
type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  eventList: EventTableRow[];
  securityGroupData: SecurityGroupData;
  group: TeamGroupTableRow;
};
const SecurityGroupDetailsPage = ({
  siteList,
  departmentList,
  categoryList,
  eventList,
  securityGroupData,
  group,
}: Props) => {
  return (
    <Container>
      <Title order={2}>{group.team_group_name} GROUP </Title>

      <Tabs defaultValue="assets">
        <Tabs.List>
          <Tabs.Tab value="assets">Assets</Tabs.Tab>
          <Tabs.Tab value="privileges">Privileges</Tabs.Tab>
          <Tabs.Tab value="admin_rights">Admin Rights</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="assets">
          <AssetsSecurityPanel
            siteList={siteList}
            departmentList={departmentList}
            categoryList={categoryList}
            eventList={eventList}
            securityGroupData={securityGroupData.asset}
          />
        </Tabs.Panel>

        {/* Placeholder Panels for Other Tabs */}

        <Tabs.Panel value="privileges">
          <Text>Privileges permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="dashboard">
          <Text>Dashboard permissions will be here</Text>
        </Tabs.Panel>
        <Tabs.Panel value="admin_rights">
          <Text>Admin Rights will be here</Text>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default SecurityGroupDetailsPage;
