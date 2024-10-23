import {
  getAssetHistoryData,
  getAssetSpreadsheetView,
  getEventDetails,
  getEventsHistoryData,
} from "@/backend/api/get";
import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  InventoryDynamicRow,
  InventoryHistory,
  InventoryListType,
  OptionType,
} from "@/utils/types";
import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  LoadingOverlay,
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
  "inventory_request_status_color",
  "inventory_request_item_code",
  "inventory_request_serial_number",
  "inventory_request_si_number",
  "inventory_event_date_created",
];

const formatLabel = (key: string) => {
  if (key === "inventory_request_tag_id") {
    return "Asset Tag ID";
  } else if (key === "inventory_request_si_number") {
    return "SI number";
  } else if (key === "inventory_request_item_code") {
    return "Item NAV Code";
  }
  const formattedKey = key.replace(/^inventory_request_/, "");
  return formattedKey
    .replace(/_/g, " ")
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

const AssetInventoryDetailsPage = ({
  asset_details: initialDetails,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const user = useUserProfile();
  const router = useRouter();
  const teamMemberList = useTeamMemberList();

  const assetId = router.query.assetId as string;
  const [isLoading, setIsloading] = useState(false);
  const [optionsEvent, setOptionsEvent] = useState<OptionType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] =
    useState<InventoryListType[]>(initialDetails);
  const [eventHistoryData, setEventHistoryData] =
    useState<InventoryDynamicRow[]>();
  const [totalRecords, setTotalRecords] = useState(0);
  const [assetHistoryData, setAssetHistoryData] =
    useState<InventoryHistory[]>();
  const [assetHistoryRecord, setAssetHistoryRecord] = useState(0);
  const securityGroup = useSecurityGroup();
  const [activeTab, setActiveTab] = useState<string>("details");
  const canEdit =
    securityGroup?.asset?.permissions?.find(
      (permission) => permission.key === "editAssets"
    )?.value === true;

  useEffect(() => {
    const getEventOptions = async () => {
      if (!activeTeam.team_id) return;
      const { data } = await getEventDetails(supabaseClient, {
        teamId: activeTeam.team_id,
      });
      const eventSecurity = securityGroup.asset.filter.event;

      const filteredEvents = data.filter((event) =>
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
  }, [activeTeam.team_id, assetDetails, securityGroup]);

  const handleMenuClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const fetchAssetDetails = async () => {
    try {
      if (!activeTeam.team_id) return;
      const { data } = await getAssetSpreadsheetView(supabaseClient, {
        search: router.query.assetId as string,
        teamId: activeTeam.team_id,
      });
      setAssetDetails(data);
      setSelectedEventId(null);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const fetchEventsPanel = async (page: number) => {
    try {
      if (!assetId || !activeTeam.team_id) return;
      setIsloading(true);
      const { data, totalCount } = await getEventsHistoryData(supabaseClient, {
        assetID: assetId,
        page: page ? page : 0,
        limit: ROW_PER_PAGE,
        teamID: activeTeam.team_id,
      });

      setIsloading(false);
      setTotalRecords(totalCount);
      setEventHistoryData(data);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const fetchHistoryPanel = async (page: number) => {
    try {
      if (!assetId) return;
      setIsloading(true);
      const { data, totalCount } = await getAssetHistoryData(supabaseClient, {
        assetId,
        page: page ? page : 0,
        limit: ROW_PER_PAGE,
      });

      setIsloading(false);
      setAssetHistoryRecord(totalCount);
      setAssetHistoryData(data);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const fetchAllDetails = async () => {
    fetchAssetDetails();
    fetchEventsPanel(1);
    fetchHistoryPanel(1);
  };

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  return (
    <Container size="lg">
      {selectedEventId && (
        <EventFormModal
          setSelectedEventId={setSelectedEventId}
          eventId={selectedEventId}
          teamMemberList={teamMemberList}
          selectedRow={[assetDetails[0].inventory_request_id]}
          userId={user?.user_id || ""}
          handleFilterForms={fetchAllDetails}
        />
      )}
      <LoadingOverlay visible={isLoading} />
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
                        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/${detail.inventory_request_tag_id}/edit`
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

            <Grid>
              <Grid.Col span={12} xs={6}>
                <Box
                  style={{
                    width: "100%",
                    height: "300px", // Adjust the height as needed
                    backgroundColor: "gray",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid #ccc",
                  }}
                >
                  <Text color="dimmed" size="xl">
                    Not Available
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={12} xs={6}>
                <Table striped highlightOnHover withBorder withColumnBorders>
                  <tbody>
                    {/* Asset Information Section */}
                    <tr>
                      <td colSpan={2}>
                        <Text weight={600} align="center">
                          Asset Information
                        </Text>
                      </td>
                    </tr>
                    {Object.entries(detail)
                      .filter(
                        ([key, value]) => !excludedKeys.includes(key) && value
                      )
                      .reduce<JSX.Element[]>((acc, [key, value]) => {
                        if (
                          [
                            "inventory_request_tag_id",
                            "inventory_request_brand",
                            "inventory_request_model",
                            "inventory_request_site",
                            "inventory_request_location",
                            "inventory_request_department",
                          ].includes(key)
                        ) {
                          acc.push(
                            <tr key={key}>
                              <td>
                                <Text weight={500}>{formatLabel(key)}</Text>
                              </td>
                              <td>{value || "N/A"}</td>
                            </tr>
                          );
                        }
                        return acc;
                      }, [])}
                  </tbody>
                </Table>
              </Grid.Col>

              <Grid.Col span={12} xs={6}>
                <Table striped highlightOnHover withBorder withColumnBorders>
                  <tbody>
                    {/* Category Information Section */}
                    <tr>
                      <td colSpan={2}>
                        <Text weight={600} align="center">
                          Category Information
                        </Text>
                      </td>
                    </tr>
                    {Object.entries(detail)
                      .filter(
                        ([key, value]) => !excludedKeys.includes(key) && value
                      )
                      .reduce<JSX.Element[]>((acc, [key, value]) => {
                        if (
                          ["inventory_request_category"].includes(key) ||
                          !key.startsWith("inventory_request_")
                        ) {
                          acc.push(
                            <tr key={key}>
                              <td>
                                <Text weight={500}>{formatLabel(key)}</Text>
                              </td>
                              <td>{value ?? "N/A"}</td>
                            </tr>
                          );
                        }
                        return acc;
                      }, [])}
                  </tbody>
                </Table>
              </Grid.Col>

              <Grid.Col span={12} xs={6}>
                <Table striped highlightOnHover withBorder withColumnBorders>
                  <tbody>
                    <tr>
                      <td colSpan={2}>
                        <Text weight={600} align="center">
                          Status Information
                        </Text>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Text weight={500}>Created By</Text>
                      </td>
                      <td>
                        {detail.request_creator_first_name || "N/A"}{" "}
                        {detail.request_creator_last_name || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Text weight={500}>Assigned To</Text>
                      </td>
                      <td>
                        {detail.site_name || ""}
                        {`${detail.assignee_first_name || ""} ${detail.assignee_last_name || ""}`}
                      </td>
                    </tr>
                    {Object.entries(detail)
                      .filter(
                        ([key, value]) => !excludedKeys.includes(key) && value
                      )
                      .reduce<JSX.Element[]>((acc, [key, value]) => {
                        if (
                          [
                            "inventory_request_created_by",
                            "inventory_request_assigned_to",
                            "inventory_request_status",
                          ].includes(key)
                        ) {
                          acc.push(
                            <tr key={key}>
                              <td>
                                <Text weight={500}>{formatLabel(key)}</Text>
                              </td>
                              <td>
                                {key === "inventory_request_status" ? (
                                  <Badge
                                    sx={{
                                      backgroundColor:
                                        detail.inventory_request_status_color ||
                                        "gray",
                                      color: "#fff",
                                    }}
                                  >
                                    {value || "N/A"}
                                  </Badge>
                                ) : (
                                  value || "N/A"
                                )}
                              </td>
                            </tr>
                          );
                        }
                        return acc;
                      }, [])}
                  </tbody>
                </Table>
              </Grid.Col>
            </Grid>

            <Tabs
              mt="xl"
              defaultValue={activeTab}
              onTabChange={handleTabChange}
            >
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
                <EventPanel
                  activeTab={activeTab}
                  totalRecords={totalRecords}
                  eventHistoryData={eventHistoryData || []}
                  fetchEventsPanel={fetchEventsPanel}
                />
              </Tabs.Panel>
              <Tabs.Panel value="asset-link" mt="md">
                <AssetLinkPanel fetchHistory={fetchHistoryPanel} />
              </Tabs.Panel>

              <Tabs.Panel value="history" mt="md">
                <HistoryPanel
                  activeTab={activeTab}
                  fetchHistoryPanel={fetchHistoryPanel}
                  totalRecord={assetHistoryRecord}
                  asset_history={assetHistoryData || []}
                />
              </Tabs.Panel>
            </Tabs>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
