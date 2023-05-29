import { FormStatusType } from "@/utils/types";
import { Button, Paper, Space, Stack, Title } from "@mantine/core";
import { useRouter } from "next/router";

type Props = {
  isUserOwner: boolean;
  requestStatus: FormStatusType;
  requestId: string;
  handleCancelRequest: () => void;
  openPromptDeleteModal: () => void;
  isUserSigner: boolean;
  handleUpdateRequest: (status: "APPROVED" | "REJECTED") => void;
};

const RequestActionSection = ({
  isUserOwner,
  requestStatus,
  requestId,
  handleCancelRequest,
  openPromptDeleteModal,
  isUserSigner,
  handleUpdateRequest,
}: Props) => {
  const router = useRouter();

  return (
    <Paper p="xl" shadow="xs">
      <Title order={4} color="dimmed">
        Request Action
      </Title>
      <Space h="xl" />
      {isUserOwner && requestStatus === "PENDING" && (
        <>
          <Stack spacing="sm">
            <Button
              variant="outline"
              fullWidth
              onClick={() =>
                router.push(`/team-requests/requests/${requestId}/edit`)
              }
            >
              Edit Request
            </Button>
            <Button variant="default" fullWidth onClick={handleCancelRequest}>
              Cancel Request
            </Button>
          </Stack>
        </>
      )}
      {isUserOwner && requestStatus === "CANCELED" && (
        <Button color="red" fullWidth onClick={openPromptDeleteModal}>
          Delete Request
        </Button>
      )}
      {isUserSigner && requestStatus === "PENDING" && (
        <>
          <Stack>
            <Button
              color="green"
              fullWidth
              onClick={() => handleUpdateRequest("APPROVED")}
            >
              Approve Request
            </Button>
            <Button
              color="red"
              fullWidth
              onClick={() => handleUpdateRequest("REJECTED")}
            >
              Reject Request
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default RequestActionSection;
