import { getAdminTicketAnalytics, getCurrentDate } from "@/backend/api/get";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  INTERVAL_OPTIONS,
  TICKET_ADMIN_ANALYTICS_LIMIT,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { startCase } from "@/utils/string";
import { getAvatarColor, getStatusToColorForCharts } from "@/utils/styling";
import { TeamMemberType, TicketCategoryTableRow } from "@/utils/types";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  MultiSelect,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconChartBar,
  IconSquareRoundedFilled,
} from "@tabler/icons-react";
import moment from "moment";
import { forwardRef, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SelecteItemType } from "../TeamPage/CreateTeamProject";
import StackedBarChart, { StackedBarChartDataType } from "./StackedBarChart";

const SelectItem = forwardRef<HTMLDivElement, SelecteItemType>(
  ({ label, member, ...others }: SelecteItemType, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap>
        <Avatar
          size="xs"
          src={member.team_member_user.user_avatar}
          color={getAvatarColor(
            Number(`${member.team_member_user.user_id.charCodeAt(0)}`)
          )}
        >
          {(
            member.team_member_user.user_first_name[0] +
            member.team_member_user.user_last_name[0]
          ).toUpperCase()}
        </Avatar>

        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )
);

type FormType = {
  admin: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  ticketCategory: string[];
};

type AnalyticsReturnType = {
  startDate: string;
  endDate: string;
  closedCount: number;
  underReviewCount: number;
  incorrectCount: number;
};

type IntervalType = { startDate: string; endDate: string };

type Props = {
  ticketCategoryList: TicketCategoryTableRow[];
};

const TicketAdminAnalytics = ({ ticketCategoryList }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamAdminList = useTeamMemberList("ADMIN");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<TeamMemberType | null>(
    null
  );
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [chartData, setChartData] = useState<StackedBarChartDataType[]>([]);
  const [filteredChartData, setFilteredChartData] = useState<
    StackedBarChartDataType[]
  >([]);
  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [intervalList, setIntervalList] = useState<IntervalType[]>([]);

  useEffect(() => {
    const fetchServerCurrentDate = async () => {
      const data = await getCurrentDate(supabaseClient);
      setCurrentDate(data);
    };
    fetchServerCurrentDate();
  }, []);

  const {
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    watch,
  } = useForm<FormType>();

  const onSubmit = async ({
    admin,
    startDate,
    endDate,
    interval,
    ticketCategory,
  }: FormType) => {
    setIsAnalyzing(true);
    setCurrentPage(1);
    try {
      const intervalList: IntervalType[] = [];
      let currentStartDate = moment(startDate).format("MM/DD/YYYY");
      const formattedEndDate = moment(endDate).format("MM/DD/YYYY");

      while (currentStartDate < moment(endDate).format("MM/DD/YYYY")) {
        let currentEndDate = "";
        switch (interval) {
          case "daily":
            currentEndDate = moment(currentStartDate)
              .add(1, "day")
              .format("MM/DD/YYYY");
            break;
          case "weekly":
            currentEndDate = moment(currentStartDate)
              .add(1, "week")
              .format("MM/DD/YYYY");
            break;
          case "monthly":
            currentEndDate = moment(currentStartDate)
              .add(1, "month")
              .format("MM/DD/YYYY");
            break;
          case "yearly":
            currentEndDate = moment(currentStartDate)
              .add(1, "year")
              .format("MM/DD/YYYY");
            break;
        }
        intervalList.push({
          startDate: currentStartDate,
          endDate:
            moment(currentEndDate).diff(formattedEndDate) > 0
              ? formattedEndDate
              : currentEndDate,
        });

        currentStartDate = currentEndDate;
        if (moment(currentEndDate).diff(formattedEndDate) > 0) break;
      }
      setIntervalList(intervalList);
      await fetchAnalyticsData(admin, ticketCategory, interval, intervalList);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filterChart = (
    newFilter: string | null,
    thisChartData?: StackedBarChartDataType[]
  ) => {
    let updatedFilter = selectedFilter;
    if (newFilter) {
      if (selectedFilter.includes(newFilter)) {
        updatedFilter = selectedFilter.filter(
          (oldFilter) => oldFilter !== newFilter
        );
      } else {
        updatedFilter.push(newFilter);
      }
      setSelectedFilter(updatedFilter);
    }

    const temp: StackedBarChartDataType[] = JSON.parse(
      JSON.stringify(thisChartData ?? chartData)
    );
    const newChartData = temp.map((d) => {
      updatedFilter.forEach((filter) => {
        switch (filter) {
          case "CLOSED":
            d.closed = 0;
            break;
          case "INCORRECT":
            d.incorrect = 0;
            break;
          case "UNDER REVIEW":
            d.underReview = 0;
            break;

          default:
            break;
        }
      });

      return d;
    });
    setFilteredChartData(newChartData);
  };

  const fetchAnalyticsData = async (
    admin: string,
    ticketCategory: string[],
    interval: string,
    intervalList: IntervalType[],
    page = 1
  ) => {
    const start = (page - 1) * TICKET_ADMIN_ANALYTICS_LIMIT;
    const data: AnalyticsReturnType[] = await getAdminTicketAnalytics(
      supabaseClient,
      {
        adminTeamMemberId: admin,
        intervalList: intervalList.slice(
          start,
          start + TICKET_ADMIN_ANALYTICS_LIMIT
        ),
        ticketCategoryIdList: ticketCategory,
      }
    );

    const formattedData = data.map((analytics) => {
      return {
        interval: `${analytics.startDate}${
          interval !== "daily" ? ` - ${analytics.endDate}` : ""
        }`,
        closed: analytics.closedCount,
        incorrect: analytics.incorrectCount,
        underReview: analytics.underReviewCount,
      };
    });

    setChartData(formattedData);
    filterChart(null, formattedData);
  };

  const watchStartDate = watch("startDate");

  return (
    <Container p={0}>
      <Title color="dimmed" order={2}>
        Ticket Admin Analytics
      </Title>
      <Paper p="xl" shadow="xs" mt="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <Controller
              control={control}
              name={"admin"}
              rules={{
                required: "Admin is required.",
              }}
              render={({ field: { value, onChange } }) => (
                <Select
                  data={teamAdminList.map((admin) => {
                    return {
                      label: `${admin.team_member_user.user_first_name} ${admin.team_member_user.user_last_name}`,
                      value: admin.team_member_id,
                      member: admin,
                    };
                  })}
                  placeholder="Select Admin"
                  label="Admin"
                  clearable
                  searchable
                  onChange={(value) => {
                    const admin = teamAdminList.find(
                      (admin) => admin.team_member_id === value
                    );
                    setSelectedAdmin(admin ?? null);
                    onChange(value);
                  }}
                  value={value}
                  error={errors.admin?.message}
                  itemComponent={SelectItem}
                  icon={
                    selectedAdmin && (
                      <Avatar
                        size="xs"
                        src={selectedAdmin?.team_member_user.user_avatar}
                        color={getAvatarColor(
                          Number(
                            `${selectedAdmin.team_member_user.user_id.charCodeAt(
                              0
                            )}`
                          )
                        )}
                      >
                        {(
                          selectedAdmin.team_member_user.user_first_name[0] +
                          selectedAdmin.team_member_user.user_last_name[0]
                        ).toUpperCase()}
                      </Avatar>
                    )
                  }
                  disabled={isAnalyzing}
                />
              )}
            />
            <Flex gap="sm" align="center" wrap="wrap">
              <Controller
                control={control}
                name={"startDate"}
                rules={{
                  required: "Date is required.",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePickerInput
                    label="Start Date"
                    placeholder="Select a start date"
                    value={value}
                    onChange={onChange}
                    icon={<IconCalendarEvent size={16} />}
                    dropdownType="popover"
                    maxDate={currentDate}
                    disabled={isAnalyzing}
                    valueFormat="YYYY-MM-DD"
                    sx={{ flex: 1 }}
                    miw={200}
                  />
                )}
              />
              <Controller
                control={control}
                name={"endDate"}
                rules={{
                  required: "Date is required.",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePickerInput
                    label="End Date"
                    placeholder="Select a end date"
                    value={value}
                    onChange={onChange}
                    icon={<IconCalendarEvent size={16} />}
                    dropdownType="popover"
                    disabled={isAnalyzing}
                    minDate={watchStartDate || new Date()}
                    maxDate={currentDate}
                    valueFormat="YYYY-MM-DD"
                    sx={{ flex: 1 }}
                    miw={200}
                  />
                )}
              />
            </Flex>
            <Controller
              control={control}
              name={"interval"}
              rules={{
                required: "Interval is required.",
              }}
              render={({ field: { value, onChange } }) => (
                <Select
                  data={INTERVAL_OPTIONS}
                  placeholder="Select interval"
                  label="Interval"
                  onChange={onChange}
                  value={value}
                  disabled={isAnalyzing}
                  error={errors.interval?.message}
                  sx={{ flex: 1 }}
                  miw={200}
                />
              )}
            />
            <Controller
              control={control}
              name={"ticketCategory"}
              rules={{
                required: "Ticket Category is required.",
              }}
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  data={ticketCategoryList.map((category) => {
                    return {
                      label: category.ticket_category,
                      value: category.ticket_category_id,
                    };
                  })}
                  placeholder="Select Ticket Category"
                  label="Ticket Category"
                  onChange={onChange}
                  value={value}
                  disabled={isAnalyzing}
                  error={errors.ticketCategory?.message}
                  sx={{ flex: 1 }}
                  miw={200}
                  clearable
                  searchable
                />
              )}
            />
            <Button
              type="submit"
              sx={{ alignSelf: "flex-end" }}
              loading={isAnalyzing}
              disabled={!activeTeam.team_id}
            >
              Analyze
            </Button>
          </Stack>
        </form>
      </Paper>

      <Paper p="xl" shadow="xs" mt="xl" pos="relative">
        <LoadingOverlay visible={isAnalyzing} overlayBlur={2} />
        <Box p="xs" w="100%">
          <Group position="apart">
            <Group spacing="xs" mb="sm">
              <Center c="green">
                <IconChartBar />
              </Center>
              <Title order={3}>Admin Analytics</Title>
            </Group>
            <Group fz={14}>
              {["CLOSED", "INCORRECT", "UNDER REVIEW"].map((status, idx) => (
                <Flex
                  key={status + idx}
                  gap={4}
                  w="fit-content"
                  onClick={() => filterChart(status)}
                  sx={{ cursor: "pointer" }}
                >
                  <Box c={getStatusToColorForCharts(status)}>
                    <IconSquareRoundedFilled />
                  </Box>
                  <Text
                    weight={600}
                    strikethrough={selectedFilter.includes(status)}
                  >
                    {startCase(status)}
                  </Text>
                </Flex>
              ))}
            </Group>
          </Group>
          {filteredChartData.length ? (
            <StackedBarChart
              data={filteredChartData}
              xAxisLabel="Date"
              yAxisLabel="No. of Tickets"
            />
          ) : (
            <Alert icon={<IconAlertCircle size="1rem" />} color="blue">
              Select an admin that you need to analyze.
            </Alert>
          )}
          {Math.ceil(intervalList.length / TICKET_ADMIN_ANALYTICS_LIMIT) >
            1 && (
            <Flex justify="flex-end">
              <Pagination
                value={currentPage}
                onChange={async (value) => {
                  await fetchAnalyticsData(
                    getValues("admin"),
                    getValues("ticketCategory"),
                    getValues("interval"),
                    intervalList,
                    value
                  );
                  setCurrentPage(value);
                }}
                total={Math.ceil(
                  intervalList.length / TICKET_ADMIN_ANALYTICS_LIMIT
                )}
                mt="xl"
              />
            </Flex>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TicketAdminAnalytics;
SelectItem.displayName = "SelectItem";
