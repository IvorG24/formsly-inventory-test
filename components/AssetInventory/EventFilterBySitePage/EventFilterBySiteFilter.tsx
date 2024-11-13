import { dateOption, limitOption } from "@/utils/constant";
import { formatCurrency } from "@/utils/functions";
import {
  CategoryTableRow,
  InventoryListType,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  MultiSelect,
  Select,
  Switch,
  TextInput,
} from "@mantine/core";
import {
  DatePickerInput,
  MonthPickerInput,
  YearPickerInput,
} from "@mantine/dates";
import { useFocusWithin } from "@mantine/hooks";
import { IconReload, IconSearch } from "@tabler/icons-react";
import { SetStateAction, useState } from "react";
import { CSVLink } from "react-csv";
import { Controller, useFormContext } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";

type RequestListFilterProps = {
  reportList: InventoryListType[];
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  handleFilterForms: () => void;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  securityGroupData: SecurityGroupData;
  listTableColumnFilter: string[];
  eventName: string;
  tableColumnList: { label: string; value: string }[];
};

export type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  limit?: string;
  department?: string[];
  status?: string;
  assignedToPerson?: string;
  isAscendingSort: boolean;
  dateType: string;
  assignedToSite: string;
  dateStart: Date | null;
  dateEnd: Date | null;
};

const EventFilterBySiteFilter = ({
  departmentList,
  siteList,
  categoryList,
  handleFilterForms,
  showTableColumnFilter,
  setShowTableColumnFilter,
  listTableColumnFilter,
  tableColumnList,
  reportList,
  eventName,
}: RequestListFilterProps) => {
  const inputFilterProps = {
    w: { base: 200, sm: 300 },
    clearable: true,
    clearSearchOnChange: true,
    clearSearchOnBlur: true,
    searchable: true,
    nothingFound: "Nothing found",
  };

  const { ref: categoryref, focused: categoryRefFocused } = useFocusWithin();
  const { ref: siteRef, focused: siteRefFocused } = useFocusWithin();
  const { ref: datetypeRef, focused: datetypeRefFocused } = useFocusWithin();

  const { ref: limitRef, focused: limitRefFocused } = useFocusWithin();
  const { ref: departmentRef, focused: departmentRefFocused } =
    useFocusWithin();

  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      search: "",
      sites: [],
      locations: "",
      department: [],
      category: [],
      limit: "",
      status: "",
      isAscendingSort: false,
      assignedToPerson: "",
      dateType: dateOption[0].value,
      dateStart: null,
      dateEnd: null,
      assignedToSite: "",
    });
  const [isFilter, setIsfilter] = useState(false);

  const siteListchoices = siteList.map((site) => {
    return {
      label: site.site_name,
      value: site.site_name,
    };
  });

  const departmentListChoices = departmentList.map((department) => {
    return {
      label: department.team_department_name,
      value: department.team_department_name,
    };
  });

  const categoryListChoices = categoryList.map((category) => {
    return {
      label: category.category_name,
      value: category.category_name,
    };
  });

  const { register, control, watch, setValue } =
    useFormContext<FilterSelectedValuesType>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean | string = []
  ) => {
    const filterMatch = filterSelectedValues[`${key}`];

    if (value !== filterMatch) {
      handleFilterForms();
      setFilterSelectedValues((prev) => ({ ...prev, [`${key}`]: value }));
    }
  };
  const hiddenColumnValues = listTableColumnFilter.map((col) => col);

  const columns = tableColumnList
    .filter((col) => !hiddenColumnValues.includes(col.value))
    .map((col) => ({
      label: col.value
        .replace(/_/g, " ")
        .replace("inventory request", "")
        .replace("event", "")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim(),
      key: col.value,
    }));

  const transformedData = reportList.map((item) => {
    const assignedTo = [
      item.assignee_first_name,
      item.assignee_last_name,
      item.site_name,
      item.customer_name,
    ];
    const createdBy = [
      item.request_creator_first_name,
      item.request_creator_last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...item,
      inventory_request_cost: formatCurrency(item.inventory_request_cost),
      inventory_request_assigned_to: assignedTo,
      inventory_request_created_by: createdBy,
    };
  });

  const buildFilename = () => {
    const activeFilters = Object.entries(filterSelectedValues)
      .filter(([key, value]) => {
        if (Array.isArray(value) && key) return value.length > 0;
        return Boolean(value);
      })
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}_${value.join("-")}`;
        }
        return `${key}_${value}`;
      })
      .join("_");

    return `eventReport_${eventName.replace(/-/g, "_").toUpperCase()}_${activeFilters.toUpperCase() ? `_${activeFilters.toUpperCase()}` : ""}.csv`;
  };
  const dateTypeWatch = watch("dateType");
  const dateStart = watch("dateStart");
  const dateEnd = watch("dateEnd");
  return (
    <>
      <Flex
        gap="sm"
        wrap="wrap"
        align="center"
        justify="space-between"
        direction="row"
      >
        <Group>
          <TextInput
            placeholder="Search by asset tag id"
            rightSection={
              <ActionIcon size="xs" type="submit">
                <IconSearch />
              </ActionIcon>
            }
            {...register("search")}
            sx={{ flex: 2 }}
            miw={250}
            maw={320}
          />
          <Button
            variant="light"
            leftIcon={<IconReload size={16} />}
            onClick={() => {
              handleFilterForms();
            }}
          >
            Refresh
          </Button>

          <Flex gap="sm" wrap="wrap" align="center">
            <p>Show/Hide Table Columns</p>
            <Switch
              checked={showTableColumnFilter}
              onChange={(event) =>
                setShowTableColumnFilter(event.currentTarget.checked)
              }
              onLabel="ON"
              offLabel="OFF"
            />
          </Flex>

          <Flex gap="sm" wrap="wrap" align="center">
            <p>Filter</p>
            <Switch
              checked={isFilter}
              onChange={(event) => setIsfilter(event.currentTarget.checked)}
              onLabel="ON"
              offLabel="OFF"
            />
          </Flex>
        </Group>
        <Flex align="end" gap="md">
          {" "}
          <CSVLink
            data={transformedData}
            headers={columns}
            filename={buildFilename()}
            className="btn"
          >
            <Button variant="outline">Export</Button>
          </CSVLink>
          <Controller
            control={control}
            name="limit"
            render={({ field: { value, onChange } }) => (
              <Select
                data={limitOption}
                label="Limit"
                placeholder="limit"
                ref={limitRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (limitRefFocused)
                    handleFilterChange("limit", value as string | undefined);
                }}
                onDropdownClose={() =>
                  handleFilterChange("limit", value as string | undefined)
                }
                sx={{ flex: 1 }}
                maw={100}
              />
            )}
          />
        </Flex>
      </Flex>

      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" justify="space-between" mb="sm">
          <Group>
            <Controller
              control={control}
              name="sites"
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  data={siteListchoices}
                  placeholder="Sites"
                  ref={siteRef}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    if (!siteRefFocused) handleFilterChange("sites", value);
                  }}
                  onDropdownClose={() => handleFilterChange("sites", value)}
                  {...inputFilterProps}
                  sx={{ flex: 1 }}
                  miw={250}
                  maw={320}
                />
              )}
            />

            <Controller
              control={control}
              name="category"
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  data={categoryListChoices}
                  placeholder="Category"
                  ref={categoryref}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    if (categoryRefFocused)
                      handleFilterChange("category", value);
                  }}
                  onDropdownClose={() => handleFilterChange("category", value)}
                  {...inputFilterProps}
                  sx={{ flex: 1 }}
                  miw={250}
                  maw={320}
                />
              )}
            />

            <Controller
              control={control}
              name="department"
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  placeholder="Department"
                  ref={departmentRef}
                  data={departmentListChoices}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    if (departmentRefFocused)
                      handleFilterChange("department", value);
                  }}
                  onDropdownClose={() =>
                    handleFilterChange("department", value)
                  }
                  {...inputFilterProps}
                  sx={{ flex: 1 }}
                  miw={250}
                  maw={320}
                />
              )}
            />

            <Controller
              control={control}
              name="dateType"
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder="Date Type"
                  ref={datetypeRef}
                  data={dateOption}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    setValue("dateStart", null);
                    setValue("dateEnd", null);
                    if (datetypeRefFocused)
                      handleFilterChange("dateType", value as string);
                  }}
                  onDropdownClose={() => {
                    handleFilterChange("dateType", value);
                  }}
                  {...inputFilterProps}
                  sx={{ flex: 1 }}
                  miw={250}
                  maw={320}
                />
              )}
            />
          </Group>
          <Group>
            <Controller
              name="dateStart"
              control={control}
              render={({ field }) => (
                <>
                  {dateTypeWatch === "monthly" && (
                    <MonthPickerInput
                      clearable
                      placeholder="Pick a start date"
                      {...field}
                    />
                  )}
                  {dateTypeWatch === "custom" && (
                    <DatePickerInput
                      clearable
                      placeholder="Pick a start date"
                      {...field}
                    />
                  )}
                  {dateTypeWatch === "yearly" && (
                    <YearPickerInput
                      clearable
                      placeholder="Pick a start date"
                      {...field}
                    />
                  )}
                </>
              )}
            />

            <Controller
              name="dateEnd"
              control={control}
              render={({ field }) => (
                <>
                  {dateTypeWatch === "monthly" && (
                    <MonthPickerInput
                      clearable
                      placeholder="Pick an end date"
                      {...field}
                    />
                  )}
                  {dateTypeWatch === "custom" && (
                    <DatePickerInput
                      clearable
                      placeholder="Pick an end date"
                      {...field}
                    />
                  )}
                  {dateTypeWatch === "yearly" && (
                    <YearPickerInput
                      clearable
                      placeholder="Pick an end date"
                      {...field}
                    />
                  )}
                </>
              )}
            />
            <Button
              onClick={() => handleFilterForms()}
              disabled={!dateStart || !dateEnd}
            >
              Submit
            </Button>
          </Group>
        </Flex>
      )}
    </>
  );
};

export default EventFilterBySiteFilter;
