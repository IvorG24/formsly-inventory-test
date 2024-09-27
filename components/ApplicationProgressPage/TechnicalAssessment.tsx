import { formatDate } from "@/utils/constant";
import { getStatusToColor } from "@/utils/styling";
import { RequestViewRow } from "@/utils/types";
import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconMaximize } from "@tabler/icons-react";

type Props = {
  technicalAssessmentData: RequestViewRow;
};
const TechnicalAssessment = ({ technicalAssessmentData }: Props) => {
  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <Title order={3}>Technical Assessment</Title>
      <Stack mb={24}>
        <Group>
          <Text>Request ID: </Text>
          <Title order={5}>{technicalAssessmentData.request_formsly_id}</Title>
        </Group>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(technicalAssessmentData.request_date_created ?? "")
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge
            color={getStatusToColor(
              technicalAssessmentData.request_status ?? ""
            )}
          >
            {technicalAssessmentData.request_status}
          </Badge>
          <Text color="dimmed">
            on{" "}
            {formatDate(
              new Date(
                technicalAssessmentData.request_status_date_updated ?? ""
              )
            )}
          </Text>
        </Group>
        <Group>
          <Text>Request: </Text>
          <Button
            rightIcon={<IconMaximize size={16} />}
            variant="light"
            onClick={() => {
              window.open(
                `/user/requests/${technicalAssessmentData.request_formsly_id}`,
                "_blank"
              );
            }}
          >
            View Request
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
};

export default TechnicalAssessment;
