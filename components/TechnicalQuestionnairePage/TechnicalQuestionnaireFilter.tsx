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
  Modal,
  Select,
  Switch,
  TextInput,
} from "@mantine/core";
import { useFocusWithin } from "@mantine/hooks";
import { IconPlus, IconReload, IconSearch } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

type RequestListFilterProps = {
  teamMemberList: TeamMemberWithUserType[];
  open: () => void;
  close: () => void;
  opened: boolean;
  setQuestionnaireName: Dispatch<SetStateAction<string>>;
  questionnaireName: string;
  handleConfirm: (questionnaireName: string) => void;
  handleFilterForms: () => void;
  localFilter: TechnicalAssessmentFilterValues;
  setLocalFilter: Dispatch<SetStateAction<TechnicalAssessmentFilterValues>>;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
};

type FilterSelectedValuesType = {
  creator: string;
  isAscendingSort: boolean;
  search?: string;
};

const TechnicalQuestionnaireFilter = ({
  teamMemberList,
  handleConfirm,
  open,
  opened,
  close,
  handleFilterForms,
  setQuestionnaireName,
  questionnaireName,
  localFilter,
  setLocalFilter,
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
      <Modal
        centered
        opened={opened}
        onClose={() => {
          setQuestionnaireName("");
          close();
        }}
        title="Create a new questionnaire"
      >
        <TextInput
          label="Questionnaire Name"
          value={questionnaireName}
          onChange={(event) => setQuestionnaireName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleConfirm(questionnaireName);
            }
          }}
          autoFocus
          sx={{ input: { textTransform: "uppercase" } }}
        />
        <Group mt="md">
          <Button
            fullWidth
            size="sm"
            onClick={() => handleConfirm(questionnaireName)}
          >
            Add Questionnaire
          </Button>
        </Group>
      </Modal>
      <Group position="apart">
        <Flex gap="sm" wrap="wrap" align="center" direction="row">
          <TextInput
            placeholder="Search by questionnaire name"
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
        </Flex>
        <Button
          leftIcon={<IconPlus size={16} />}
          onClick={open} // Trigger modal on click
        >
          Add Questionnaire
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

export default TechnicalQuestionnaireFilter;
