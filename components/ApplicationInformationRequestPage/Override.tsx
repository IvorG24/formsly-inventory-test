import { Button, Paper, Space, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
// import { useRouter } from "next/router";

type Props = {
  handleOverrideRequest: () => void;
};

const Override = ({ handleOverrideRequest }: Props) => {
  return (
    <Paper p="xl" shadow="xs">
      <Title order={4} color="dimmed">
        Override
      </Title>
      <Space h="xl" />
      <Stack>
        <Button
          onClick={() =>
            modals.openConfirmModal({
              title: "Confirm Override",
              centered: true,
              children: (
                <Text size="sm">
                  Are you sure you want to override this application?
                </Text>
              ),
              labels: { confirm: "Confirm", cancel: "Cancel" },
              onConfirm: handleOverrideRequest,
            })
          }
          fullWidth
        >
          Override Signer
        </Button>
      </Stack>
    </Paper>
  );
};

export default Override;
