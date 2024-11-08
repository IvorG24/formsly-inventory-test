import { getRequestList } from "@/backend/api/get";
import { useFormList } from "@/stores/useFormStore";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import {
  DEFAULT_REQUEST_LIST_LIMIT,
  REQUEST_LIST_HIDDEN_FORMS,
} from "@/utils/constant";
import {
  RequestListFilterValues,
  RequestListItemType,
  TeamProjectTableRow,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import RequestListFilter from "./RequestListFilter";
import RequestListTable from "./RequestListTable";

type Props = {
  isFormslyTeam: boolean;
  projectList: TeamProjectTableRow[];
};

const RequestListPage = ({ projectList }: Props) => {
  // const router = useRouter();
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const formList = useFormList();
  const teamMember = useUserTeamMember();
  const teamMemberList = useTeamMemberList();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(true);
  const [requestList, setRequestList] = useState<RequestListItemType[]>([]);
  const [requestListCount, setRequestListCount] = useState(0);
  const [localFilter, setLocalFilter] =
    useLocalStorage<RequestListFilterValues>({
      key: "request-list-filter",
      defaultValue: {
        search: "",
        requestor: [],
        approver: [],
        form: [],
        status: undefined,
        isAscendingSort: false,
        isApproversView: false,
        project: [],
      },
    });
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const filterFormMethods = useForm<RequestListFilterValues>({
    defaultValues: localFilter,
    mode: "onChange",
  });

  const filteredFormList = formList
    .filter(
      ({ form_name, form_is_public_form }) =>
        !REQUEST_LIST_HIDDEN_FORMS.includes(form_name) && !form_is_public_form
    )
    .map(({ form_name: label, form_id: value }) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const { handleSubmit, getValues, control, setValue } = filterFormMethods;

  const selectedFormFilter = useWatch({ name: "form", control });

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "request_date_created",
    direction: "desc",
  });
  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: "request-list-table-column-filter",
    defaultValue: [],
  });

  const tableColumnList = [
    { value: "request_id", label: "Request ID" },
    { value: "request_jira_id", label: "Request Jira ID" },
    { value: "request_jira_status", label: "JIRA Status" },
    { value: "request_otp_id", label: "OTP ID" },
    { value: "request_form_name", label: "Form Name" },
    { value: "request_ped_equipment_number", label: "PED Equipment Number" },
    { value: "request_status", label: "Status" },
    { value: "request_team_member_id", label: "Requested By" },
    { value: "request_signer", label: "Approver" },
    { value: "request_date_created", label: "Date Created" },
    { value: "view", label: "View" },
  ];

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const columnAccessor = () => {
    // requester
    if (sortStatus.columnAccessor === "user_id") {
      return `user_first_name ${sortStatus.direction.toUpperCase()}, user_last_name `;
    }
    return sortStatus.columnAccessor;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id || !teamMember) return;

      const {
        search,
        requestor,
        approver,
        form,
        status,
        isAscendingSort,
        isApproversView,
        project,
      } = getValues();

      const params = {
        teamId: activeTeam.team_id,
        page: page,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        requestor: requestor && requestor.length > 0 ? requestor : undefined,
        approver: approver && approver.length > 0 ? approver : undefined,
        form: form && form.length > 0 ? form : undefined,
        status: status && status.length > 0 ? status : undefined,
        project: project && project.length > 0 ? project : undefined,
        search: search,
        isApproversView,
        isAscendingSort,
        teamMemberId: teamMember.team_member_id,
        columnAccessor: columnAccessor(),
      };

      const { data, count } = await getRequestList(supabaseClient, params);

      setRequestList(data);
      setRequestListCount(count || 0);
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
    setActivePage(1);
    await handleFetchRequestList(1);
  };

  const handlePagination = async (page: number) => {
    setActivePage(page);
    await handleFetchRequestList(page);
  };

  useEffect(() => {
    if (activeTeam.team_id && teamMember && teamMemberList.length) {
      handlePagination(activePage);
    }
  }, [activeTeam, teamMember, teamMemberList]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={4}>Request List Page</Title>
          <Text>Manage your team requests here.</Text>
        </Box>
        {/* {isFormslyTeam ? (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="light">Spreadsheet View</Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name
                    )}/requests/spreadsheet-view`
                  )
                }
              >
                SSOT
              </Menu.Item>
              <Menu.Item
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name
                    )}/requests/lrf-spreadsheet-view`
                  )
                }
              >
                Liquidation
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : null} */}
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <RequestListFilter
              teamMemberList={teamMemberList}
              handleFilterForms={handleFilterForms}
              formList={filteredFormList}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              projectList={projectList}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              isFetchingRequestList={isFetchingRequestList}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <RequestListTable
            requestList={requestList}
            requestListCount={requestListCount}
            teamMemberList={teamMemberList}
            activePage={activePage}
            isFetchingRequestList={isFetchingRequestList}
            handlePagination={handlePagination}
            selectedFormFilter={selectedFormFilter}
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

export default RequestListPage;
