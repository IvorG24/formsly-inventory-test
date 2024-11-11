import { ApplicationListFilterValues } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Switch,
  TextInput,
} from "@mantine/core";
import { IconReload, IconSearch } from "@tabler/icons-react";
import { SetStateAction } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  handleFilterForms: () => void;
  setShowTableColumnFilter: (value: SetStateAction<boolean>) => void;
  showTableColumnFilter: boolean;
  isFetchingApplicationList: boolean;
};

const UserApplicationListFilter = ({
  handleFilterForms,
  setShowTableColumnFilter,
  showTableColumnFilter,
  isFetchingApplicationList,
}: Props) => {
  const { register } = useFormContext<ApplicationListFilterValues>();

  return (
    <>
      <Flex gap="sm" wrap="wrap" align="center" direction="row">
        <TextInput
          placeholder="Search by application id"
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
          disabled={isFetchingApplicationList}
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
      </Flex>
      <Divider my="md" />
    </>
  );
};

export default UserApplicationListFilter;
