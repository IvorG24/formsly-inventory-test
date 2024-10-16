import { useSecurityGroup } from "@/stores/useSecurityGroupStore";
import {
  CategoryTableRow,
  InventoryListType,
  OptionType,
  SiteTableRow,
  TeamMemberWithUserType,
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
import EventFormModal from "../EventFormModal";

type RequestListFilterProps = {
  formList: { label: string; value: string }[];
  teamMemberList: TeamMemberWithUserType[];
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  inventoryList: InventoryListType[];
  userId: string;
  handleFilterForms: () => void;
  localFilter: FilterSelectedValuesType;
  setLocalFilter: Dispatch<SetStateAction<FilterSelectedValuesType>>;
  eventOptions: OptionType[];
  selectedRow: string[];
  type?: string;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
};

export type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  department?: string[];
  status?: string;
  assignedToPerson?: string[];
  assignedToSite?: string[];
  isAscendingSort?: boolean;
};

const AssetListFilter = ({
  eventOptions,
  inventoryList,
  teamMemberList,
  departmentList,
  siteList,
  categoryList,
  handleFilterForms,
  localFilter,
  setLocalFilter,
  userId,
  selectedRow,
  showTableColumnFilter,
  setShowTableColumnFilter,
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
  const { ref: assignedToRef, focused: assignedToRefFocused } =
    useFocusWithin();
  const { ref: categoryref, focused: categoryRefFocused } = useFocusWithin();
  const { ref: siteRef, focused: siteRefFocused } = useFocusWithin();
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  const { ref: departmentRef, focused: departmentRefFocused } =
    useFocusWithin();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const securityGroup = useSecurityGroup();
  const handleSelectChange = (value: string | null) => {
    if (selectedEventId === value) {
      setSelectedEventId(null);
      setTimeout(() => {
        setSelectedEventId(value);
      }, 0);
    } else {
      setSelectedEventId(value);
    }
  };
  const eventSecurity = securityGroup.asset.filter.event;

  const filteredEvents = eventOptions.filter((event) =>
    eventSecurity.includes(event.label)
  );

  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      search: "",
      sites: [],
      locations: "",
      department: [],
      category: [],
      status: "",
      assignedToPerson: [],
      assignedToSite: [],
    });
  const [isFilter, setIsfilter] = useState(false);

  const memberList = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const statusList = [
    { value: "CHECKED OUT", label: "Check out" },
    { value: "AVAILABLE", label: "Available" },
  ];

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
      {selectedEventId && (
        <EventFormModal
          handleFilterForms={handleFilterForms}
          teamMemberList={teamMemberList}
          selectedRow={selectedRow}
          key={selectedEventId}
          userId={userId}
          eventId={selectedEventId}
        />
      )}
      <Flex
        gap="sm"
        wrap="wrap"
        align="center"
        justify="space-between"
        direction="row"
      >
        <Group>
          <TextInput
            placeholder="Search by asset id"
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
          {selectedRow.length > 0 && inventoryList && (
            <Select
              placeholder="More Actions"
              data={filteredEvents.filter((option) => {
                const selectedItems = inventoryList.filter((row) =>
                  selectedRow.includes(row.inventory_request_id)
                );

                if (selectedItems.length === 0) return true;

                const hasCheckedOutItem = selectedItems.some(
                  (item) => item.inventory_request_status === "CHECKED OUT"
                );
                const hasAvailableItem = selectedItems.some(
                  (item) => item.inventory_request_status === "AVAILABLE"
                );

                if (hasCheckedOutItem && option.label === "Check Out") {
                  return false;
                }

                if (hasAvailableItem && option.label === "Check In") {
                  return false;
                }

                return true;
              })}
              onChange={(value) => {
                handleSelectChange(value);
              }}
            />
          )}
        </Group>
      </Flex>
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          {securityGroup.asset.filter.site.length < 0 && (
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
                  data={statusList}
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
          {securityGroup.asset.filter.category.length < 0 && (
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
          {securityGroup.asset.filter.department.length < 0 && (
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
                placeholder="Assigned To Site"
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
        </Flex>
      )}
    </>
  );
};

export default AssetListFilter;
