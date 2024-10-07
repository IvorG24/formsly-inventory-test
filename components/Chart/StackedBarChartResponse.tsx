import { DatasetChartResponse } from "@/utils/types";
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

export type StackedBarChartProps = {
  label: string[];
  datasets: DatasetChartResponse[];
  xAxisLabel?: string;
  yAxisLabel?: string;
};

const StackedBarChartResponse: React.FC<StackedBarChartProps> = ({
  label,
  datasets,
  xAxisLabel,
  yAxisLabel,
}) => {
  const chartData = {
    labels: label,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderRadius: {
        topLeft: 20,
        topRight: 20,
        bottomLeft: 20,
        bottomRight: 20,
      },
      barPercentage: 0.7,
      borderSkipped: false,
      backgroundColor: dataset.backgroundColor,
      borderWidth: 2,
      borderColor: "transparent",
    })),
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

export default StackedBarChartResponse;
