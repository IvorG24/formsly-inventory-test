import { getUserRequestList } from "@/backend/api/get";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/constant";
import {
  FormTableRow,
  RequestListItemType,
  UserRequestListFilterValues,
} from "@/utils/types";
import { Box, Container, Flex, Paper, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import UserRequestListFilter from "./UserRequestListFilter";
import UserRequestListTable from "./UserRequestListTable";

type Props = {
  formList: FormTableRow[];
};

const UserRequestListPage = ({ formList }: Props) => {
  const supabaseClient = useSupabaseClient();
  const currentUser = useUser();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [requestList, setRequestList] = useState<RequestListItemType[]>([]);
  const [requestListCount, setRequestListCount] = useState(0);
  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);
  const [localFilter, setLocalFilter] = useState<UserRequestListFilterValues>({
    search: "",
    form: [],
    status: undefined,
    isAscendingSort: false,
  });

  const filterFormMethods = useForm<UserRequestListFilterValues>({
    mode: "onChange",
  });

  const filteredFormList = formList
    .map(({ form_name: label, form_id: value }) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const { handleSubmit, getValues, setValue } = filterFormMethods;

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
    { value: "request_form_name", label: "Form Name" },
    { value: "request_status", label: "Status" },
    { value: "request_team_member_id", label: "Requested By" },
    { value: "request_signer", label: "Approver" },
    { value: "request_date_created", label: "Date Created" },
    // { value: "progress", label: "Progress" },
    { value: "view", label: "View" },
  ];

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const columnAccessor = () => {
    if (sortStatus.columnAccessor === "user_id") {
      return `user_first_name ${sortStatus.direction.toUpperCase()}, user_last_name `;
    }
    return sortStatus.columnAccessor;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      if (!currentUser?.email) return;
      setIsFetchingRequestList(true);

      const { search, status, form, isAscendingSort } = getValues();

      const params = {
        page: page,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        status: status && status.length > 0 ? status : undefined,
        search: search,
        isAscendingSort,
        columnAccessor: columnAccessor(),
        email: currentUser.email,
        form: form,
      };

      const { data, count } = await getUserRequestList(supabaseClient, params);
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

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchRequestList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [currentUser?.email]);

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchRequestList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={4}>Request List Page</Title>
          <Text>Manage your requests here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <UserRequestListFilter
              formList={filteredFormList}
              handleFilterForms={handleFilterForms}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              localFilter={localFilter}
              setLocalFilter={setLocalFilter}
              isFetchingRequestList={isFetchingRequestList}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          <UserRequestListTable
            requestList={requestList}
            requestListCount={requestListCount}
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

export default UserRequestListPage;
