import { warrantyOption } from "@/utils/constant";
import { SecurityGroupData } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  MultiSelect,
  Switch,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFocusWithin } from "@mantine/hooks";
import { IconReload, IconSearch } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

type RequestListFilterProps = {
  handleFilterForms: () => void;
  localFilter: FilterSelectedValuesType;
  setLocalFilter: Dispatch<SetStateAction<FilterSelectedValuesType>>;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  securityGroupData: SecurityGroupData;
};

export type FilterSelectedValuesType = {
  status: string[];
  search: string;
  date: Date | undefined;
  isAscendingSort: boolean;
};

const WarrantyListFilter = ({
  handleFilterForms,
  localFilter,
  setLocalFilter,
  showTableColumnFilter,
  setShowTableColumnFilter,
  securityGroupData,
}: RequestListFilterProps) => {
  const inputFilterProps = {
    w: { base: 200, sm: 300 },
    clearable: true,
    clearSearchOnChange: true,
    clearSearchOnBlur: true,
    searchable: true,
    nothingFound: "Nothing found",
  };

  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  console.log(securityGroupData);

  //   const eventSecurity = securityGroupData.asset.filter.event
  //     ? securityGroupData.asset.filter.event
  //     : [];

  const [filterSelectedValues, setFilterSelectedValues] =
    useState<FilterSelectedValuesType>({
      status: [],
      search: "",
      date: undefined,
      isAscendingSort: false,
    });
  const [isFilter, setIsfilter] = useState(false);

  const { control, setValue, register } =
    useFormContext<FilterSelectedValuesType>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean | Date | string = []
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
      </Flex>
      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                label="Warranty Status"
                placeholder="Warranty Status"
                ref={statusRef}
                data={warrantyOption}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (statusRefFocused) handleFilterChange("status", value);
                }}
                onDropdownClose={() => handleFilterChange("status", value)}
                {...inputFilterProps}
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
              />
            )}
          />
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange } }) => (
              <DatePickerInput
                label="Expiration Date"
                placeholder="Warranty Date Expiration"
                sx={{ flex: 1 }}
                miw={250}
                maw={320}
                clearable
                onChange={(value) => {
                  const dateValue = value || undefined;
                  onChange(dateValue);
                  handleFilterChange(
                    "date",
                    dateValue ? String(dateValue) : undefined
                  ); // Trigger fetch immediately
                }}
              />
            )}
          />
        </Flex>
      )}
    </>
  );
};

export default WarrantyListFilter;
