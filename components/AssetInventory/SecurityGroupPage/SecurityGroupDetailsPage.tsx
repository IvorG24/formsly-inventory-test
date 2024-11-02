import { useEventList } from "@/stores/useEventStore";
import {
  CategoryTableRow,
  SecurityGroupData,
  SiteTableRow,
  TeamGroupTableRow,
} from "@/utils/types";
import { Container, Tabs, Title } from "@mantine/core";
import AssetsSecurityPanel from "./AssetsSecurityPanel";
import PrivilegesSecurityPanel from "./PrivilegesSecurityPanel";
import { Department } from "./SecurityGroupPage";
type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  securityGroupData: SecurityGroupData;
  group: TeamGroupTableRow;
};
const SecurityGroupDetailsPage = ({
  siteList,
  departmentList,
  categoryList,
  securityGroupData,
  group,
}: Props) => {
  const eventList = useEventList();
  return (
    <Container>
      <Title order={2}>{group.team_group_name} GROUP </Title>

      <Tabs defaultValue="assets">
        <Tabs.List>
          <Tabs.Tab value="assets">Assets</Tabs.Tab>
          <Tabs.Tab value="privileges">Privileges</Tabs.Tab>
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

        <Tabs.Panel value="privileges">
          <PrivilegesSecurityPanel
            privilegesGroupdata={securityGroupData.privileges}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default SecurityGroupDetailsPage;
