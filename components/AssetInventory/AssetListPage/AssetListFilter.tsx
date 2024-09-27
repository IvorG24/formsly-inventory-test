import {
  OptionType,
  RequestListFilterValues,
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
import FormEventModal from "../FormButton";

type RequestListFilterProps = {
  formList: { label: string; value: string }[];
  teamMemberList: TeamMemberWithUserType[];
  userId: string;
  handleFilterForms: () => void;
  localFilter: RequestListFilterValues;
  setLocalFilter: Dispatch<SetStateAction<RequestListFilterValues>>;
  projectList: TeamProjectTableRow[];
  eventOptions: OptionType[];
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
};

type FilterSelectedValuesType = {
  form: string[];
  status: string[];
  requestor: string[];
  approver: string[];
  project: string[];
  isApproversView: boolean;
};

const AssetListFilter = ({
  formList,
  eventOptions,
  teamMemberList,
  handleFilterForms,
  localFilter,
  setLocalFilter,
  userId,
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
    setSelectedEventId(value); // Update state with selected event ID
  };
  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      form: [],
      status: [],
      requestor: [],
      approver: [],
      project: [],
      isApproversView: false,
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
    useFormContext<RequestListFilterValues>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean = []
  ) => {
    const filterMatch = filterSelectedValues[`${key}`];

    if (value !== filterMatch) {
      // if (value.length === 0 && filterMatch.length === 0) return;
      handleFilterForms();
      setFilterSelectedValues((prev) => ({ ...prev, [`${key}`]: value }));
      setLocalFilter({ ...localFilter, [key]: value });
    }
  };

  useEffect(() => {
    Object.entries(localFilter).forEach(([key, value]) => {
      setValue(key as keyof RequestListFilterValues, value);
    });
  }, [localFilter]);

  return (
    <>
      {selectedEventId && (
        <FormEventModal userId={userId} eventId={selectedEventId} />
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
            disabled={filterSelectedValues.isApproversView}
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
          <Select
            placeholder="More Actions"
            data={eventOptions}
            onChange={handleSelectChange}
          />
        </Group>
      </Flex>
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          <Controller
            control={control}
            name="form"
            defaultValue={localFilter.form}
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={formList}
                placeholder="Form"
                ref={formRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!formRefFocused) handleFilterChange("form", value);
                }}
                onDropdownClose={() => handleFilterChange("form", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                disabled={filterSelectedValues.isApproversView}
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={statusList}
                placeholder="Status"
                ref={statusRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!statusRefFocused) handleFilterChange("status", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("status", value as string[])
                }
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                disabled={filterSelectedValues.isApproversView}
              />
            )}
          />

          <Controller
            control={control}
            name="project"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={projectListChoices}
                placeholder="Project"
                ref={projectRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!projectRefFocused) handleFilterChange("project", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("project", value as string[])
                }
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                disabled={filterSelectedValues.isApproversView}
              />
            )}
          />

          <Controller
            control={control}
            name="requestor"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Requestor"
                ref={requestorRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!requestorRefFocused)
                    handleFilterChange("requestor", value);
                }}
                onDropdownClose={() => handleFilterChange("requestor", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                disabled={filterSelectedValues.isApproversView}
              />
            )}
          />

          <Controller
            control={control}
            name="approver"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Approver"
                ref={approverRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!approverRefFocused)
                    handleFilterChange("approver", value);
                }}
                onDropdownClose={() => handleFilterChange("approver", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                disabled={filterSelectedValues.isApproversView}
              />
            )}
          />
        </Flex>
      )}
    </>
  );
};

export default AssetListFilter;
