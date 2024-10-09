import { HRAnalyticsData } from "@/utils/types";
import { Container, Stack, Tabs, Text, Title } from "@mantine/core";
import { IconFileAnalytics, IconReportAnalytics } from "@tabler/icons-react";
import HRAnalytics from "./HRAnalytics";
import ResponseAnalytics from "./ResponseAnalytics";
type Props = {
  analyticsData: HRAnalyticsData;
};
const AnalyticsPage = ({ analyticsData }: Props) => {
  return (
    <Container fluid>
      <Stack spacing="sm">
        <Title order={2}>Human Resources Analytics Page</Title>
        <Text>
          Gain valuable insights into your organization&apos;s HR metrics,
          including employee performance and response analytics. Use the tabs
          below to explore detailed reports and make data-driven decisions.
        </Text>
        <Tabs defaultValue="response">
          <Tabs.List>
            <Tabs.Tab
              value="response"
              icon={<IconReportAnalytics size="0.8rem" />}
            >
              Response
            </Tabs.Tab>
            <Tabs.Tab
              value="analytics"
              icon={<IconFileAnalytics size="0.8rem" />}
            >
              Analytics
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="response" pt="xs">
            <HRAnalytics data={analyticsData} />
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="xs">
            <ResponseAnalytics />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AnalyticsPage;
