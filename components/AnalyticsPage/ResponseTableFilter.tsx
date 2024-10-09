import { frequencyOptions } from "@/utils/constant";
import { OptionType } from "@/utils/types";
import { Button, Flex, Grid, Select } from "@mantine/core";
import {
  DatePickerInput,
  MonthPickerInput,
  YearPickerInput,
} from "@mantine/dates";
import { IconDatabase } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Controller, useFormContext } from "react-hook-form";
import { FilterChartValues } from "./ResponseAnalytics";

type Props = {
  stepOptions: OptionType[];
  memberOptions: OptionType[];
  handleFetchResponseTable: (data: FilterChartValues) => void;
  isLoading: boolean;
};

const ResponseTableFilter = ({
  stepOptions,
  memberOptions,
  handleFetchResponseTable,
  isLoading,
}: Props) => {
  const { control, getValues, watch, setValue } =
    useFormContext<FilterChartValues>();
  const frequencyValue = watch("frequencyFilter");
  const startDate = watch("startDate");

  const maxDaily = dayjs(startDate).add(30, "day").toDate();
  const maxMonthly = dayjs(startDate).add(11, "month").toDate();
  const maxYearly = dayjs(startDate).add(9, "year").toDate();
  const minEndDate = startDate
    ? dayjs(startDate)
        .add(
          1,
          frequencyValue === "daily"
            ? "day"
            : frequencyValue === "monthly"
            ? "month"
            : "year"
        )
        .toDate()
    : undefined;
  return (
    <Flex direction="column" gap="sm">
      <Grid align="flex-start">
        <Grid.Col span={4}>
          <Controller
            name="memberFilter"
            control={control}
            render={({ field }) => (
              <Select
                label="HR Member"
                searchable
                placeholder="Select HR Member"
                data={memberOptions}
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  handleFetchResponseTable(getValues());
                }}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Controller
            name="stepFilter"
            control={control}
            defaultValue={stepOptions[0].value}
            render={({ field }) => (
              <Select
                label="Step"
                placeholder="Select Step"
                searchable
                data={stepOptions}
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  handleFetchResponseTable(getValues());
                }}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Controller
            name="frequencyFilter"
            control={control}
            defaultValue={frequencyOptions[2].value}
            render={({ field }) => (
              <Select
                label="Range"
                searchable
                placeholder="Select Frequency"
                data={frequencyOptions}
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  setValue("startDate", null);
                  setValue("endDate", null);
                  handleFetchResponseTable(getValues());
                }}
              />
            )}
          />
        </Grid.Col>
      </Grid>

      <Grid align="flex-end">
        <Grid.Col span={4}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <>
                {frequencyValue === "monthly" && (
                  <MonthPickerInput
                    clearable
                    label="Start Date"
                    placeholder="Pick a start date"
                    {...field}
                  />
                )}
                {frequencyValue === "daily" && (
                  <DatePickerInput
                    clearable
                    label="Start Date"
                    placeholder="Pick a start date"
                    {...field}
                  />
                )}
                {frequencyValue === "yearly" && (
                  <YearPickerInput
                    clearable
                    label="Start Date"
                    placeholder="Pick a start date"
                    {...field}
                  />
                )}
              </>
            )}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <>
                {frequencyValue === "monthly" && (
                  <MonthPickerInput
                    clearable
                    label="End Date"
                    placeholder="Pick an end date"
                    minDate={minEndDate}
                    maxDate={maxMonthly}
                    {...field}
                  />
                )}
                {frequencyValue === "daily" && (
                  <DatePickerInput
                    clearable
                    label="End Date"
                    placeholder="Pick an end date"
                    minDate={minEndDate}
                    maxDate={maxDaily}
                    {...field}
                  />
                )}
                {frequencyValue === "yearly" && (
                  <YearPickerInput
                    clearable
                    label="End Date"
                    placeholder="Pick an end date"
                    minDate={minEndDate}
                    maxDate={maxYearly}
                    {...field}
                  />
                )}
              </>
            )}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Button
            leftIcon={<IconDatabase size={16} />}
            type="submit"
            fullWidth
            disabled={isLoading}
          >
            Fetch Data
          </Button>
        </Grid.Col>
      </Grid>
    </Flex>
  );
};

export default ResponseTableFilter;
