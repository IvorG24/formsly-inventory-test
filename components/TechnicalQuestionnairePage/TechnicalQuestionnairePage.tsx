import { getQuestionnaireList } from "@/backend/api/get";
import {
  checkQuestionnaireName,
  createQuestionnaire,
} from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/constant";
import {
  TeamMemberWithUserType,
  TechnicalAssessmentFilterValues,
  TechnicalAssessmentTableRow,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import TechnicalQuestionnaireFilter from "./TechnicalQuestionnaireFilter";
import TechnicalQuestionnaireTable from "./TechnicalQuestionnaireTable";

type Props = {
  teamMemberList: TeamMemberWithUserType[];
  isFormslyTeam: boolean;
};

const TechnicalQuestionnairePage = ({ teamMemberList }: Props) => {
  const activeTeam = useActiveTeam();
  const user = useUserProfile();

  const supabaseClient = useSupabaseClient();

  const teamMember = useUserTeamMember();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [questionnaireName, setQuestionnaireName] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [questionnnaireList, setQuestionnnaireList] = useState<
    TechnicalAssessmentTableRow[]
  >([]);
  const [questionnnaireListCount, setQuestionnnaireListCount] = useState(0);
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
    columnAccessor: "questionnaire_date_created",
    direction: "desc",
  });
  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "request-list-table-column-filter",
    defaultValue: [],
  });

  const tableColumnList = [
    { value: "questionnaire_id", label: "Questionnaire ID" },
    { value: "questionnaire_name", label: "Questionnaire Name" },
    {
      value: "questionnaire_date_created",
      label: "Questionnaire Date Created",
    },
    {
      value: "questionnaire_created_by",
      label: "Questionnaire Created By",
    },
    {
      value: "questionnaire_date_updated",
      label: "Questionnaire Date Updated",
    },
    {
      value: "questionnaire_updated_by",
      label: "Questionnaire Updated By",
    },
    { value: "view", label: "View" },
  ];

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchQuestionnaireList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      } else if (!teamMember) {
        console.warn(
          "RequestListPage handleFilterFormsError: team member id not found"
        );
        return;
      }
      const { search, creator, isAscendingSort } = getValues();

      const params = {
        teamId: activeTeam.team_id,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        page: page,
        search: search,
        isAscendingSort,
        creator: creator ? creator : "",
      };

      const data = await getQuestionnaireList(supabaseClient, params);

      setQuestionnnaireList(data.data);
      setQuestionnnaireListCount(data.count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch request list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchQuestionnaireList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchQuestionnaireList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleConfirm = async (questionnaireName: string) => {
    try {
      const formattedQuestionnaireName = questionnaireName.trim().toUpperCase();
      if (formattedQuestionnaireName === "") {
        notifications.show({
          message: "Questionnaire name is required.",
          color: "red",
        });
        return;
      }
      const checkIfExist = await checkQuestionnaireName(supabaseClient, {
        questionnaireName: formattedQuestionnaireName,
      });
      if (checkIfExist.length > 0) {
        notifications.show({
          message: "Questionnaire name already exists.",
          color: "orange",
        });
        return;
      }
      const data = await createQuestionnaire(supabaseClient, {
        questionnaireName: formattedQuestionnaireName,
        teamId: activeTeam.team_id,
        team_member_id: teamMember?.team_member_id ?? "",
      });
      const formattedData = {
        ...data,
        questionnaire_created_by: {
          user_id: user?.user_id,
          user_first_name: user?.user_first_name,
          user_last_name: user?.user_last_name,
          user_avatar: user?.user_avatar,
        },
      };
      setQuestionnaireName("");
      setQuestionnnaireList([
        formattedData as unknown as TechnicalAssessmentTableRow,
        ...questionnnaireList,
      ]);
      setQuestionnnaireListCount(questionnnaireListCount + 1);
      notifications.show({
        message: "Questionnaire created successfully.",
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        message: "Something went wrong.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam.team_id, teamMember]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={4}>Questionnaire List Page</Title>
          <Text>Manage your team requests here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <TechnicalQuestionnaireFilter
              setQuestionnaireName={setQuestionnaireName}
              questionnaireName={questionnaireName}
              open={open}
              close={close}
              opened={opened}
              handleConfirm={handleConfirm}
              teamMemberList={teamMemberList}
              handleFilterForms={handleFilterForms}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <TechnicalQuestionnaireTable
            setValue={setValue}
            questionnairList={questionnnaireList}
            questionnairListCount={questionnnaireListCount}
            teamMemberList={teamMemberList}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            sortStatus={sortStatus}
            setSortStatus={setSortStatus}
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

export default TechnicalQuestionnairePage;
