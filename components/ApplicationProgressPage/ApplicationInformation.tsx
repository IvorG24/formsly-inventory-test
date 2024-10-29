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
  applicationInformationData: RequestViewRow;
  isWithNextStep: boolean;
};
const ApplicationInformation = ({
  applicationInformationData,
  isWithNextStep,
}: Props) => {
  const router = useRouter();
  const { colors } = useMantineTheme();

  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <Title order={3}>Application Information</Title>
      <Stack>
        <Group>
          <Text>Request ID: </Text>
          <Title order={5}>
            {applicationInformationData.request_formsly_id}
          </Title>
        </Group>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(applicationInformationData.request_date_created ?? "")
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge
            color={getStatusToColor(
              applicationInformationData.request_status ?? ""
            )}
          >
            {applicationInformationData.request_status}
          </Badge>
          {applicationInformationData.request_status_date_updated && (
            <Text color="dimmed">
              on{" "}
              {formatDate(
                new Date(
                  applicationInformationData.request_status_date_updated ?? ""
                )
              )}
            </Text>
          )}
        </Group>
        <Group>
          <Text>Request: </Text>
          <Button
            rightIcon={<IconMaximize size={16} />}
            variant="light"
            onClick={() => {
              window.open(
                `/user/requests/${applicationInformationData.request_formsly_id}`,
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
                  `/public-form/2f9100a9-f322-405f-acda-68bbf94236b0/create?applicationInformationId=${applicationInformationData.request_formsly_id}`
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
                You can now continue with the general assessment since your
                application information has been approved. To continue, simply
                click the &ldquo;Create Request&ldquo; button.
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

export default ApplicationInformation;
