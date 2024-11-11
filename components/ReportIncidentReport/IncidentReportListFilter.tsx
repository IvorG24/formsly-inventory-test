import { generateMonthList, generateYearList } from "@/utils/constant";
import { Button, Container, Flex, Select } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type IncidentReportFormValues = {
  teamMemberId: string;
  interval: string;
  month: string;
  year: string;
};

type Props = {
  reporteeOption: { label: string; value: string }[];
  isFetchingData: boolean;
};

const IncidentReportListFilter = ({
  reporteeOption,
  isFetchingData,
}: Props) => {
  const { control } = useFormContext<IncidentReportFormValues>();
  const [interval, setInterval] = useState("Monthly");

  return (
    <Container p={0} mt="md">
      <Flex gap="xs" wrap="wrap" align="end">
        <Controller
          control={control}
          name="teamMemberId"
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              {...field}
              label="Reportee"
              searchable
              placeholder="Select a reportee"
              data={reporteeOption}
            />
          )}
        />
        <Controller
          control={control}
          name="interval"
          render={({ field }) => (
            <Select
              {...field}
              onChange={(value) => {
                field.onChange(value);
                if (value) setInterval(value);
              }}
              label="Frequency"
              clearable={false}
              searchable={false}
              data={["Monthly", "Daily"]}
              maw={105}
            />
          )}
        />
        <Controller
          control={control}
          name="year"
          render={({ field }) => (
            <Select
              {...field}
              label="Year"
              clearable={false}
              searchable={false}
              data={generateYearList()}
              maw={105}
            />
          )}
        />

        {interval === "Daily" && (
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <Select
                {...field}
                label="Month"
                clearable={false}
                searchable={false}
                data={generateMonthList().map((month, monthIdx) => ({
                  label: month,
                  value: `${monthIdx + 1}`,
                }))}
                maw={130}
              />
            )}
          />
        )}

        <Button type="submit" px="xs" disabled={isFetchingData}>
          <IconSearch size={14} />
        </Button>
      </Flex>
    </Container>
  );
};

export default IncidentReportListFilter;
