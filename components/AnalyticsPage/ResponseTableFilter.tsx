import { frequencyOptions } from "@/utils/constant";
import { OptionType } from "@/utils/types";
import { Button, Flex, Group, Select } from "@mantine/core";
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
};

const ResponseTableFilter = ({
  stepOptions,
  memberOptions,
  handleFetchResponseTable,
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
    <Flex align="center" justify="space-between" flex-wrap="true">
      <Group spacing="md">
        <Controller
          name="memberFilter"
          control={control}
          render={({ field }) => (
            <Select
              label="HR Member"
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

        <Controller
          name="stepFilter"
          control={control}
          defaultValue={stepOptions[0].value}
          render={({ field }) => (
            <Select
              label="Step"
              placeholder="Select Step"
              data={stepOptions}
              {...field}
              onChange={(value) => {
                field.onChange(value);

                handleFetchResponseTable(getValues());
              }}
            />
          )}
        />

        <Controller
          name="frequencyFilter"
          control={control}
          defaultValue={frequencyOptions[2].value}
          render={({ field }) => (
            <Select
              label="Range"
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
      </Group>
      <Group align="end" spacing="md">
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
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
              )}
              {frequencyValue === "daily" && (
                <DatePickerInput
                  clearable
                  label="Start Date"
                  placeholder="Pick a start date"
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
              )}
              {frequencyValue === "yearly" && (
                <YearPickerInput
                  clearable
                  label="Start Date"
                  placeholder="Pick a start date"
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
              )}
            </>
          )}
        />

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
                  onChange={(value) => {
                    field.onChange(value);
                  }}
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
                  onChange={(value) => {
                    field.onChange(value);
                  }}
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
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
              )}
            </>
          )}
        />
        <Button leftIcon={<IconDatabase size={16} />} type="submit">
          Fetch Data
        </Button>
      </Group>
    </Flex>
  );
};

export default ResponseTableFilter;
