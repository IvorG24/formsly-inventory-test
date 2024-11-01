import { assignedToOption, limitOption } from "@/utils/constant";
import {
  CategoryTableRow,
  Column,
  EventTableRow,
  InventoryCustomerRow,
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
import { useFocusWithin } from "@mantine/hooks";
import { IconReload, IconSearch } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";

type RequestListFilterProps = {
  siteList: SiteTableRow[];
  customerList: InventoryCustomerRow[];
  eventList: EventTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  handleFilterForms: () => void;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  type?: string;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  securityGroupData: SecurityGroupData;
  columns: Column[];
};

export type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  limit?: string;
  department?: string[];
  status?: string;
  assignedToPerson?: string[];
  assignedToSite?: string[];
  assignedToCustomer?: string[];
  isAscendingSort?: boolean;
  event?: string;
  appointedTo?: string;
};

const EventReportListFilter = ({
  eventList,
  departmentList,
  siteList,
  categoryList,
  handleFilterForms,
  setSortStatus,
  showTableColumnFilter,
  setShowTableColumnFilter,
  columns,
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
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  const { ref: limitRef, focused: limitRefFocused } = useFocusWithin();
  const { ref: departmentRef, focused: departmentRefFocused } =
    useFocusWithin();
  const { ref: eventRef, focused: eventRefFocused } = useFocusWithin();
  const { ref: appointedToRef, focused: appointedToReFocused } =
    useFocusWithin();

  const columnAccessors = columns.map((col) => col.title);
  const includesAssignedTo = [
    "Check Out To",
    "Check In To",
    "Appointed To",
  ].some((title) => columnAccessors.includes(title));
  const eventOptions = eventList.map((event) => ({
    label: event.event_status,
    value: event.event_status,
  }));

  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      search: "",
      sites: [],
      locations: "",
      department: [],
      category: [],
      limit: "",
      status: "",
      event: "",
      appointedTo: "",
    });
  const [isFilter, setIsfilter] = useState(false);

  const eventTableOptions = eventList.map((event) => ({
    label: event.event_name,
    value: event.event_name,
  }));
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

  const { register, control } = useFormContext<FilterSelectedValuesType>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean | string = []
  ) => {
    const filterMatch = filterSelectedValues[key];

    if (value !== filterMatch) {
      setFilterSelectedValues((prev) => ({ ...prev, [key]: value }));
    }
  };
  useEffect(() => {
    handleFilterForms();
  }, [filterSelectedValues]);

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
        <Group>
          <Controller
            control={control}
            name="event"
            render={({ field: { value, onChange } }) => (
              <Select
                data={eventTableOptions}
                label="Event"
                placeholder="Event"
                ref={eventRef}
                value={value}
                onChange={(newValue) => {
                  onChange(newValue);
                  setSortStatus({
                    columnAccessor: `event_${newValue?.replace(/ /g, "_").toLowerCase()}_date_created`,
                    direction: "asc",
                  });
                  if (eventRefFocused) {
                    handleFilterChange("event", value as string);
                  }
                }}
                onDropdownClose={() =>
                  handleFilterChange("event", value as string | undefined)
                }
                sx={{ flex: 1 }}
                maw={150}
              />
            )}
          />
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
        </Group>
      </Flex>
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
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
            name="status"
            render={({ field: { value, onChange } }) => (
              <Select
                data={eventOptions}
                placeholder="Status"
                ref={statusRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (statusRefFocused)
                    handleFilterChange("status", value as string | undefined);
                }}
                onDropdownClose={() =>
                  handleFilterChange("status", value as string | undefined)
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
            name="category"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={categoryListChoices}
                placeholder="category"
                ref={categoryref}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (categoryRefFocused) handleFilterChange("category", value);
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
                onDropdownClose={() => handleFilterChange("department", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
              />
            )}
          />
          {includesAssignedTo && (
            <Controller
              control={control}
              name="appointedTo"
              render={({ field: { value, onChange } }) => (
                <Select
                  data={assignedToOption}
                  placeholder="Assigned To"
                  ref={appointedToRef}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    if (appointedToReFocused)
                      handleFilterChange(
                        "appointedTo",
                        value as string | undefined
                      );
                  }}
                  onDropdownClose={() =>
                    handleFilterChange(
                      "appointedTo",
                      value as string | undefined
                    )
                  }
                  {...inputFilterProps}
                  sx={{ flex: 1 }}
                  miw={250}
                  maw={320}
                />
              )}
            />
          )}
        </Flex>
      )}
    </>
  );
};

export default EventReportListFilter;
