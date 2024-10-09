import { TeamMemberWithUserType, TicketCategoryTableRow } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  MultiSelect,
  Switch,
  TextInput,
} from "@mantine/core";
import { useFocusWithin } from "@mantine/hooks";
import { IconReload, IconSearch } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FilterFormValues, TicketListLocalFilter } from "./TicketListPage";

type FilterSelectedValuesType = {
  requesterList: string[];
  approverList: string[];
  categoryList: string[];
  status?: string[];
};

type Props = {
  // requestList: RequestType[];
  ticketCategoryList: TicketCategoryTableRow[];
  teamMemberList: TeamMemberWithUserType[];
  handlePagination: (overidePage?: number) => Promise<void>;
  localFilter: TicketListLocalFilter;
  setLocalFilter: (
    val:
      | TicketListLocalFilter
      | ((prevState: TicketListLocalFilter) => TicketListLocalFilter)
  ) => void;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  setActivePage: Dispatch<SetStateAction<number>>;
  isFetchingTicketList: boolean;
};

const TicketListFilter = ({
  localFilter,
  setLocalFilter,
  ticketCategoryList,
  teamMemberList,
  handlePagination,
  setShowTableColumnFilter,
  showTableColumnFilter,
  setActivePage,
  isFetchingTicketList,
}: Props) => {
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
  const { ref: categoryRef, focused: categoryRefFocused } = useFocusWithin();
  const { ref: statusRef, focused: statusRefFocused } = useFocusWithin();
  const [isFilter, setIsfilter] = useState(false);

  const memberList = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  const statusList = [
    { value: "PENDING", label: "Pending" },
    { value: "UNDER REVIEW", label: "Under Review" },
    { value: "INCORRECT", label: "Incorrect" },
    { value: "CLOSED", label: "Closed" },
  ];

  const categoryList = ticketCategoryList.map((category) => ({
    value: category.ticket_category_id,
    label: category.ticket_category,
  }));

  const { register, control } = useFormContext<FilterFormValues>();

  const handleFilterChange = async (
    key: keyof FilterSelectedValuesType,
    value: string[] | boolean = []
  ) => {
    const filterMatch = localFilter[`${key}`];

    if (value !== filterMatch) {
      // if (value.length === 0 && filterMatch.length === 0) return;
      setActivePage(1);
      handlePagination(1);

      setLocalFilter({ ...localFilter, [key]: value });
    }
  };

  return (
    <>
      <Flex gap="sm" wrap="wrap" align="center">
        <TextInput
          placeholder="Search by ticket id"
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
          onClick={() => handlePagination()}
          disabled={isFetchingTicketList}
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

      <Divider my="md" />

      {isFilter && (
        <Flex gap="sm" wrap="wrap" mb="sm">
          <Controller
            control={control}
            name="categoryList"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={categoryList}
                placeholder="Category"
                ref={categoryRef}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!categoryRefFocused)
                    handleFilterChange("categoryList", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("categoryList", value)
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
              />
            )}
          />

          <Controller
            control={control}
            name="requesterList"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Requester"
                ref={requestorRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!requestorRefFocused)
                    handleFilterChange("requesterList", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("requesterList", value)
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
            name="approverList"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                placeholder="Approver"
                ref={approverRef}
                data={memberList}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  if (!approverRefFocused)
                    handleFilterChange("approverList", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("approverList", value)
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

export default TicketListFilter;
