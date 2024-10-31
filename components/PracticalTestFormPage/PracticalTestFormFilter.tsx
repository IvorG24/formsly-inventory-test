import { useActiveTeam } from "@/stores/useTeamStore";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  TeamMemberWithUserType,
  TechnicalAssessmentFilterValues,
} from "@/utils/types";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  Select,
  Switch,
  TextInput,
} from "@mantine/core";
import { useFocusWithin } from "@mantine/hooks";
import { IconPlus, IconReload, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

type FilterSelectedValuesType = {
  creator: string;
  isAscendingSort: boolean;
  search?: string;
};

type RequestListFilterProps = {
  teamMemberList: TeamMemberWithUserType[];
  handleFilterForms: () => void;
  localFilter: TechnicalAssessmentFilterValues;
  setLocalFilter: Dispatch<SetStateAction<TechnicalAssessmentFilterValues>>;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  isFetchingRequestList: boolean;
};

const PracticalTestFormFilter = ({
  teamMemberList,
  handleFilterForms,
  localFilter,
  setLocalFilter,
  showTableColumnFilter,
  setShowTableColumnFilter,
  isFetchingRequestList,
}: RequestListFilterProps) => {
  const router = useRouter();
  const activeTeam = useActiveTeam();

  const inputFilterProps = {
    w: { base: 200, sm: 300 },
    clearable: true,
    clearSearchOnChange: true,
    clearSearchOnBlur: true,
    searchable: true,
    nothingFound: "Nothing found",
  };

  const { ref: requestorRef, focused: requestorRefFocused } = useFocusWithin();
  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      creator: "",
      isAscendingSort: false,
      search: "",
    });
  const [isFilter, setIsfilter] = useState(false);

  const memberList = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const { register, control, setValue } =
    useFormContext<TechnicalAssessmentFilterValues>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string
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
      setValue(key as keyof TechnicalAssessmentFilterValues, value);
    });
  }, [localFilter]);

  return (
    <>
      <Group position="apart">
        <Flex gap="sm" wrap="wrap" align="center" direction="row">
          <TextInput
            placeholder="Search by label"
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
            disabled={isFetchingRequestList}
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
        </Flex>
        <Button
          leftIcon={<IconPlus size={16} />}
          onClick={() =>
            router.push(
              `/${formatTeamNameToUrlKey(
                activeTeam.team_name ?? ""
              )}/practical-test-form/create`
            )
          }
        >
          Add Practical Test
        </Button>
      </Group>
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          <Controller
            control={control}
            name="creator"
            render={({ field: { value, onChange } }) => (
              <Select
                placeholder="Created By"
                ref={requestorRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!requestorRefFocused && value !== null) {
                    handleFilterChange("creator", value);
                    handleFilterForms();
                  }
                }}
                onDropdownClose={() => {
                  if (value !== null && value !== undefined) {
                    handleFilterChange("creator", value);
                  }
                  handleFilterForms();
                }}
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

export default PracticalTestFormFilter;
