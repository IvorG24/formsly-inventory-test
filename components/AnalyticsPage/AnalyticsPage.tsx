import { HRAnalyticsData } from "@/utils/types";
import { Container, Flex, Stack, Tabs, Text, Title } from "@mantine/core";
import { IconFileAnalytics, IconReportAnalytics } from "@tabler/icons-react";
import { useState } from "react";
import Analytics from "./Analytics";
import ExportToCSVModal from "./ExportToCSVModal";
import Response from "./Response";

type Props = {
  analyticsData: HRAnalyticsData;
};

const AnalyticsPage = ({ analyticsData }: Props) => {
  const [openExportToCSVModal, setOpenExportToCSVModal] = useState(false);

  return (
    <Container fluid>
      <Stack spacing="sm">
        <Flex gap="sm" wrap="wrap">
          <Title order={2}>Human Resources Analytics Page</Title>
          {/* <Button onClick={() => setOpenExportToCSVModal(true)}>
            Export to CSV
          </Button> */}
        </Flex>
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
            <Response data={analyticsData} />
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="xs">
            <Analytics />
          </Tabs.Panel>
        </Tabs>

        <ExportToCSVModal
          opened={openExportToCSVModal}
          onClose={() => setOpenExportToCSVModal(false)}
        />
      </Stack>
    </Container>
  );
};

export default AnalyticsPage;
