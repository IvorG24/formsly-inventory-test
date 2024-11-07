import { useEmployeeList } from "@/stores/useEmployeeStore";
import { limitOption } from "@/utils/constant";
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
};

const EventFilterByPersonFilter = ({
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
  const employeeList = useEmployeeList();
  const { ref: assignedToRef, focused: assignedToRefFocused } =
    useFocusWithin();
  const { ref: categoryref, focused: categoryRefFocused } = useFocusWithin();
  const { ref: siteRef, focused: siteRefFocused } = useFocusWithin();

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

  const memberList = employeeList.map((member) => ({
    value: member.scic_employee_id,
    label: `${member.scic_employee_first_name} ${member.scic_employee_last_name}`,
  }));

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

    return `eventReport${eventName.replace(/-/g, "_").toUpperCase()}_${activeFilters.toUpperCase() ? `_${activeFilters.toUpperCase()}` : ""}.csv`;
  };

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
            name="assignedToPerson"
            render={({ field: { value, onChange } }) => (
              <Select
                placeholder="Assigned To"
                ref={assignedToRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (assignedToRefFocused)
                    handleFilterChange("assignedToPerson", value as string);
                }}
                onDropdownClose={() =>
                  handleFilterChange("assignedToPerson", value)
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
        </Flex>
      )}
    </>
  );
};

export default EventFilterByPersonFilter;
