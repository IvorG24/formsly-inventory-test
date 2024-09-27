import { formatDate } from "@/utils/constant";
import { JoyRideNoSSR } from "@/utils/functions";
import { getStatusToColor } from "@/utils/styling";
import { RequestViewRow } from "@/utils/types";
import {
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconMaximize, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";

type Props = {
  generalAssessmentData: RequestViewRow;
  isWithNextStep: boolean;
};
const GeneralAssessment = ({
  generalAssessmentData,
  isWithNextStep,
}: Props) => {
  const router = useRouter();
  const { colors } = useMantineTheme();

  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <Title order={3}>General Assessment</Title>
      <Stack>
        <Group>
          <Text>Request ID: </Text>
          <Title order={5}>{generalAssessmentData.request_formsly_id}</Title>
        </Group>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(generalAssessmentData.request_date_created ?? "")
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge
            color={getStatusToColor(generalAssessmentData.request_status ?? "")}
          >
            {generalAssessmentData.request_status}
          </Badge>
          <Text color="dimmed">
            on{" "}
            {formatDate(
              new Date(generalAssessmentData.request_status_date_updated ?? "")
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
                `/user/requests/${generalAssessmentData.request_formsly_id}`,
                "_blank"
              );
            }}
          >
            View Request
          </Button>
        </Group>
        {isWithNextStep && (
          <Group>
            <Text>Next Step: </Text>
            <Button
              rightIcon={<IconPlus size={16} />}
              className="next-step"
              onClick={() => {
                router.push(
                  `/public-form/cc410201-f5a6-49ce-a06c-c2ce2c169436/create?generalAssessmentId=${generalAssessmentData.request_formsly_id}`
                );
              }}
            >
              Create Request
            </Button>
          </Group>
        )}
      </Stack>
      <JoyRideNoSSR
        steps={[
          {
            target: ".next-step",
            content: (
              <Text>
                You passed the general assessment, you can now continue with the
                technical assessment. To continue, simply click the
                &ldquo;Create Request&ldquo; button.
              </Text>
            ),
            disableBeacon: true,
          },
        ]}
        run={true}
        hideCloseButton
        disableCloseOnEsc
        disableOverlayClose
        hideBackButton
        styles={{ buttonNext: { backgroundColor: colors.blue[6] } }}
      />
    </Stack>
  );
};

export default GeneralAssessment;
