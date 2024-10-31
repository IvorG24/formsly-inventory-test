import { getHrAnalyticsData, getTeamGroupMember } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { frequencyOptions } from "@/utils/constant";
import { generateDateLabels } from "@/utils/functions";
import { capitalizeEachWord } from "@/utils/string";
import { getHRAnalyticsStatusToColor } from "@/utils/styling";
import { Dataset, DatasetChartResponse, OptionType } from "@/utils/types";
import {
  Alert,
  Container,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconNote } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AnalyticsTable from "./AnalyticsTable";
import AnalyticsTableFilter from "./AnalyticsTableFilter"; // Your filter form component

export type FilterChartValues = {
  memberFilter: string;
  stepFilter: string;
  startDate: Date | null;
  endDate: Date | null;
  frequencyFilter: string;
};

const stepOptions = [
  { label: "Application Information", value: "request" },
  { label: "Phone Interview", value: "hr_phone_interview" },
  { label: "Department Interview", value: "technical_interview_1" },
  { label: "Requestor Interview", value: "technical_interview_2" },
  { label: "Practical Test", value: "trade_test" },
  { label: "Background Check", value: "background_check" },
  { label: "Job Offer", value: "job_offer" },
];

const memberOptions = [{ label: "All", value: "All" }];

const Analytics = () => {
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();

  const [dataChart, setDataChart] = useState<DatasetChartResponse[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [groupMemberOptions, setMemberOptions] = useState<OptionType[]>([]);
  const [isLoading, setIsloading] = useState(false);
  const methods = useForm<FilterChartValues>({
    defaultValues: {
      memberFilter: memberOptions[0].value,
      stepFilter: stepOptions[0].value,
      frequencyFilter: "monthly",
      startDate: null,
      endDate: null,
    },
  });
  const { handleSubmit, watch } = methods;

  const stepValue = watch("stepFilter");
  const memberValue = watch("memberFilter");
  const frequencyValue = watch("frequencyFilter");

  const adjustDateRange = (frequency: string, rawData: Dataset) => {
    let startDate = methods.getValues("startDate");
    let endDate = methods.getValues("endDate");

    if (!startDate || !endDate) {
      startDate = new Date(rawData.dates[0]);
      endDate = new Date(rawData.dates[rawData.dates.length - 1]);
    }
    if (frequency === "daily") {
      return generateDateLabels(startDate, endDate, "daily");
    } else if (frequency === "monthly") {
      return generateDateLabels(startDate, endDate, "monthly");
    } else if (frequency === "yearly") {
      return generateDateLabels(startDate, endDate, "yearly");
    }
  };

  const handleFetchResponseTable = async (data: FilterChartValues) => {
    try {
      setIsloading(true);
      const rawData = await getHrAnalyticsData(supabaseClient, {
        filterChartValues: data,
      });

      const labels = adjustDateRange(data.frequencyFilter, rawData) || [];
      setMonthLabels(labels);

      const createDataset = (
        label: string,
        rawData: (string | number)[] = [],
        status: string
      ) => ({
        label,
        data: rawData.map((item) => parseInt(item as string, 10)),
        backgroundColor: [getHRAnalyticsStatusToColor(status) || "blue"],
        borderColor: [getHRAnalyticsStatusToColor(status) || "blue"],
        borderWidth: 2,
      });

      const addDatasetIfAvailable = (
        datasetArray: DatasetChartResponse[],
        label: string,
        dataKey: (string | number)[] | undefined,
        status: string
      ) => {
        if (dataKey && dataKey.length > 0) {
          datasetArray.push(createDataset(label, dataKey, status));
        }
      };

      const datasetChartResponse: DatasetChartResponse[] = [];
      addDatasetIfAvailable(
        datasetChartResponse,
        "Pending",
        rawData?.pending_counts,
        "pending"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Approved",
        rawData?.approved_counts,
        "approved"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Qualified",
        rawData?.qualified_counts,
        "qualified"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Accepted",
        rawData?.accepted_counts,
        "accepted"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Rejected",
        rawData?.rejected_counts,
        "rejected"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Not Qualified",
        rawData?.not_qualified_counts,
        "not qualified"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Waiting For Schedule",
        rawData?.waiting_for_schedule_counts,
        "waiting for schedule"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Not Responsive",
        rawData?.not_responsive_counts,
        "not responsive"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Cancelled",
        rawData?.cancelled_counts,
        "cancelled"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Waiting For Offer",
        rawData?.waiting_for_offer_counts,
        "waiting for offer"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "For Pooling",
        rawData?.for_pooling_counts,
        "for pooling"
      );
      addDatasetIfAvailable(
        datasetChartResponse,
        "Missed",
        rawData?.missed_counts,
        "missed"
      );

      setDataChart(datasetChartResponse);
      setIsloading(false);
    } catch (e) {
      setIsloading(false);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    const fetchTeamMemberList = async () => {
      if (!activeTeam.team_id) return;
      const data = await getTeamGroupMember(supabaseClient, {
        groupId: "a691a6ca-8209-4b7a-8f48-8a4582bbe75a",
      });

      const teamMemberList = data.map((member) => ({
        label: capitalizeEachWord(
          `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`
        ),
        value: member.team_member_id,
      }));
      setMemberOptions([...memberOptions, ...teamMemberList]);
    };
    fetchTeamMemberList();
    handleFetchResponseTable(methods.getValues());
  }, [activeTeam.team_id, frequencyValue]);

  const selectedStepLabel = stepOptions.find(
    (option) => option.value === stepValue
  )?.label;
  const selectedMemberLabel = groupMemberOptions.find(
    (option) => option.value === memberValue
  )?.label;
  const selectedFrequency = frequencyOptions.find(
    (option) => option.value === frequencyValue
  )?.label;

  const handleSubmitFilter = (data: FilterChartValues) => {
    if (!data.startDate || !data.endDate) {
      notifications.show({
        message: "Start date and End date are required",
        color: "red",
      });
      return;
    }
    const endDate = new Date(data.endDate ? data.endDate : new Date());
    if (data.frequencyFilter === "daily") {
      endDate.setHours(23, 59, 59, 999);
    } else if (data.frequencyFilter === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    } else if (data.frequencyFilter === "yearly") {
      endDate.setMonth(11);
      endDate.setDate(31);
      endDate.setHours(23, 59, 59, 999);
    }
    data.endDate = new Date(endDate.toISOString());

    handleFetchResponseTable(data);
  };

  return (
    <Container p={0}>
      <LoadingOverlay visible={isLoading} />
      <Stack spacing="sm">
        <Title order={3} mb="sm">
          HR Analytics
        </Title>
        <Alert title="Note!" icon={<IconNote size={16} />}>
          <Text>
            To access the date range, click the &quot;Fetch Data&quot; button.
            Make sure you have selected the appropriate filters before
            proceeding. If you encounter any issues, please refresh the page or
            contact support for assistance.
          </Text>
        </Alert>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleSubmitFilter)}>
            <AnalyticsTableFilter
              handleFetchResponseTable={handleFetchResponseTable}
              memberOptions={groupMemberOptions}
              stepOptions={stepOptions}
              isLoading={isLoading}
            />
          </form>
        </FormProvider>
        <AnalyticsTable
          frequency={selectedFrequency}
          xLabel={selectedMemberLabel}
          yLabel={selectedStepLabel}
          monthLabel={monthLabels}
          dataChartResponse={dataChart}
          stepFilter={stepValue}
        />
      </Stack>
    </Container>
  );
};

export default Analytics;
