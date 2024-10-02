import { useMantineTheme } from "@mantine/core";
import {
  ArcElement,
  CategoryScale,
  ChartData,
  Chart as ChartJs,
  FontSpec,
  LayoutPosition,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Align, Anchor, Font } from "chartjs-plugin-datalabels/types/options";
import { Pie } from "react-chartjs-2";

ChartJs.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

type Props = {
  data: ChartData<"pie">;
  legendLabel?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  withGrid?: boolean;
  withAxes?: boolean;
};

const PieChart = ({
  data,
  xAxisLabel,
  yAxisLabel,
  withGrid = true,
  withAxes = true,
}: Props) => {
  const theme = useMantineTheme();
  const total = data.datasets.reduce(
    (acc, dataset) =>
      acc + dataset.data.reduce((datasetAcc, value) => datasetAcc + value, 0),
    0
  );

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        display: withAxes,
        title: {
          display: withAxes,
          text: xAxisLabel ? xAxisLabel : "",
          color:
            theme.colorScheme === "dark"
              ? theme.colors.dark[0]
              : theme.colors.dark[9],
          font: {
            weight: "bold" as FontSpec["weight"],
          },
        },
        grid: {
          display: withGrid,
        },
      },
      y: {
        display: withAxes,
        title: {
          display: withAxes,
          text: yAxisLabel ? yAxisLabel : "",
          color:
            theme.colorScheme === "dark"
              ? theme.colors.dark[0]
              : theme.colors.dark[9],
          font: {
            weight: "bold" as FontSpec["weight"],
          },
        },
        grid: {
          display: withGrid,
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom" as LayoutPosition,
        labels: {
          boxWidth: 21,
          boxHeight: 8,
          padding: 14,
        },
      },
      datalabels: {
        color:
          theme.colorScheme === "dark"
            ? theme.colors.dark[5]
            : theme.colors.dark[9],
        display: true,
        formatter: (value: number) =>
          `${value} (${((value / total) * 100).toFixed(2)}%)`,
        anchor: "end" as Anchor,
        align: "start" as Align,
        offset: 10,
        font: {
          weight: 500,
          size: 16,
        } as Font,
      },
    },
  };

  return <Pie data={data} options={chartOptions} />;
};

export default PieChart;
