import { useMantineTheme } from "@mantine/core";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJs,
  LayoutPosition,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJs.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement
);

type Props = {
  data: ChartData<"bar">;
  legendLabel?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  withGrid?: boolean;
  withAxes?: boolean;
};

const VerticalBarChart = ({
  data,
  xAxisLabel,
  yAxisLabel,
  withGrid = true,
  withAxes = true,
}: Props) => {
  const theme = useMantineTheme();

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
            weight: "bold",
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
            weight: "bold",
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
      },
    },
  };

  return <Bar data={data} options={chartOptions} />;
};

export default VerticalBarChart;
