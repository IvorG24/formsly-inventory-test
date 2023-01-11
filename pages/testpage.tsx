import TeamLayout from "@/components/Layout/TeamLayout";
import Meta from "@/components/Meta/Meta";
import RequestList from "@/components/Request/RequestList";

import { RequestListProps } from "@/contexts/RequestListContext";
import { Tabs } from "@mantine/core";
import { NextPageWithLayout } from "pages/_app";
import { ReactElement } from "react";

const RequestsPage: NextPageWithLayout<RequestListProps> = () => {
  // todo: fix meta tags
  return (
    <>
      <Meta description="List of all Requests" url="localhost:3000/requests" />
      <Tabs variant="pills" defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value="sent">Sent</Tabs.Tab>
          <Tabs.Tab value="received">Received</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="xs">
          <RequestList />
        </Tabs.Panel>

        <Tabs.Panel value="sent" pt="xs">
          Sent tab content
        </Tabs.Panel>

        <Tabs.Panel value="received" pt="xs">
          Received tab content
        </Tabs.Panel>
      </Tabs>
    </>
  );
};

RequestsPage.getLayout = function getLayout(page: ReactElement) {
  return <TeamLayout>{page}</TeamLayout>;
};

export default RequestsPage;
