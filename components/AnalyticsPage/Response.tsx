import { getHRApplicantAnalytics } from "@/backend/api/get";
import HorizontalBarChart from "@/components/Chart/HorizontalBarChart";
import VerticalBarChart from "@/components/Chart/VerticalBarChart";
import { DAYS_OPTIONS } from "@/utils/constant";
import { parseDataForChart, safeParse } from "@/utils/functions";
import { HRAnalyticsData } from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Flex,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCalendarEvent, IconDatabase } from "@tabler/icons-react";
import { ChartData } from "chart.js";
import moment from "moment";
import { useState } from "react";

type Props = {
  data: HRAnalyticsData;
};

const Response = ({ data: initialData }: Props) => {
  const supabaseClient = useSupabaseClient();
  const [data, setData] = useState(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string | null>(null);
  const [currentDataLabel, setCurrentDataLabel] = useState("All time");
  const currentDate = moment().toDate();
  const firstDayOfCurrentYear = moment({
    year: moment().year(),
    month: 0,
    day: 1,
  }).toDate();

  const [startDateFilter, setStartDateFilter] = useState<Date | null>(
    firstDayOfCurrentYear
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(currentDate);

  const handleFetchAnalyticsData = async () => {
    try {
      setIsFetching(true);
      const startDate = selectedDays
        ? moment(startDateFilter).format()
        : undefined;
      const endDate = selectedDays ? moment(endDateFilter).format() : undefined;
      const newData = await getHRApplicantAnalytics(supabaseClient, {
        startDate,
        endDate,
      });
      setData(newData);
      setCurrentDataLabel(
        `${moment(startDateFilter).format("MMM DD, YYYY")} to ${moment(
          endDateFilter
        ).format("MMM DD, YYYY")}`
      );
    } catch (error) {
      notifications.show({
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSelectedDaysOnChange = (value: string | null) => {
    if (value && value !== "custom") {
      const currDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currDate.getDate() - Number(value));

      setStartDateFilter(startDate);
      setEndDateFilter(currDate);
    }
    setSelectedDays(value);
  };

  return (
    <Container p={0}>
      <Stack spacing="sm">
        <Title order={3} mb="sm">
          Human Resources Application Information
        </Title>
        <Flex gap="sm" align="flex-end">
          <Select
            label="Date Created"
            placeholder="Select days"
            data={DAYS_OPTIONS}
            value={selectedDays}
            onChange={handleSelectedDaysOnChange}
            searchable
            disabled={isFetching}
          />

          {selectedDays === "custom" && (
            <>
              <DatePickerInput
                label="Start Date"
                placeholder="Select a start date"
                value={startDateFilter}
                onChange={setStartDateFilter}
                icon={<IconCalendarEvent size={16} />}
                dropdownType="popover"
                minDate={new Date("2023-01-01")}
                maxDate={currentDate}
                valueFormat="YYYY-MM-DD"
              />
              <DatePickerInput
                label="End Date"
                placeholder="Select a end date"
                value={endDateFilter}
                onChange={setEndDateFilter}
                icon={<IconCalendarEvent size={16} />}
                dropdownType="popover"
                minDate={startDateFilter || new Date()}
                maxDate={currentDate}
                valueFormat="YYYY-MM-DD"
              />
            </>
          )}
          <Button
            ml="sm"
            leftIcon={<IconDatabase size={18} />}
            onClick={handleFetchAnalyticsData}
            disabled={isFetching}
          >
            Fetch Data
          </Button>
        </Flex>
        <Text my="sm" fw={600}>
          {`Showing data from: ${currentDataLabel}`}
        </Text>
        {data ? (
          <Flex direction="column" gap="lg" wrap="wrap">
            <Paper p="md" withBorder>
              <Title order={5} mb="sm">
                Candidate Referral Source
              </Title>
              <Box w="100%" mih={300}>
                <VerticalBarChart
                  data={
                    parseDataForChart({
                      data: data.candidate_referral_source.map((d) => ({
                        ...d,
                        request_response: safeParse(d.request_response),
                      })),
                      labelPropKey: "request_response",
                      valuePropKey: "count",
                      datasetLabel: `Candidate Referral Source`,
                      colorPalette: [
                        "#339af0",
                        "#cc5de8",
                        "#f06595",
                        "#ff6b6b",
                        "#20c997",
                        "#fcc419",
                      ],
                    }) as ChartData<"bar">
                  }
                />
              </Box>
            </Paper>
            <Paper p="md" withBorder>
              <Title order={5} mb="sm">
                Top 10 Most Applied Positions
              </Title>
              <Box w="100%" mih={300}>
                <HorizontalBarChart
                  data={
                    parseDataForChart({
                      data: data.most_applied_position.map((d) => ({
                        ...d,
                        request_response: safeParse(d.request_response),
                      })),
                      labelPropKey: "request_response",
                      valuePropKey: "count",
                      datasetLabel: `Most Applied Positions`,
                      colorPalette: [
                        "#339af0",
                        "#cc5de8",
                        "#f06595",
                        "#ff6b6b",
                        "#20c997",
                        "#fcc419",
                      ],
                    }) as ChartData<"bar">
                  }
                />
              </Box>
            </Paper>
            <Paper p="md" withBorder>
              <Title order={5} mb="sm">
                Applicant Age Bracket
              </Title>
              <Box w="100%" mih={300}>
                <VerticalBarChart
                  data={
                    parseDataForChart({
                      data: data.applicant_age_bracket.map((d) => ({
                        ...d,
                        request_response: safeParse(d.request_response),
                      })),
                      labelPropKey: "request_response",
                      valuePropKey: "count",
                      datasetLabel: `Age Bracket`,
                      colorPalette: [
                        "#339af0",
                        "#cc5de8",
                        "#f06595",
                        "#ff6b6b",
                        "#20c997",
                        "#fcc419",
                      ],
                    }) as ChartData<"bar">
                  }
                />
              </Box>
            </Paper>
          </Flex>
        ) : null}
      </Stack>
    </Container>
  );
};

export default Response;
