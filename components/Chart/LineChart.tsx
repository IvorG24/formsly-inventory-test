import { LineChartDataType } from "@/utils/types";
import {
  CategoryScale,
  Chart as ChartJS,
  FontSpec,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type LineChartProps = {
  data: LineChartDataType[];
  legendLabel?: string;
};

const LineChart: React.FC<LineChartProps> = ({ data, legendLabel }) => {
  const max = Math.max(...data.map((item) => item.value));
  const roundedMax = Math.ceil(max / 10) * 10;

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: legendLabel || "<Item Name>",
        data: data.map((item) => item.value),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        title: {
          display: true,
          text: "Qty",
          color: "black",
          font: {
            weight: "bold" as FontSpec["weight"],
          },
        },
        beginAtZero: true,
        max: roundedMax,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
};

export default LineChart;
