import {
  getAssetHistoryData,
  getAssetSpreadsheetView,
  getEventsHistoryData,
} from "@/backend/api/get";
import { useEmployeeList } from "@/stores/useEmployeeStore";
import { useEventList } from "@/stores/useEventStore";
import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
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
  Box,
  Button,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Menu,
  Paper,
  Tabs,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconDotsVertical, IconEdit } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import EventFormModal from "../FormModal/EventFormModal";
import AdditionalDetailsPanel from "./DetailsPanel/AdditionalDetailsPanel";
import AssetLinkPanel from "./DetailsPanel/AssetLinkPanel";
import EventPanel from "./DetailsPanel/EventPanel";
import HistoryPanel from "./DetailsPanel/HistoryPanel";
import MaintenancePanel from "./DetailsPanel/MaintenancePanel";
import WarrantyPanel from "./DetailsPanel/WarrantyPanel";
import ImageUpload from "./ImageUpload/ImageUpload";
import AssetInformationTable from "./InformationTable/AssetInformationTable";
import CategoryInformationTable from "./InformationTable/CategoryInformationTable";
import StatusInformationTable from "./InformationTable/StatusInformationTable";

type Props = {
  asset_details: InventoryListType[];
};

export type historyFilterForms = {
  event: string[];
  date: string;
  actionBy: string[];
  isAscendingSort: boolean;
};

const AssetInventoryDetailsPage = ({
  asset_details: initialDetails,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const user = useUserProfile();
  const router = useRouter();
  const eventList = useEventList();

  const securityGroup = useSecurityGroup();
  const employeeList = useEmployeeList();
  const assetId = router.query.assetId as string;
  const [isLoading, setIsloading] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] =
    useState<InventoryListType[]>(initialDetails);

  const [eventHistoryData, setEventHistoryData] =
    useState<InventoryDynamicRow[]>();
  const [totalRecords, setTotalRecords] = useState(0);
  const [assetHistoryData, setAssetHistoryData] =
    useState<InventoryHistory[]>();
  const [assetHistoryRecord, setAssetHistoryRecord] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("details");

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_history_date_created",
    direction: "desc",
  });

  const canEdit =
    securityGroup?.asset?.permissions?.find(
      (permission) => permission.key === "editAssets"
    )?.value === true;

  const statusList: OptionType[] = [
    ...eventList.map((event) => ({
      label: event.event_name,
      value: event.event_name.toUpperCase(),
    })),
    { label: "Link As Child", value: "LINK AS CHILD" },
    { label: "Link As Parent", value: "LINK AS PARENT" },
    { label: "Update", value: "UPDATE" },
  ];

  const handleMenuClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const filterFormMethods = useForm<historyFilterForms>({
    defaultValues: {
      event: [],
      date: "",
      actionBy: [],
    },
    mode: "onChange",
  });
  const { handleSubmit, getValues } = filterFormMethods;

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

      const { actionBy, event, date, isAscendingSort } = getValues();
      const { data, totalCount } = await getAssetHistoryData(supabaseClient, {
        assetId,
        page: page ? page : 0,
        limit: ROW_PER_PAGE,
        actionBy: actionBy ?? [],
        event: event ?? [],
        date: date ?? "",
        columnAccessor: sortStatus.columnAccessor,
        isAscendingSort: isAscendingSort,
      });

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

  const handleTabChange = (tabValue: string) => setActiveTab(tabValue);

  const handleFilterForms = async () => {
    try {
      await fetchHistoryPanel(1);
    } catch (e) {}
  };

  // Handle image upload

  return (
    <Container size="lg">
      {selectedEventId && (
        <EventFormModal
          setSelectedEventId={setSelectedEventId}
          eventId={selectedEventId}
          teamMemberList={employeeList}
          selectedRow={[assetDetails[0].inventory_request_id]}
          userId={user?.user_id || ""}
          handleFilterForms={fetchAllDetails}
        />
      )}
      <LoadingOverlay visible={isLoading} />
      <Paper shadow="xl" p="lg" withBorder>
        {assetDetails.map((detail, idx) => (
          <Box key={idx}>
            <Group position="apart" mb="md">
              <Title order={3}>{detail.inventory_request_name}</Title>
              <Group>
                {canEdit && (
                  <Button
                    variant="outline"
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
                    {eventList
                      .filter((option) => {
                        const shouldHide =
                          initialDetails[0].inventory_request_status ===
                          option.event_status;

                        return !shouldHide;
                      })
                      .map((event) => (
                        <Menu.Item
                          key={event.event_id}
                          onClick={() => handleMenuClick(event.event_id)}
                        >
                          {event.event_name}
                        </Menu.Item>
                      ))}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <Grid>
              <ImageUpload
                tagId={assetId}
                imageUrl={detail.inventory_request_image_url}
              />
              <AssetInformationTable asset_details={detail} />
              <CategoryInformationTable asset_details={detail} />
              <StatusInformationTable asset_details={detail} />
            </Grid>

            <Tabs
              mt="xl"
              defaultValue={activeTab}
              onTabChange={handleTabChange}
            >
              <Tabs.List>
                {[
                  { value: "details", label: "Additional Details" },
                  { value: "events", label: "Events" },
                  { value: "asset-link", label: "Asset Link" },
                  { value: "maintenance", label: "Maintenance" },
                  { value: "warranty", label: "Warranty" },
                  { value: "history", label: "History" },
                ].map((tab) => (
                  <Tabs.Tab key={tab.value} value={tab.value}>
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              {[
                {
                  value: "details",
                  component: <AdditionalDetailsPanel detail={detail} />,
                },
                {
                  value: "events",
                  component: (
                    <EventPanel
                      {...{
                        activeTab,
                        totalRecords,
                        eventHistoryData: eventHistoryData || [],
                        fetchEventsPanel,
                      }}
                    />
                  ),
                },
                {
                  value: "asset-link",
                  component: (
                    <AssetLinkPanel
                      activeTab={activeTab}
                      relationType={detail.relationship_type}
                      fetchHistory={fetchHistoryPanel}
                    />
                  ),
                },
                {
                  value: "maintenance",
                  component: (
                    <MaintenancePanel
                      fetchHistory={fetchHistoryPanel}
                      activeTab={activeTab}
                    />
                  ),
                },
                {
                  value: "warranty",
                  component: (
                    <WarrantyPanel
                      fetchHistory={fetchHistoryPanel}
                      activeTab={activeTab}
                    />
                  ),
                },
                {
                  value: "history",
                  component: (
                    <FormProvider {...filterFormMethods}>
                      <form onSubmit={handleSubmit(handleFilterForms)}>
                        <HistoryPanel
                          {...{
                            setSortStatus,
                            sortStatus,
                            statusList,
                            activeTab,
                            fetchHistoryPanel,
                            totalRecord: assetHistoryRecord,
                            asset_history: assetHistoryData || [],
                          }}
                        />
                      </form>
                    </FormProvider>
                  ),
                },
              ].map((panel) => (
                <Tabs.Panel key={panel.value} value={panel.value} mt="md">
                  {panel.component}
                </Tabs.Panel>
              ))}
            </Tabs>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default AssetInventoryDetailsPage;
