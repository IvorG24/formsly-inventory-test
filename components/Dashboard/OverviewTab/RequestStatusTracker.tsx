import RadialChart, { RadialChartData } from "@/components/Chart/RadialChart";
import { getStatusToColorForCharts } from "@/utils/styling";
import {
  Box,
  Center,
  Flex,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import { IconSquareRoundedFilled, IconTrophyFilled } from "@tabler/icons-react";

type RequestStatusTrackerProps = {
  data: RadialChartData[];
  totalRequestCount: number;
};

const getPercentage = (value: number, total: number) => {
  const percentage = (value / total) * 100;
  return !isNaN(percentage) ? `${percentage.toFixed(0)}%` : `0%`;
};

const useStyles = createStyles(() => ({
  withBorderBottom: {
    borderBottom: "0.0625rem solid #dee2e6",
  },
}));

const RequestStatusTracker = ({
  data,
  totalRequestCount,
}: RequestStatusTrackerProps) => {
  const { classes } = useStyles();

  return (
    <Paper w="100%" h="100%" withBorder>
      <Group p="md" className={classes.withBorderBottom}>
        <Box c="blue">
          <IconTrophyFilled />
        </Box>
        <Title order={4}>Total Request: {totalRequestCount}</Title>
      </Group>
      <Flex h="100%" direction="column" mt="sm">
        <Center w="100%">
          <Box maw={175} mih={175}>
            {totalRequestCount > 0 ? (
              <RadialChart data={data} />
            ) : (
              <Center h={175}>
                <Text size={20} color="dimmed" weight={600}>
                  No data available.
                </Text>
              </Center>
            )}
          </Box>
        </Center>
        <Stack p="lg">
          {data.map((d, idx) => (
            <Box key={d.label + idx} fz={14}>
              <Grid justify="space-between">
                <Grid.Col span="auto">
                  <Flex gap="sm" w="fit-content">
                    <Box c={getStatusToColorForCharts(d.label)}>
                      <IconSquareRoundedFilled />
                    </Box>
                    <Text weight={600}>{`${d.label} Requests`}</Text>
                  </Flex>
                </Grid.Col>
                <Grid.Col span="content">
                  <Text weight={600}>{`${d.value}/${d.totalCount}`}</Text>
                </Grid.Col>
                <Grid.Col span={2}>
                  <Text align="right" weight={600} c="dimmed">
                    {getPercentage(d.value, d.totalCount)}
                  </Text>
                </Grid.Col>
              </Grid>
            </Box>
          ))}
        </Stack>
      </Flex>
    </Paper>
  );
};

export default RequestStatusTracker;
