import { updateMemo } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { EditMemoType, MemoSignerItem } from "@/utils/types";
import {
  Box,
  Container,
  Flex,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Tabs,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { IconEye, IconFileDescription } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import EditMemoForm from "./EditMemoForm";
import EditMemoPreview from "./EditMemoPreview";

type Props = {
  memo: EditMemoType;
  teamMemoSignerList: MemoSignerItem[];
};

type EditMemoFormValues = EditMemoType;

const EditMemoPage = ({ memo, teamMemoSignerList }: Props) => {
  const router = useRouter();
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const laptopView = useMediaQuery("(min-width: 1024px)");
  const user = useUser();

  const [updatedMemo, setUpdatedMemo] = useState<EditMemoType>(memo);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const memoFormMethods = useForm<EditMemoFormValues>({
    defaultValues: updatedMemo,
  });

  const currentPreviewData = useWatch({ control: memoFormMethods.control });

  const handleUpdateMemo = async (data: EditMemoFormValues) => {
    try {
      if (!user) return;

      setIsLoading(true);
      setUpdatedMemo(data);

      if (data.memo_signer_list.length === 0) {
        return notifications.show({
          title: "Memo approvers are required",
          message: "Please add atleast one approver.",
          color: "red",
        });
      }

      const isPrimarySignerExisting = data.memo_signer_list.filter(
        (signer) => signer.memo_signer_is_primary
      );

      if (isPrimarySignerExisting.length <= 0) {
        return notifications.show({
          title: "Primary approver is required",
          message: "Please select a primary approver.",
          color: "red",
        });
      }
      let updateSignerData = data.memo_signer_list
        .sort(
          (a, b) =>
            Number(b.memo_signer_is_primary) - Number(a.memo_signer_is_primary)
        )
        .map((signer, signerIndex) => ({
          ...signer,
          memo_signer_order: signerIndex,
        }));

      if (updateSignerData.length === 1) {
        updateSignerData = updateSignerData.map((signer) => ({
          ...signer,
          memo_signer_is_primary: true,
        }));
      }

      const updateLineItem = data.memo_line_item_list.map((lineItem) => {
        if (
          lineItem.memo_line_item_attachment?.memo_line_item_attachment_file &&
          lineItem.memo_line_item_attachment.memo_line_item_attachment_file
            .name !==
            lineItem.memo_line_item_attachment.memo_line_item_attachment_name
        ) {
          const file =
            lineItem.memo_line_item_attachment.memo_line_item_attachment_file;
          const newAttachment = {
            memo_line_item_attachment_caption:
              lineItem.memo_line_item_attachment
                .memo_line_item_attachment_caption,
            memo_line_item_attachment_line_item_id: lineItem.memo_line_item_id,
            memo_line_item_attachment_name: file.name,
            memo_line_item_attachment_file: file,
          };

          return {
            ...lineItem,
            memo_line_item_attachment: newAttachment,
          };
        }

        return lineItem;
      });

      const editMemoParams = {
        ...data,
        memo_signer_list: updateSignerData,
        memo_line_item_list: updateLineItem,
      };

      await updateMemo(supabaseClient, editMemoParams as EditMemoType, user.id);

      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/memo/${data.memo_id}`
      );
    } catch (e) {
      notifications.show({
        message: "Failed to create memo",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maw={1440} pos="relative" p={0}>
      <Stack spacing="md">
        <LoadingOverlay visible={isLoading} overlayBlur={2} />
        <Title order={2} color="dimmed">
          Edit Memo Page
        </Title>
        <Tabs
          variant="pills"
          value={activeTab}
          onTabChange={(selectedTab: string) => setActiveTab(selectedTab)}
        >
          <Tabs.List>
            {!laptopView && (
              <>
                {" "}
                <Tabs.Tab
                  value="create"
                  icon={<IconFileDescription size={14} />}
                >
                  Create
                </Tabs.Tab>
                <Tabs.Tab value="preview" icon={<IconEye size={14} />}>
                  Preview
                </Tabs.Tab>
              </>
            )}
          </Tabs.List>

          <Tabs.Panel value="create" pt="xs">
            <ScrollArea>
              <Flex
                direction="row"
                gap={{ base: laptopView ? "md" : "" }}
                align="flex-start"
              >
                <Box maw={600} sx={{ flex: 1 }}>
                  <FormProvider {...memoFormMethods}>
                    <EditMemoForm
                      onSubmit={handleUpdateMemo}
                      teamMemoSignerList={teamMemoSignerList}
                    />
                  </FormProvider>
                </Box>
                {laptopView ? (
                  <Box maw={900} sx={{ flex: 1 }}>
                    <EditMemoPreview
                      data={currentPreviewData as EditMemoType}
                    />
                  </Box>
                ) : (
                  <></>
                )}
              </Flex>
            </ScrollArea>
          </Tabs.Panel>

          {!laptopView && (
            <Tabs.Panel value="preview" pt="lg">
              <EditMemoPreview data={currentPreviewData as EditMemoType} />
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>
    </Container>
  );
};

export default EditMemoPage;
