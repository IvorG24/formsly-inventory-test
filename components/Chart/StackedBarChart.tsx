import {
  BarElement,
  CategoryScale,
  Chart as ChartJs,
  FontSpec,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export type StackedBarChartDataType = {
  month: string;
  approved: number;
  rejected: number;
  pending: number;
};

type StackedBarChartProps = {
  data: StackedBarChartDataType[];
  xAxisLabel?: string;
  yAxisLabel?: string;
};

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  xAxisLabel,
  yAxisLabel,
}) => {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Approved",
        data: data.map((d) => d.approved),
        backgroundColor: "#40c057",
        barPercentage: 0.7,
        borderSkipped: false,
        borderRadius: {
          topLeft: 20,
          topRight: 20,
          bottomLeft: 20,
          bottomRight: 20,
        },
        borderWidth: 2,
        borderColor: "transparent",
      },
      {
        label: "Rejected",
        data: data.map((d) => d.rejected),
        backgroundColor: "#fa5252",
        barPercentage: 0.7,
        borderSkipped: false,
        borderRadius: {
          topLeft: 20,
          topRight: 20,
          bottomLeft: 20,
          bottomRight: 20,
        },
        borderWidth: 2,
        borderColor: "transparent",
      },
      {
        label: "Pending",
        data: data.map((d) => d.pending),
        backgroundColor: "#228be6",
        barPercentage: 0.7,
        borderSkipped: false,
        borderRadius: {
          topLeft: 20,
          topRight: 20,
          bottomLeft: 20,
          bottomRight: 20,
        },
        borderWidth: 2,
        borderColor: "transparent",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: xAxisLabel ? xAxisLabel : "",
          color: "black",
          font: {
            weight: "bold" as FontSpec["weight"],
          },
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: yAxisLabel ? yAxisLabel : "",
          color: "black",
          font: {
            weight: "bold" as FontSpec["weight"],
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};

export default StackedBarChart;
