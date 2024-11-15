import {
  Box,
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SSOTFilterFormValues } from "./SSOTSpreadhseetViewPage";

type RequestListFilterProps = {
  requestingProjectList: string[];
  itemNameList: string[];
  handleFilterSSOT: () => void;
};

const SSOTSpreadsheetViewFilter = ({
  requestingProjectList,
  itemNameList,
  handleFilterSSOT,
}: RequestListFilterProps) => {
  const inputFilterProps = {
    clearable: true,
    searchable: true,
    nothingFound: "Nothing found",
  };

  const [showFilterModal, setShowFilterModal] = useState(false);
  const {
    reset,
    formState: { isDirty },
  } = useFormContext<SSOTFilterFormValues>();

  const requestingProjectListData = requestingProjectList.map((project) => ({
    label: project,
    value: project,
  }));

  const itemNameListData = itemNameList.map((item) => ({
    label: item,
    value: item,
  }));

  const { register, control } = useFormContext<SSOTFilterFormValues>();

  return (
    <Box>
      <Drawer
        opened={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={<Text weight={600}>Filter SSOT</Text>}
        position="right"
      >
        <Stack>
          <TextInput
            placeholder="Search by Request ID"
            {...register("search")}
          />

          <Controller
            control={control}
            name="requestingProject"
            render={({ field: { value, onChange } }) => (
              <Select
                data={requestingProjectListData}
                placeholder="Requesting Project"
                value={value}
                onChange={onChange}
                {...inputFilterProps}
              />
            )}
          />

          <Controller
            control={control}
            name="itemName"
            render={({ field: { value, onChange } }) => (
              <Select
                placeholder="Item Name"
                data={itemNameListData}
                value={value}
                onChange={onChange}
                {...inputFilterProps}
              />
            )}
          />

          <Button
            color="red"
            variant="outline"
            disabled={!isDirty}
            onClick={() => {
              reset();
              handleFilterSSOT();
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              handleFilterSSOT();
              setShowFilterModal(false);
            }}
          >
            Apply Filters
          </Button>
        </Stack>
      </Drawer>
      <Group position="center">
        <Button
          onClick={() => setShowFilterModal(true)}
          leftIcon={<IconFilter size={16} />}
          variant="light"
        >
          Filters
        </Button>
      </Group>
    </Box>
  );
};

export default SSOTSpreadsheetViewFilter;
