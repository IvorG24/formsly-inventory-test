import { startCase } from "@/utils/string";
import { getHRAnalyticsStatusToColor } from "@/utils/styling";
import { DatasetChartResponse } from "@/utils/types";
import {
  Box,
  Center,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChartBar, IconSquareRoundedFilled } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import StackedBarChartResponse from "../Chart/StackedBarChartResponse";

type RequestStatisticsProps = {
  stepFilter: string;
  yLabel?: string;
  xLabel?: string;
  frequency?: string;
  monthLabel: string[];
  dataChartResponse: DatasetChartResponse[];
  isLoading: boolean;
};

const AnalyticsTable = ({
  stepFilter,
  monthLabel,
  yLabel,
  frequency,
  xLabel,
  dataChartResponse,
  isLoading,
}: RequestStatisticsProps) => {
  const statusList =
    stepFilter === "request"
      ? ["pending", "approved", "rejected"]
      : stepFilter === "job_offer"
      ? ["pending", "accepted", "rejected", "waiting for offer", "for pooling"]
      : stepFilter === "background_check"
      ? ["pending", "qualified", "not qualified"]
      : [
          "pending",
          "qualified",
          "not qualified",
          "waiting for schedule",
          "not responsive",
          "cancelled",
          "missed",
        ];

  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [filteredDatasets, setFilteredDatasets] =
    useState<DatasetChartResponse[]>(dataChartResponse);

  const filterChart = useCallback(
    (newFilter: string) => {
      setSelectedFilter((prevSelectedFilter) => {
        let updatedFilter = [...prevSelectedFilter];
        if (updatedFilter.includes(newFilter)) {
          updatedFilter = updatedFilter.filter(
            (oldFilter) => oldFilter !== newFilter
          );
        } else {
          updatedFilter.push(newFilter);
        }
        return updatedFilter;
      });
    },
    [setSelectedFilter]
  );

  useEffect(() => {
    setFilteredDatasets(() => {
      return dataChartResponse.map((dataset) => {
        if (selectedFilter.includes(dataset.label.toLowerCase())) {
          return {
            ...dataset,
            data: dataset.data.map(() => 0),
          };
        }
        return dataset;
      });
    });
  }, [selectedFilter, dataChartResponse]);

  return (
    <Paper w="100%" h="100%" p="lg" withBorder sx={{ flex: 1 }} pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Group position="apart">
          <Group spacing="xs" mb="sm">
            <Center c="green">
              <IconChartBar />
            </Center>
            <Title order={3}>Statistics</Title>
          </Group>
          <Group fz={14}>
            {statusList.map((status, idx) => (
              <Flex
                key={status + idx}
                gap={4}
                w="fit-content"
                onClick={() => filterChart(status.toLowerCase())}
                sx={{ cursor: "pointer" }}
              >
                <Box c={getHRAnalyticsStatusToColor(status)}>
                  <IconSquareRoundedFilled />
                </Box>
                <Text
                  weight={600}
                  strikethrough={selectedFilter.includes(status.toLowerCase())}
                >
                  {startCase(status)}
                </Text>
              </Flex>
            ))}
          </Group>
        </Group>
        <Box p="xs" w="100%">
          <StackedBarChartResponse
            label={monthLabel}
            datasets={filteredDatasets as DatasetChartResponse[]}
            xAxisLabel={`Filter ${frequency} ( ${xLabel} )`}
            yAxisLabel={yLabel}
            isWithTotal={true}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default AnalyticsTable;
