import { startCase } from "@/utils/string";
import { getStatusToColorForCharts } from "@/utils/styling";
import { DatasetChartResponse } from "@/utils/types";
import {
  Box,
  Center,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChartBar, IconSquareRoundedFilled } from "@tabler/icons-react";
import { useState } from "react";
import StackedBarChartResponse from "../Chart/StackedBarChartResponse";

type RequestStatisticsProps = {
  stepFilter: string;
  yLabel?: string;
  xLabel?: string;
  frequency?: string;
  monthLabel: string[];
  dataChartResponse: DatasetChartResponse[];
};

const ResponseTable = ({
  stepFilter,
  monthLabel,
  yLabel,
  frequency,
  xLabel,
  dataChartResponse,
}: RequestStatisticsProps) => {
  const statusList =
    stepFilter === "request"
      ? ["approved", "rejected", "pending"]
      : stepFilter === "job_offer"
        ? [
            "accepted",
            "rejected",
            "pending",
            "waiting for offer",
            "for pooling",
          ]
        : stepFilter === "background_check"
          ? ["pending", "qualified", "not qualified"]
          : [
              "qualified",
              "pending",
              "not qualified",
              "not responsive",
              "waiting for schedule",
              "cancelled",
            ];

  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);

  const filterChart = (newFilter: string) => {
    let updatedFilter = selectedFilter;
    if (selectedFilter.includes(newFilter)) {
      updatedFilter = selectedFilter.filter(
        (oldFilter) => oldFilter !== newFilter
      );
    } else {
      updatedFilter.push(newFilter);
    }
    setSelectedFilter(updatedFilter);
  };

  return (
    <Paper w="100%" h="100%" p="lg" withBorder sx={{ flex: 1 }}>
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
        <Box p="xs" w="100%">
          <StackedBarChartResponse
            label={monthLabel}
            datasets={dataChartResponse as DatasetChartResponse[]}
            xAxisLabel={`Filter ${frequency} ( ${xLabel} )`}
            yAxisLabel={yLabel}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default ResponseTable;
