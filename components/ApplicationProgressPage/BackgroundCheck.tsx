import { formatDate } from "@/utils/constant";
import { getStatusToColor } from "@/utils/styling";
import { BackgroundCheckTableRow } from "@/utils/types";
import { Alert, Badge, Group, Stack, Text, Title } from "@mantine/core";
import { IconNote } from "@tabler/icons-react";

type Props = {
  backgroundCheckData: BackgroundCheckTableRow;
};
const BackgroundCheck = ({ backgroundCheckData }: Props) => {
  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <Title order={3}>Background Check</Title>
      <Stack>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(backgroundCheckData.background_check_date_created ?? "")
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge
            color={getStatusToColor(
              backgroundCheckData.background_check_status ?? ""
            )}
          >
            {backgroundCheckData.background_check_status}
          </Badge>
          {backgroundCheckData.background_check_status_date_updated && (
            <Text color="dimmed">
              on{" "}
              {formatDate(
                new Date(
                  backgroundCheckData.background_check_status_date_updated
                )
              )}
            </Text>
          )}
        </Group>
        {backgroundCheckData.background_check_status === "PENDING" && (
          <Alert mb="xl" title="Note!" icon={<IconNote size={16} />}>
            <Text>
              We&apos;re excited to move forward and will be starting the
              background check process next. Thank you for your cooperation!
            </Text>
          </Alert>
        )}
      </Stack>
    </Stack>
  );
};

export default BackgroundCheck;
