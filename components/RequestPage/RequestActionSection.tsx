import { checkIfJiraIDIsUnique } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  Button,
  Flex,
  Paper,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
// import { useRouter } from "next/router";
import { modals, openConfirmModal } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconId } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

type Props = {
  handleCancelRequest: () => void;
  openPromptDeleteModal: () => void;
  handleUpdateRequest: (
    status: "APPROVED" | "REJECTED",
    jiraId?: string,
    jiraLink?: string
  ) => void;
  isRf?: boolean;
  isCashPurchase?: boolean;
  isUserPrimarySigner?: boolean;
  requestId: string;
  isEditable: boolean;
  canSignerTakeAction?: boolean;
  isDeletable: boolean;
  isUserRequester?: boolean;
};

const RequestActionSection = ({
  handleCancelRequest,
  openPromptDeleteModal,
  handleUpdateRequest,
  isRf,
  isCashPurchase,
  isUserPrimarySigner,
  requestId,
  isEditable,
  canSignerTakeAction,
  isDeletable,
  isUserRequester,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const activeTeam = useActiveTeam();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<{ jiraId: string }>();

  const resetValue = () => {
    setValue("jiraId", "");
    setError("jiraId", { message: "" });
  };

  const handleAction = (action: string, color: string) => {
    if (
      isRf &&
      action === "approve" &&
      isUserPrimarySigner &&
      !isCashPurchase
    ) {
      modals.open({
        modalId: "approveRf",
        title: <Text>Please confirm your action.</Text>,
        children: (
          <>
            <Text size={14}>
              Are you sure you want to {action} this request?
            </Text>
            <form
              onSubmit={handleSubmit((data) => {
                handleUpdateRequest("APPROVED", data.jiraId);
                modals.close("approveRf");
              })}
            >
              <Stack mt="xl" spacing="xs">
                <TextInput
                  icon={<IconId size={16} />}
                  placeholder="Jira ID"
                  data-autofocus
                  {...register("jiraId", {
                    validate: {
                      required: (value) => {
                        if (!value) {
                          notifications.show({
                            message: "Jira ID is required.",
                            color: "red",
                          });
                          return "Jira ID is required.";
                        } else {
                          return true;
                        }
                      },
                      checkIfUnique: async (value) => {
                        if (
                          await checkIfJiraIDIsUnique(supabaseClient, {
                            value: value,
                          })
                        ) {
                          notifications.show({
                            message: "Jira ID already exists.",
                            color: "red",
                          });
                          return "Jira ID already exists.";
                        } else {
                          return true;
                        }
                      },
                    },
                  })}
                  error={errors.jiraId?.message}
                />
              </Stack>

              <Flex mt="md" align="center" justify="flex-end" gap="sm">
                <Button
                  variant="default"
                  color="dimmed"
                  onClick={() => {
                    resetValue();
                    modals.close("approveRf");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" color="green">
                  Approve
                </Button>
              </Flex>
            </form>
          </>
        ),
        centered: true,
        onClose: () => {
          resetValue();
        },
      });
    } else {
      openConfirmModal({
        title: <Text>Please confirm your action.</Text>,
        children: (
          <Text size={14}>Are you sure you want to {action} this request?</Text>
        ),
        labels: { confirm: "Confirm", cancel: "Cancel" },
        centered: true,
        confirmProps: { color },

        onConfirm: () => {
          switch (action) {
            case "approve":
              handleUpdateRequest("APPROVED");
              break;
            case "reject":
              handleUpdateRequest("REJECTED");
              break;
            case "cancel":
              handleCancelRequest();
              break;
          }
        },
      });
    }
  };

  return (
    <Paper p="xl" shadow="xs">
      <Title order={4} color="dimmed">
        Request Action
      </Title>
      <Space h="xl" />
      <Stack>
        {!isUserRequester === false && (
          <Button
            fullWidth
            onClick={() =>
              router.push(
                `/${formatTeamNameToUrlKey(
                  activeTeam.team_name ?? ""
                )}/requests/${requestId}/edit?referenceOnly=true`
              )
            }
          >
            Reference this Request
          </Button>
        )}

        {canSignerTakeAction && (
          <>
            <Button
              color="green"
              fullWidth
              onClick={() => handleAction("approve", "green")}
            >
              Approve Request
            </Button>
            <Button
              color="red"
              fullWidth
              onClick={() => handleAction("reject", "red")}
            >
              Reject Request
            </Button>
          </>
        )}

        {isEditable && (
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() =>
                router.push(
                  `/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/requests/${router.query.requestId}/edit`
                )
              }
            >
              Edit Request
            </Button>
            <Button
              variant="default"
              fullWidth
              onClick={() => handleAction("cancel", "blue")}
            >
              Cancel Request
            </Button>
          </>
        )}
        {isDeletable && (
          <Button color="red" fullWidth onClick={openPromptDeleteModal}>
            Delete Request
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default RequestActionSection;
