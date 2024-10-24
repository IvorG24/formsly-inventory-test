import { getSCICEmployeeList } from "@/backend/api/get";
import { useUserTeamMember } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { SCICEmployeeTableRow } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Text,
  TextInput,
  Title,
  createStyles,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Dispatch, SetStateAction, useState } from "react";

const useStyles = createStyles((theme) => ({
  checkbox: {
    input: { cursor: "pointer" },
  },
  flexGrow: {
    [theme.fn.smallerThan("lg")]: {
      flexGrow: 1,
    },
  },
  clickableColumn: {
    "&:hover": {
      color:
        theme.colorScheme === "dark"
          ? theme.colors.gray[7]
          : theme.colors.gray[5],
    },
    cursor: "pointer",
  },
  nonClikableColumn: {
    cursor: "pointer",
  },
}));

type Props = {
  scicEmployeeList: SCICEmployeeTableRow[];
  setScicEmployeeList: Dispatch<SetStateAction<SCICEmployeeTableRow[]>>;
  setEmployeeCount: Dispatch<SetStateAction<number>>;
  selectedEmployee: SCICEmployeeTableRow | null;
  setSelectedEmployee: Dispatch<SetStateAction<SCICEmployeeTableRow | null>>;
  setIsCreatingEmployee: Dispatch<SetStateAction<boolean>>;
  isOwnerOrAdmin: boolean;
  activePage: number;
  setActivePage: Dispatch<SetStateAction<number>>;
  handleFetch: (page: number, search?: string) => void;
  isLoading: boolean;
  employeeCount: number;
};

const EmployeeList = ({
  scicEmployeeList,
  setIsCreatingEmployee,
  isOwnerOrAdmin,
  selectedEmployee,
  setSelectedEmployee,
  handleFetch,
  isLoading,
  employeeCount,
  activePage,
  setActivePage,
}: Props) => {
  const { classes } = useStyles();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();

  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = async (isEmpty?: boolean) => {
    if (activePage !== 1) {
      setActivePage(1);
    }
    handleFetch(1, isEmpty ? "" : search);
  };

  const handleColumnClick = async (hrisId: string) => {
    try {
      if (selectedEmployee?.scic_employee_hris_id_number === hrisId) return;

      if (["OWNER", "ADMIN"].includes(teamMember?.team_member_role || "")) {
        setSelectedEmployee(null);
        setIsFetchingEmployee(true);
        const { data } = await getSCICEmployeeList(supabaseClient, {
          search: hrisId,
          page: 1,
          limit: 1,
        });

        setSelectedEmployee(data[0]);
        setIsFetchingEmployee(false);
      }
    } catch (e) {
      setSelectedEmployee(null);
      setIsFetchingEmployee(false);
    }
  };

  const columnData: DataTableColumn<SCICEmployeeTableRow>[] = [
    {
      accessor: "scic_employee_hris_id_number",
      title: "HRIS NUMBER",
      render: ({ scic_employee_hris_id_number }) => (
        <Text
          className={classes.clickableColumn}
          onClick={() => {
            handleColumnClick(scic_employee_hris_id_number);
          }}
        >
          {scic_employee_hris_id_number}
        </Text>
      ),
    },
    {
      accessor: "scic_employee_first_name",
      title: "FIRST NAME",
      render: ({ scic_employee_first_name }) => (
        <Text
          className={classes.nonClikableColumn}
          //
        >
          {scic_employee_first_name}
        </Text>
      ),
    },
    {
      accessor: "scic_employee_middle_name",
      title: "MIDDLE NAME",
      render: ({ scic_employee_middle_name }) => (
        <Text className={classes.nonClikableColumn}>
          {scic_employee_middle_name}
        </Text>
      ),
    },
    {
      accessor: "scic_employee_last_name",
      title: "LAST NAME",
      render: ({ scic_employee_last_name }) => (
        <Text className={classes.nonClikableColumn}>
          {scic_employee_last_name}
        </Text>
      ),
    },
    {
      accessor: "scic_employee_suffix",
      title: "SUFFIX",
      render: ({ scic_employee_suffix }) => (
        <Text className={classes.clickableColumn}>{scic_employee_suffix}</Text>
      ),
    },
  ];

  return (
    <Box>
      <LoadingOverlay visible={isFetchingEmployee} />
      <Flex align="center" justify="space-between" wrap="wrap" gap="xs">
        <Group className={classes.flexGrow}>
          <Title m={0} p={0} order={3}>
            SCIC Employee
          </Title>
          <TextInput
            miw={250}
            placeholder="HRIS Number"
            rightSection={
              <ActionIcon onClick={() => search && handleSearch()}>
                <IconSearch size={16} />
              </ActionIcon>
            }
            value={search}
            onChange={async (e) => {
              setSearch(e.target.value);
              if (e.target.value === "") {
                handleSearch(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (search) {
                  handleSearch();
                }
              }
            }}
            maxLength={4000}
            className={classes.flexGrow}
          />
        </Group>
        <Group className={classes.flexGrow}>
          {isOwnerOrAdmin && (
            <Button
              rightIcon={<IconPlus size={16} />}
              className={classes.flexGrow}
              onClick={() => {
                setIsCreatingEmployee(true), setSelectedEmployee(null);
              }}
            >
              Add
            </Button>
          )}
        </Group>
      </Flex>
      <DataTable
        idAccessor="scic_employee_id"
        mt="xs"
        withBorder
        fw="bolder"
        c="dimmed"
        minHeight={390}
        fetching={isLoading}
        records={scicEmployeeList}
        columns={columnData.slice(isOwnerOrAdmin ? 0 : 1)}
        totalRecords={employeeCount}
        recordsPerPage={ROW_PER_PAGE}
        page={activePage}
        onPageChange={(page: number) => {
          setActivePage(page);
          handleFetch(page);
        }}
      />
    </Box>
  );
};

export default EmployeeList;
