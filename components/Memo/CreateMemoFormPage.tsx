import { createTeamMemo } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { MemoSignerItem, UserTableRow } from "@/utils/types";
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
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconEye, IconFileDescription } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import MemoForm from "./MemoForm";
import MemoPreview from "./MemoPreview";

export type MemoFormValues = {
  author: string;
  subject: string;
  lineItem: {
    line_item_content: string;
    line_item_image_attachment?: File;
    line_item_image_caption?: string;
  }[];
  signerList: {
    signer_status: string;
    signer_is_primary: boolean;
    signer_team_member_id: string;
    signer_full_name: string;
    signer_avatar: string | null;
    signer_signature: string | null;
    signer_job_title: string | null;
    signer_user_id: string;
  }[];
};

type Props = {
  user: UserTableRow;
  teamMemoSignerList: MemoSignerItem[];
};

export const getDefaultMemoLineItemValue = ({
  content = "",
}: {
  content?: string;
}) => ({
  line_item_content: content,
});

const CreateMemoFormPage = ({ user, teamMemoSignerList }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const userFullname = `${user.user_first_name} ${user.user_last_name}`;
  const laptopView = useMediaQuery("(min-width: 1024px)");

  const memoFormMethods = useForm<MemoFormValues>({
    defaultValues: {
      author: userFullname,
      subject: "",
      lineItem: [getDefaultMemoLineItemValue({})],
    },
  });

  const [activeTab, setActiveTab] = useState("create");
  const [isLoading, setIsLoading] = useState(false);

  const currentPreviewData = useWatch({ control: memoFormMethods.control });

  const handleCreateMemo = async (data: MemoFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      if (data.signerList.length <= 0) {
        return notifications.show({
          title: "Memo approvers are required",
          message: "Please add atleast one approver.",
          color: "red",
        });
      }

      const isPrimarySignerExisting = data.signerList.filter(
        (signer) => signer.signer_is_primary
      );

      if (isPrimarySignerExisting.length <= 0) {
        return notifications.show({
          title: "Primary approver is required",
          message: "Please select a primary approver.",
          color: "red",
        });
      }

      const memo_reference_number = uuidv4();

      let signerData = data.signerList
        .sort(
          (a, b) => Number(b.signer_is_primary) - Number(a.signer_is_primary)
        )
        .map((signer, signerIndex) => ({
          memo_signer_order: signerIndex,
          memo_signer_is_primary: signer.signer_is_primary,
          memo_signer_team_member_id: signer.signer_team_member_id,
          memo_signer_user_id: signer.signer_user_id,
        }));

      // automatically make signer primary if signerList has only 1 signer
      if (signerData.length === 1) {
        signerData = signerData.map((signer) => ({
          ...signer,
          memo_signer_is_primary: true,
        }));
      }

      const lineItemData = data.lineItem.map((lineItem) => {
        const newLineItem = {
          memo_line_item_content: lineItem.line_item_content,
        };

        if (lineItem.line_item_image_attachment) {
          const newLineItemWithAttachment = {
            ...newLineItem,
            memo_line_item_attachment: lineItem.line_item_image_attachment,
            memo_line_item_attachment_name:
              lineItem.line_item_image_attachment.name,
            memo_line_item_attachment_caption: lineItem.line_item_image_caption,
          };

          return newLineItemWithAttachment;
        }

        return newLineItem;
      });

      const createMemoParams = {
        memoData: {
          memo_author_user_id: user.user_id,
          memo_subject: data.subject,
          memo_team_id: activeTeam.team_id,
          memo_reference_number,
        },
        signerData,
        lineItemData,
        userId: user.user_id,
      };

      const newMemo = await createTeamMemo(supabaseClient, createMemoParams);
      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/memo/${
          newMemo.memo_id
        }`
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
          Create Memo Page
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
                h="100%"
              >
                <Box maw={600} sx={{ flex: 1 }}>
                  <FormProvider {...memoFormMethods}>
                    <MemoForm
                      onSubmit={handleCreateMemo}
                      teamMemoSignerList={teamMemoSignerList}
                    />
                  </FormProvider>
                </Box>
                {laptopView ? (
                  <Box maw={900} sx={{ flex: 1 }}>
                    <MemoPreview data={currentPreviewData as MemoFormValues} />
                  </Box>
                ) : (
                  <></>
                )}
              </Flex>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="preview" pt="lg">
            {!laptopView && (
              <MemoPreview data={currentPreviewData as MemoFormValues} />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default CreateMemoFormPage;
