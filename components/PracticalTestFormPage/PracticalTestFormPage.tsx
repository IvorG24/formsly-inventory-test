import { getPracticalTestList } from "@/backend/api/get";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/constant";
import {
  PracticalTestType,
  TechnicalAssessmentFilterValues,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import PracticalTestFormFilter from "./PracticalTestFormFilter";
import PracticalTestFormTable from "./PracticalTestFormTable";

const PracticalTestFormPage = () => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const teamMemberList = useTeamMemberList();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [practicalTestList, setPracticalTestList] = useState<
    PracticalTestType[]
  >([]);
  const [practicalTestCount, setPracticalTestCount] = useState(0);
  const [localFilter, setLocalFilter] =
    useLocalStorage<TechnicalAssessmentFilterValues>({
      key: "technical-assessment-filter",
      defaultValue: {
        search: "",
        creator: "",
        isAscendingSort: false,
      },
    });
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const filterFormMethods = useForm<TechnicalAssessmentFilterValues>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue } = filterFormMethods;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "practical_test_date_created",
    direction: "desc",
  });
  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "request-list-table-column-filter",
    defaultValue: [],
  });

  const tableColumnList = [
    { value: "practical_test_id", label: "ID" },
    { value: "practical_test_label", label: "Label" },
    { value: "practical_test_passing_score", label: "Passing Score" },
    {
      value: "practical_test_date_created",
      label: "Date Created",
    },
    {
      value: "practical_test_created_by",
      label: "Created By",
    },
    {
      value: "practical_test_date_updated",
      label: "Date Updated",
    },
    {
      value: "practical_test_updated_by",
      label: "Updated By",
    },
    { value: "view", label: "View" },
  ];

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchPracticalTestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "PracticalTestFormPage handleFetchPracticalTestList: active team_id not found"
        );
        return;
      } else if (!teamMember) {
        console.warn(
          "PracticalTestFormPage handleFetchPracticalTestList: team member id not found"
        );
        return;
      }
      const { search, creator, isAscendingSort } = getValues();

      const params = {
        teamId: activeTeam.team_id,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        page: page,
        search: search,
        columnAccessor: sortStatus.columnAccessor,
        isAscendingSort: isAscendingSort,
        creator: creator ? creator : "",
      };

      const data = await getPracticalTestList(supabaseClient, params);

      setPracticalTestList(data.data);
      setPracticalTestCount(data.count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch practical test list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchPracticalTestList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchPracticalTestList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam.team_id, teamMember]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={4}>Practical Test Form List Page</Title>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <PracticalTestFormFilter
              teamMemberList={teamMemberList}
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              isFetchingRequestList={isFetchingRequestList}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <PracticalTestFormTable
            practicalTestList={practicalTestList}
            practicalTestCount={practicalTestCount}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
            setValue={setValue}
            checkIfColumnIsHidden={checkIfColumnIsHidden}
            showTableColumnFilter={showTableColumnFilter}
            setShowTableColumnFilter={setShowTableColumnFilter}
            listTableColumnFilter={listTableColumnFilter}
            setListTableColumnFilter={setListTableColumnFilter}
            tableColumnList={tableColumnList}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default PracticalTestFormPage;
