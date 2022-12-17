// todo: create unit tests for requests page and all of its sub components
import { Container, Tabs, Title } from "@mantine/core";
import { useRouter } from "next/router";
import RequestList from "./RequestList";

type Props = {
  activeTab: string;
};

const RequestsPage = ({ activeTab }: Props) => {
  const router = useRouter();

  return (
    <Container px={8} py={16} fluid>
      <Title>Requests</Title>

      <Tabs
        value={activeTab}
        onTabChange={(value) =>
          router.push(
            `/t/${router.query.tid}/requests/${value === "all" ? "" : value}`
          )
        }
        defaultValue={activeTab}
        mt={50}
      >
        <Tabs.List>
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value="sent">Sent</Tabs.Tab>
          <Tabs.Tab value="received">Received</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Container fluid m={0} p={0}>
        <RequestList activeTab={activeTab} />
      </Container>
    </Container>
  );
};

export default RequestsPage;
