import { useEmployeeList } from "@/stores/useEmployeeStore";
import { limitOption } from "@/utils/constant";
import {
  CategoryTableRow,
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
  localFilter: FilterSelectedValuesType;
  setLocalFilter: Dispatch<SetStateAction<FilterSelectedValuesType>>;
  type?: string;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  securityGroupData: SecurityGroupData;
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
};

const CheckOutReportListFilter = ({
  eventList,
  departmentList,
  siteList,
  customerList,
  categoryList,
  handleFilterForms,
  localFilter,
  setLocalFilter,
  showTableColumnFilter,
  setShowTableColumnFilter,
  securityGroupData,
  type = "asset",
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
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  const { ref: limitRef, focused: limitRefFocused } = useFocusWithin();
  const { ref: departmentRef, focused: departmentRefFocused } =
    useFocusWithin();

  const eventOptions = eventList.map((event) => ({
    label: event.event_status,
    value: event.event_status,
  }));

  const customerOptions = customerList.map((customer) => ({
    label: customer.customer_name,
    value: customer.customer_name,
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
      assignedToPerson: [],
      assignedToSite: [],
    });
  const [isFilter, setIsfilter] = useState(false);

  const memberList = employeeList.map((member) => ({
    value: member.scic_employee_id,
    label: `${member.scic_employee_first_name} ${member.scic_employee_last_name}`,
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

  const { register, control, setValue } =
    useFormContext<FilterSelectedValuesType>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean | string = []
  ) => {
    const filterMatch = filterSelectedValues[`${key}`];

    if (value !== filterMatch) {
      handleFilterForms();
      setFilterSelectedValues((prev) => ({ ...prev, [`${key}`]: value }));
      setLocalFilter({ ...localFilter, [key]: value });
    }
  };

  useEffect(() => {
    Object.entries(localFilter).forEach(([key, value]) => {
      setValue(key as keyof FilterSelectedValuesType, value);
    });
  }, [localFilter]);

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
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          {securityGroupData.asset.filter.site.length === 0 && (
            <Controller
              control={control}
              name="sites"
              defaultValue={localFilter.sites}
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
          )}

          {type === "asset" && (
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
          )}

          {securityGroupData.asset.filter.category.length === 0 && (
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
          )}
          {securityGroupData.asset.filter.department.length === 0 && (
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
          )}
          <Controller
            control={control}
            name="assignedToPerson"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Assigned To Person"
                ref={assignedToRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (assignedToRefFocused)
                    handleFilterChange("assignedToPerson", value);
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
            name="assignedToSite"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Assigned To Site"
                ref={assignedToRef}
                data={siteListchoices}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (assignedToRefFocused)
                    handleFilterChange("assignedToSite", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("assignedToSite", value)
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
            name="assignedToCustomer"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Assigned To Customer"
                ref={assignedToRef}
                data={customerOptions}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (assignedToRefFocused)
                    handleFilterChange("assignedToCustomer", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("assignedToCustomer", value)
                }
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

export default CheckOutReportListFilter;
