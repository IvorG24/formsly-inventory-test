import {
  getRequestStatusCount,
  getRequestStatusMonthlyCount,
} from "@/backend/api/get";
import { RadialChartData } from "@/components/Chart/RadialChart";
import { StackedBarChartDataType } from "@/components/Chart/StackedBarChart";
import { useFormList } from "@/stores/useFormStore";
import { useTeamMemberStore } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { DEFAULT_ON_SCROLL_LIMIT } from "@/utils/constant";
import { TeamMemberType } from "@/utils/types";
import { Box, Flex, Loader, LoadingOverlay, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import moment from "moment";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import RequestStatistics from "./RequestStatistics";
import RequestStatusTracker from "./RequestStatusTracker";
import RequestorTable from "./RequestorTable/RequestorTable";
import SignerTable from "./SignerTable";

export type RequestStatusDataType = {
  request_status: string;
  request_date_created: string;
};

export type RequestorAndSignerDataType = TeamMemberType & {
  request: RadialChartData[];
  total: number;
};

export type MonthlyRequestDataTypeWithTotal = {
  data: StackedBarChartDataType[];
  totalCount: number;
};

type OverviewProps = {
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  selectedForm: string | null;
  selectedDays: string | null;
  setIsFetching: Dispatch<SetStateAction<boolean>>;
};

const Overview = ({
  startDateFilter,
  endDateFilter,
  selectedForm,
  selectedDays,
  setIsFetching,
}: OverviewProps) => {
  const activeTeam = useActiveTeam();
  const formList = useFormList();
  const supabaseClient = useSupabaseClient();
  const teamMemberList = useTeamMemberStore();
  const [requestStatusCount, setRequestStatusCount] = useState<
    RadialChartData[] | null
  >(null);
  const [totalRequestCount, setTotalRequestCount] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState<
    StackedBarChartDataType[]
  >([]);
  const [isFetchingTotalRequests, setIsFetchingTotalRequests] = useState(false);
  const [isFetchingRequestor, setIsFetchingRequestor] = useState(false);
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [isFetchingMonthlyStatistics, setIsFetchingMonthlyStatistics] =
    useState(false);
  const [requestorList, setRequestorList] = useState<
    RequestorAndSignerDataType[]
  >([]);
  const [signerList, setSignerList] = useState<RequestorAndSignerDataType[]>(
    []
  );

  const [requestorOffset, setRequestorOffset] = useState(1);
  const [isRequestorFetchable, setIsRequestorFetchable] = useState(true);

  const [signerOffset, setSignerOffset] = useState(1);
  const [isSignerFetchable, setIsSignerFetchable] = useState(false);

  useEffect(() => {
    if (!startDateFilter || !endDateFilter) return;
    const fetchOverviewData = async (selectedForm: string, teamId: string) => {
      endDateFilter?.setHours(23, 59, 59, 999);

      try {
        setIsFetching(true);
        setIsFetchingTotalRequests(true);
        setIsFetchingRequestor(true);
        setIsFetchingSigner(true);
        setIsFetchingMonthlyStatistics(true);

        setIsRequestorFetchable(true);
        setRequestorOffset(1);
        setIsSignerFetchable(true);
        setSignerOffset(1);

        // set request status tracker
        const { requestStatusCountData, totalCount } =
          await getRequestStatusCount(supabaseClient, {
            formId: selectedForm,
            startDate: moment(startDateFilter).format(),
            endDate: moment(endDateFilter).format(),
            teamId: teamId,
          });

        setRequestStatusCount(requestStatusCountData);
        setTotalRequestCount(totalCount);
        setIsFetchingTotalRequests(false);

        // get monthly statistics
        const monthlyRequestData = await getRequestStatusMonthlyCount(
          supabaseClient,
          {
            formId: selectedForm,
            startDate: moment(startDateFilter).format(),
            endDate: moment(endDateFilter).format(),
            teamId: teamId,
          }
        );
        if (!monthlyRequestData) return;

        const chartData = monthlyRequestData.data.map((d) => ({
          ...d,
          month: moment(d.month).format("MMM"),
        }));
        setMonthlyChartData(chartData);
        setIsFetchingMonthlyStatistics(false);

        const formMatch = formList.find(
          (form) => form.form_id === selectedForm
        );

        if (!formMatch) return;
        // set requestor data
        const { data: requestorList, error: requestorListError } =
          await supabaseClient.rpc("fetch_dashboard_top_requestor", {
            input_data: {
              formId: selectedForm,
              startDate: moment(startDateFilter).format(),
              endDate: moment(endDateFilter).format(),
              page: 1,
              limit: DEFAULT_ON_SCROLL_LIMIT,
            },
          });
        if (requestorListError) throw requestorListError;
        setRequestorList(requestorList);
        setIsFetchingRequestor(false);

        // set signer data
        const { data: sigerList, error: signerListError } =
          await supabaseClient.rpc("fetch_dashboard_top_signer", {
            input_data: {
              formId: selectedForm,
              startDate: moment(startDateFilter).format(),
              endDate: moment(endDateFilter).format(),
              page: 1,
              limit: DEFAULT_ON_SCROLL_LIMIT,
            },
          });
        if (signerListError) throw signerListError;
        setSignerList(sigerList);
        setIsFetchingSigner(false);
      } catch (e) {
        notifications.show({
          message:
            "There was a problem while fetching the data. Please try again later",
          color: "red",
        });
      } finally {
        setIsFetching(false);
        setIsFetchingTotalRequests(false);
        setIsFetchingRequestor(false);
        setIsFetchingSigner(false);
        setIsFetchingMonthlyStatistics(false);
      }
    };
    if (selectedForm && activeTeam.team_id) {
      fetchOverviewData(selectedForm, activeTeam.team_id);
    }
  }, [
    selectedDays,
    selectedForm,
    startDateFilter,
    endDateFilter,
    activeTeam.team_id,
    teamMemberList,
  ]);

  const loadMoreRequestor = async (page: number) => {
    try {
      setIsFetchingRequestor(true);
      const { data: requestorList, error: requestorListError } =
        await supabaseClient.rpc("fetch_dashboard_top_requestor", {
          input_data: {
            formId: selectedForm,
            startDate: moment(startDateFilter).format(),
            endDate: moment(endDateFilter).format(),
            page: page,
            limit: DEFAULT_ON_SCROLL_LIMIT,
          },
        });
      if (requestorListError) throw requestorListError;
      setRequestorList((prev) => [...prev, ...requestorList]);
      if (requestorList.length < DEFAULT_ON_SCROLL_LIMIT) {
        setIsRequestorFetchable(false);
      }
    } catch (e) {
      notifications.show({
        message:
          "There was a problem while fetching the data. Please try again later",
        color: "red",
      });
    } finally {
      setIsFetchingRequestor(false);
    }
  };

  const loadMoreSigner = async (page: number) => {
    try {
      setIsFetchingSigner(true);
      const { data: signerList, error: signerListError } =
        await supabaseClient.rpc("fetch_dashboard_top_signer", {
          input_data: {
            formId: selectedForm,
            startDate: moment(startDateFilter).format(),
            endDate: moment(endDateFilter).format(),
            page: page,
            limit: DEFAULT_ON_SCROLL_LIMIT,
          },
        });
      if (signerListError) throw signerListError;
      setSignerList((prev) => [...prev, ...signerList]);
      if (signerList.length < DEFAULT_ON_SCROLL_LIMIT) {
        setIsSignerFetchable(false);
      }
    } catch (e) {
      notifications.show({
        message:
          "There was a problem while fetching the data. Please try again later",
        color: "red",
      });
    } finally {
      setIsFetchingSigner(false);
    }
  };

  return (
    <Stack w="100%" align="center" pos="relative">
      <Flex
        w="100%"
        align="flex-start"
        justify={{ xl: "space-between" }}
        gap="md"
        wrap="wrap"
      >
        <Box w={{ base: "100%", sm: 360 }} h={420} pos="relative">
          <LoadingOverlay
            visible={isFetchingTotalRequests}
            overlayBlur={0}
            overlayOpacity={0.5}
            loader={<Loader variant="bars" />}
          />
          <RequestStatusTracker
            data={requestStatusCount || []}
            totalRequestCount={totalRequestCount}
          />
        </Box>
        <Box w={{ base: "100%", sm: 300 }} h={420} pos="relative">
          <LoadingOverlay
            visible={isFetchingRequestor}
            overlayBlur={0}
            overlayOpacity={0.5}
            loader={<Loader variant="bars" />}
          />
          <RequestorTable
            totalRequestCount={totalRequestCount}
            requestorList={requestorList.length > 0 ? requestorList : []}
            loadMoreRequestor={loadMoreRequestor}
            isRequestorFetchable={isRequestorFetchable}
            requestorOffset={requestorOffset}
            setRequestorOffset={setRequestorOffset}
          />
        </Box>
        <Box w={{ base: "100%", sm: 300 }} h={420} pos="relative">
          <LoadingOverlay
            visible={isFetchingSigner}
            overlayBlur={0}
            overlayOpacity={0.5}
            loader={<Loader variant="bars" />}
          />
          <SignerTable
            signerList={signerList.length > 0 ? signerList : []}
            totalRequestCount={totalRequestCount}
            loadMoreSigner={loadMoreSigner}
            isSignerFetchable={isSignerFetchable}
            signerOffset={signerOffset}
            setSignerOffset={setSignerOffset}
          />
        </Box>
      </Flex>
      <Flex w="100%" align="flex-start" gap="xl" wrap="wrap">
        <Box sx={{ flex: 1 }} w="100%" pos="relative">
          <LoadingOverlay
            visible={isFetchingMonthlyStatistics}
            overlayBlur={0}
            overlayOpacity={0.5}
            loader={<Loader variant="bars" />}
          />
          <RequestStatistics
            monthlyChartData={monthlyChartData}
            totalRequestCount={totalRequestCount}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
          />
        </Box>
      </Flex>
    </Stack>
  );
};

export default Overview;
