import {
  OptionType,
  TeamMemberWithUserType,
  TeamProjectTableRow,
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
import EventFormModal from "../EventFormModal";

type RequestListFilterProps = {
  formList: { label: string; value: string }[];
  teamMemberList: TeamMemberWithUserType[];
  userId: string;
  handleFilterForms: () => void;
  localFilter: FilterSelectedValuesType;
  setLocalFilter: Dispatch<SetStateAction<FilterSelectedValuesType>>;
  projectList: TeamProjectTableRow[];
  eventOptions: OptionType[];
  selectedRow: string[];
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
};

export type FilterSelectedValuesType = {
  search?: string;
  sites?: string;
  locations?: string;
  category?: string;
  department?: string;
  status?: string;
  createdBy?: string[];
  isAscendingSort?: boolean;
};

const AssetListFilter = ({
  formList,
  eventOptions,
  teamMemberList,
  handleFilterForms,
  localFilter,
  setLocalFilter,
  userId,
  selectedRow,
  projectList,
  showTableColumnFilter,
  setShowTableColumnFilter,
}: RequestListFilterProps) => {
  const inputFilterProps = {
    w: { base: 200, sm: 300 },
    clearable: true,
    clearSearchOnChange: true,
    clearSearchOnBlur: true,
    searchable: true,
    nothingFound: "Nothing found",
  };
  const { ref: requestorRef, focused: requestorRefFocused } = useFocusWithin();
  const { ref: approverRef, focused: approverRefFocused } = useFocusWithin();
  const { ref: formRef, focused: formRefFocused } = useFocusWithin();
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  const { ref: projectRef, focused: projectRefFocused } = useFocusWithin();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null); // State to track selected event ID

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

  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      search: "",
      sites: "",
      locations: "",
      department: "",
      category: "",
      status: "",
      createdBy: [],
    });
  const [isFilter, setIsfilter] = useState(false);

  const memberList = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const statusList = [
    { value: "APPROVED", label: "Approved" },
    { value: "PENDING", label: "Pending" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELED", label: "Canceled" },
  ];

  const projectListChoices = projectList.map((project) => {
    return {
      label: project.team_project_name,
      value: project.team_project_code,
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
            placeholder="Search by request id"
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
          {selectedRow.length > 0 && (
            <Select
              placeholder="More Actions"
              data={eventOptions}
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
          <Controller
            control={control}
            name="sites"
            defaultValue={localFilter.sites}
            render={({ field: { value, onChange } }) => (
              <Select
                data={formList}
                placeholder="Form"
                ref={formRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!formRefFocused)
                    handleFilterChange("sites", value as string | undefined);
                }}
                onDropdownClose={() =>
                  handleFilterChange("sites", value as string | undefined)
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
            name="status"
            render={({ field: { value, onChange } }) => (
              <Select
                data={statusList}
                placeholder="Status"
                ref={statusRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!statusRefFocused)
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
              <Select
                data={projectListChoices}
                placeholder="category"
                ref={projectRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!projectRefFocused)
                    handleFilterChange("category", value as string | undefined);
                }}
                onDropdownClose={() =>
                  handleFilterChange("category", value as string | undefined)
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
            name="department"
            render={({ field: { value, onChange } }) => (
              <Select
                placeholder="department"
                ref={requestorRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!requestorRefFocused)
                    handleFilterChange(
                      "department",
                      value as string | undefined
                    );
                }}
                onDropdownClose={() => handleFilterChange("department", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
              />
            )}
          />

          <Controller
            control={control}
            name="createdBy"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="createdBy"
                ref={approverRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!approverRefFocused)
                    handleFilterChange("createdBy", value);
                }}
                onDropdownClose={() => handleFilterChange("createdBy", value)}
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
