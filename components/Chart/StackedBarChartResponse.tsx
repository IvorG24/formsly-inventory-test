import { DatasetChartResponse } from "@/utils/types";
import {
  BarElement,
  CategoryScale,
  Chart,
  ChartDataset,
  Chart as ChartJs,
  FontSpec,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import React from "react";
import { Bar } from "react-chartjs-2";

type ChartDataLabelsContext = {
  chart: Chart;
  dataIndex: number;
  dataset: ChartDataset;
  datasetIndex: number;
};

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
  isWithTotal?: boolean;
};

const StackedBarChartResponse: React.FC<StackedBarChartProps> = ({
  label,
  datasets,
  xAxisLabel,
  yAxisLabel,
  isWithTotal = false,
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
        ticks: {
          padding: 10,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: isWithTotal
        ? {
            display: true,
            align: "end" as unknown as "end",
            anchor: "end" as unknown as "end",
            color: "#000",
            font: {
              weight: "bold" as unknown as "bold",
            },
            offset: 0,
            formatter: (_: number, context: ChartDataLabelsContext) => {
              const dataIndex = context.dataIndex;
              const datasetIndex = context.datasetIndex;
              const totalDatasets = context.chart.data.datasets?.length || 0;

              if (datasetIndex === totalDatasets - 1) {
                const total = context.chart.data.datasets
                  ?.map((dataset) => dataset.data[dataIndex] as number)
                  .reduce((acc, curr) => acc + curr, 0);
                return total ? `Total: ${total}` : "";
              }
              return null;
            },
          }
        : {},
    },
  };

  return (
    <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
  );
};

export default StackedBarChartResponse;
