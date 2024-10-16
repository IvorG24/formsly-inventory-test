import { getAssetDetails, getEventDetails } from "@/backend/api/get";
import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { formatDate } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  InventoryEventRow,
  InventoryHistory,
  InventoryListType,
  OptionType,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Group,
  Menu,
  Paper,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconDotsVertical, IconEdit } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import EventFormModal from "../EventFormModal";
import AdditionalDetailsPanel from "./AdditionalDetailsPanel";
import AssetLinkPanel from "./AssetLinkPanel";
import EventPanel from "./EventPanel";
import HistoryPanel from "./HistoryPanel";

type Props = {
  asset_details: InventoryListType[];
  asset_history: InventoryHistory[];
  asset_event: InventoryEventRow[];
};

const excludedKeys = [
  "inventory_request_name",
  "request_creator_first_name",
  "request_creator_last_name",
  "site_name",
  "inventory_assignee_team_member_id",
  "request_creator_team_member_id",
  "request_creator_user_id",
  "assignee_user_id",
  "inventory_assignee_asset_request_id",
  "request_creator_avatar",
  "assignee_team_member_id",
  "assignee_first_name",
  "assignee_last_name",
  "inventory_request_purchase_date",
  "inventory_request_purchase_from",
  "inventory_request_purchase_order",
  "inventory_request_created_by",
  "inventory_request_created",
  "inventory_request_cost",
  "inventory_assignee_site_id",
  "inventory_request_form_id",
];

const formatLabel = (key: string) => {
  if (key === "inventory_request_id") {
    return "Asset Tag Id";
  }
  const formattedKey = key.replace(/^inventory_request_/, "");
  return formattedKey
    .replace(/_/g, " ")
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

const AssetInventoryDetailsPage = ({
  asset_details: initialDetails,
  asset_history,
  asset_event,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const user = useUserProfile();
  const router = useRouter();
  const assetId = router.query.assetId as string;
  const teamMemberList = useTeamMemberList();
  const [optionsEvent, setOptionsEvent] = useState<OptionType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] =
    useState<InventoryListType[]>(initialDetails);
  const securityGroup = useSecurityGroup();
  const canEdit =
    securityGroup?.asset?.permissions?.find(
      (permission) => permission.key === "editAssets"
    )?.value === true;
  useEffect(() => {
    const getEventOptions = async () => {
      if (!activeTeam.team_id) return;
      const eventOptions = await getEventDetails(
        supabaseClient,
        activeTeam.team_id
      );
      const eventSecurity = securityGroup.asset.filter.event;

      const filteredEvents = eventOptions.filter((event) =>
        eventSecurity.includes(event.event_name)
      );

      const assetStatus = assetDetails[0]?.inventory_request_status;

      const filteredEventOptions = filteredEvents.filter((event) => {
        if (assetStatus === "CHECKED OUT" && event.event_name === "Check Out") {
          return false;
        }
        if (assetStatus === "AVAILABLE" && event.event_name === "Check In") {
          return false;
        }
        return true;
      });
      const initialEventOptions: OptionType[] = filteredEventOptions.map(
        (event) => ({
          label: event.event_name,
          value: event.event_id,
        })
      );

      setOptionsEvent(initialEventOptions);
    };

    getEventOptions();
  }, [activeTeam.team_id, assetDetails]);

  const handleMenuClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const fetchAssetDetails = async () => {
    try {
      const assetData = await getAssetDetails(supabaseClient, {
        asset_request_id: router.query.assetId as string,
      });
      setAssetDetails(assetData.asset_details);
      setSelectedEventId(null);
    } catch {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container size="lg">
      {selectedEventId && (
        <EventFormModal
          setSelectedEventId={setSelectedEventId}
          eventId={selectedEventId}
          teamMemberList={teamMemberList}
          selectedRow={[assetId]}
          userId={user?.user_id || ""}
          handleFilterForms={fetchAssetDetails}
        />
      )}

      <Paper shadow="lg" p="lg">
        {assetDetails.map((detail, idx) => (
          <Box key={idx}>
            <Group position="apart" mb="md">
              <Title order={3}>{detail.inventory_request_name}</Title>
              <Group>
                {canEdit && (
                  <Button
                    onClick={() => {
                      router.push(
                        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/${detail.inventory_request_id}/edit`
                      );
                    }}
                    rightIcon={<IconEdit size={16} />}
                  >
                    Edit Asset
                  </Button>
                )}

                <Menu>
                  <Menu.Target>
                    <Button rightIcon={<IconDotsVertical size={16} />}>
                      More Actions
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Actions</Menu.Label>
                    {optionsEvent.map((event) => (
                      <Menu.Item
                        key={event.value}
                        onClick={() => handleMenuClick(event.value)}
                      >
                        {event.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <Table striped highlightOnHover withBorder withColumnBorders>
              <tbody>
                {Object.entries(detail)
                  .filter(([key]) => !excludedKeys.includes(key))
                  .reduce<JSX.Element[]>((acc, [key, value], index, array) => {
                    if (index % 2 === 0) {
                      const nextEntry = array[index + 1];
                      acc.push(
                        <tr key={key}>
                          <td>
                            <Text weight={500}>{formatLabel(key)}</Text>
                          </td>
                          <td>
                            {key === "purchase_date"
                              ? formatDate(new Date(String(value)))
                              : value || "N/A"}
                          </td>
                          {nextEntry ? (
                            <>
                              <td>
                                <Text weight={500}>
                                  {formatLabel(nextEntry[0])}
                                </Text>
                              </td>
                              <td>
                                {nextEntry[0] === "purchase_date"
                                  ? formatDate(new Date(String(nextEntry[1])))
                                  : nextEntry[1] || "N/A"}
                              </td>
                            </>
                          ) : (
                            <td colSpan={2}></td>
                          )}
                        </tr>
                      );
                    }
                    return acc;
                  }, [])}

                <tr>
                  <td>
                    <Text weight={500}>Created By</Text>
                  </td>
                  <td>
                    {detail.request_creator_first_name}{" "}
                    {detail.request_creator_last_name || "N/A"}
                  </td>
                  <td>
                    <Text weight={500}>Assigned To</Text>
                  </td>
                  <td>
                    {detail.site_name || ""}
                    {`${detail.assignee_first_name || ""} ${detail.assignee_last_name || ""}`}
                  </td>
                </tr>
              </tbody>
            </Table>

            <Tabs mt="xl" defaultValue="details">
              <Tabs.List>
                <Tabs.Tab value="details">Additional Details</Tabs.Tab>
                <Tabs.Tab value="events">Events</Tabs.Tab>
                <Tabs.Tab value="asset-link">Asset Link</Tabs.Tab>
                <Tabs.Tab value="history">History</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" mt="md">
                <AdditionalDetailsPanel detail={detail} />
              </Tabs.Panel>

              <Tabs.Panel value="events" mt="md">
                <EventPanel asset_event={asset_event} />
              </Tabs.Panel>
              <Tabs.Panel value="asset-link" mt="md">
                <AssetLinkPanel />
              </Tabs.Panel>

              <Tabs.Panel value="history" mt="md">
                <HistoryPanel asset_history={asset_history} />
              </Tabs.Panel>
            </Tabs>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
