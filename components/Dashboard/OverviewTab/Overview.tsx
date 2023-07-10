import { RequestDashboardOverviewData } from "@/utils/types";
import { Box, Flex, Stack } from "@mantine/core";
import { lowerCase } from "lodash";
import RequestStatistics from "./RequestStatistics";
import RequestStatusTracker from "./RequestStatusTracker";
import RequestorTable from "./RequestorTable/RequestorTable";
import SignerTable from "./SignerTable";

export type RequestStatusDataType = {
  request_status: string;
  request_date_created: string;
};

type OverviewProps = {
  requestList: RequestDashboardOverviewData[];
  requestCount: number;
  requestStatusData: RequestStatusDataType[];
};

const status = ["Pending", "Approved", "Rejected", "Canceled"];

const Overview = ({
  requestList,
  requestCount,
  requestStatusData,
}: OverviewProps) => {
  // get request status meter data
  const requestStatusChartData = status.map((status) => {
    const requestMatch =
      requestStatusData.filter(
        (request) => lowerCase(request.request_status) === lowerCase(status)
      ) || [];

    const meterData = {
      label: status,
      value: requestMatch.length,
      totalCount: requestCount,
    };

    return meterData;
  });

  console.log(requestStatusChartData);

  return (
    <Stack w="100%" align="center">
      <Flex
        w="100%"
        align="flex-start"
        justify={{ xl: "space-between" }}
        gap="md"
        wrap="wrap"
      >
        <Box w={{ base: "100%", sm: 360 }} h={450}>
          <RequestStatusTracker data={requestStatusChartData} />
        </Box>
        <Box w={{ base: "100%", sm: 300 }} h={450}>
          <RequestorTable
            requestList={requestList}
            totalRequest={requestCount}
          />
        </Box>
        <Box w={{ base: "100%", sm: 300 }} h={450}>
          <SignerTable requestList={requestList} />
        </Box>
      </Flex>
      <Flex w="100%" align="flex-start" gap="xl" wrap="wrap">
        <Box sx={{ flex: 1 }} w="100%">
          <RequestStatistics requestStatusData={requestStatusData} />
        </Box>
      </Flex>
    </Stack>
  );
};

export default Overview;
