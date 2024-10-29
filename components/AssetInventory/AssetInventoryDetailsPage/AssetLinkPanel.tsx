import {
  getChildAssetData,
  getChildAssetOptionLinking,
} from "@/backend/api/get";
import { createAssetLinking } from "@/backend/api/post";
import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { OptionType } from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Button,
  Flex,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
type Props = {
  fetchHistory: (page: number) => void;
};
const AssetLinkPanel = ({ fetchHistory }: Props) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const securityGroup = useSecurityGroup();
  const teamMember = useUserTeamMember();
  const assetId = router.query.assetId as string;
  const [childAsset, setChildAsset] = useState<
    {
      inventory_request_tag_id: string;
      inventory_request_name: string;
      inventory_request_serial_number: string;
    }[]
  >([]);

  const [totalCount, setTotalCount] = useState(0);
  const [childAssetOption, setChildAssetOption] = useState<OptionType[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<OptionType[]>([]);
  const [opened, setOpened] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      searchTerm: "",
    },
  });
  const hasEditOnlyPermission = securityGroup.asset.permissions.some(
    (permission) => permission.key === "editAssets" && permission.value === true
  );
  useEffect(() => {
    const fetchChildAsset = async () => {
      try {
        if (!assetId || !activeTeam.team_id) return;
        const { data, totalCount } = await getChildAssetData(supabaseClient, {
          assetId: assetId,
          page: activePage,
          limit: ROW_PER_PAGE,
        });

        setChildAsset(data);
        setTotalCount(totalCount);
        const option = await getChildAssetOptionLinking(supabaseClient, {
          teamId: activeTeam.team_id,
          assetId,
          page: activePage,
          limit: ROW_PER_PAGE,
        });

        const optionData = option.map((option) => ({
          value: option.inventory_request_id,
          label: option.inventory_request_name,
        }));
        setChildAssetOption(optionData);
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      }
    };
    fetchChildAsset();
  }, [assetId, activeTeam.team_id]);

  const handleAddAsset = (selectedAssetId: string) => {
    const selectedAsset = childAssetOption.find(
      (option) => option.value === selectedAssetId
    );
    if (
      selectedAsset &&
      !linkedAssets.some((asset) => asset.value === selectedAssetId)
    ) {
      setLinkedAssets((prev) => [...prev, selectedAsset]);
      setChildAssetOption((prev) =>
        prev.filter((option) => option.value !== selectedAssetId)
      );
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    const removedAsset = linkedAssets.find((asset) => asset.value === assetId);
    setLinkedAssets((prev) => prev.filter((asset) => asset.value !== assetId));

    if (removedAsset) {
      setChildAssetOption((prev) => [...prev, removedAsset]); // Add back to options
    }
  };

  const handleModalClose = () => {
    reset();
    setLinkedAssets([]);
    setOpened(false);
  };

  const handleAssetLinking = async () => {
    try {
      if (linkedAssets.length === 0) {
        notifications.show({
          message: "Please choose a child asset",
          color: "orange",
        });
        return;
      }
      await createAssetLinking(supabaseClient, {
        linkedAssets: linkedAssets.map((asset) => asset.value),
        assetId: assetId,
        teamMemberId: teamMember?.team_member_id || "",
      });
      const { data, totalCount } = await getChildAssetData(supabaseClient, {
        assetId,
        page: activePage,
        limit: ROW_PER_PAGE,
      });
      setChildAsset(data);
      setTotalCount(totalCount);
      fetchHistory(1);
      notifications.show({
        message: "Asset link successfully",
        color: "green",
      });
      setLinkedAssets([]);
      setOpened(false);
      reset();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };
  return (
    <Stack spacing="sm">
      <Modal
        opened={opened}
        onClose={handleModalClose}
        title="Asset Link Search"
        size="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <form onSubmit={handleSubmit(handleAssetLinking)}>
          <Stack>
            <Controller
              name="searchTerm"
              control={control}
              render={({ field }) => (
                <Select
                  withinPortal
                  searchable
                  {...field}
                  placeholder="Search for an asset..."
                  data={childAssetOption}
                  onChange={(value) => handleAddAsset(value || "")}
                />
              )}
            />

            <Text weight={500} mt="md">
              Child Assets:
            </Text>
            {linkedAssets.length > 0 ? (
              <Stack spacing="xs">
                {linkedAssets.map((asset) => (
                  <Flex
                    align="center"
                    justify="space-between"
                    key={asset.value}
                  >
                    <Group spacing={6}>
                      <IconPlus color="white" size={16} />
                      <Text>{asset.label}</Text>
                    </Group>
                    <Group>
                      <ActionIcon
                        variant="filled"
                        color="red"
                        onClick={() => handleRemoveAsset(asset.value)} // Handle removing the asset
                      >
                        <IconTrash color="white" size={16} />
                      </ActionIcon>
                    </Group>
                  </Flex>
                ))}
              </Stack>
            ) : (
              <Text color="dimmed">No assets linked yet.</Text>
            )}

            <Button type="submit" fullWidth>
              Link Assets
            </Button>
          </Stack>
        </form>
      </Modal>

      {childAsset.length > 0 && (
        <DataTable
          fontSize={12}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="inventory_request_id"
          page={activePage}
          totalRecords={totalCount}
          recordsPerPage={ROW_PER_PAGE}
          records={childAsset}
          fetching={false}
          onPageChange={setActivePage}
          columns={[
            {
              accessor: "inventory_request_id",
              title: "Asset Tag Id",
              width: "40%",
              render: (event) => (
                <Text>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/inventory/${event.inventory_request_tag_id}`}
                    target="_blank"
                  >
                    {String(event.inventory_request_tag_id)}
                  </Anchor>
                </Text>
              ),
            },

            {
              accessor: "inventory_request_serial_number",
              title: "Serial No",
              width: "30%",
              render: (event) => (
                <Text>{event.inventory_request_serial_number}</Text>
              ),
            },
            {
              accessor: "inventory_request_name",
              title: "Asset Name",
              width: "40%",
              render: (event) => <Text>{event.inventory_request_name}</Text>,
            },
          ]}
        />
      )}
      <Group position="center">
        {hasEditOnlyPermission && (
          <Button fullWidth onClick={() => setOpened(true)}>
            Open Asset Link
          </Button>
        )}
      </Group>
    </Stack>
  );
};

export default AssetLinkPanel;
