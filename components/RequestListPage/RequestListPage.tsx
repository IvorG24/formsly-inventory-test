import { getRequestList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { DEFAULT_REQUEST_LIST_LIMIT } from "@/utils/contant";
import {
  FormStatusType,
  RequestType,
  TeamMemberWithUserType,
} from "@/utils/types";
import {
  Box,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Pagination,
  Space,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import RequestCard from "./RequestCard/RequestCard";
import RequestListFilter from "./RequestListFilter";

type Props = {
  requestList: RequestType[];
  requestListCount: number;
  teamMemberList: TeamMemberWithUserType[];
};

export type FilterFormValues = {
  search: string;
  requestorList: string[];
  formList: string[];
  status?: FormStatusType[];
  isAscendingSort: boolean;
};

const RequestListPage = ({
  requestList,
  requestListCount,
  teamMemberList,
}: Props) => {
  const [visibleRequestList, setVisibleRequestList] = useState(requestList);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();

  const filterFormMethods = useForm<FilterFormValues>({
    defaultValues: { isAscendingSort: false },
    mode: "onChange",
  });

  const { handleSubmit, getValues } = filterFormMethods;

  const isUUID = (str: string) => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(str);
  };

  const handleFilterForms = async (
    {
      search,
      requestorList,
      formList,
      status,
      isAscendingSort,
    }: FilterFormValues = getValues()
  ) => {
    try {
      if (!isUUID(search)) {
        return notifications.show({
          message: "Search value is not a valid request id",
          color: "orange",
        });
      }
      setIsFetchingRequestList(true);
      const params = {
        teamId: activeTeam.team_id,
        page: 1,
        limit: DEFAULT_REQUEST_LIST_LIMIT,
        requestor:
          requestorList && requestorList.length > 0 ? requestorList : undefined,
        form: formList && formList.length > 0 ? formList : undefined,
        status: status && status.length > 0 ? status : undefined,
        search: search,
      };
      const { data, count } = await getRequestList(supabaseClient, {
        ...params,
        sort: isAscendingSort ? "ascending" : "descending",
      });
      setVisibleRequestList(data as RequestType[]);
      console.log(count);
    } catch (e) {
      notifications.show({
        title: "Something went wrong",
        message: "Please try again later",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  return (
    <Container fluid>
      <Box mb="sm">
        <Title order={4}>Request List Page</Title>
        <Text>Manage your team requests here.</Text>
      </Box>
      <Group spacing={4}>
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <RequestListFilter
              requestList={requestList}
              teamMemberList={teamMemberList}
              handleFilterForms={handleFilterForms}
            />
          </form>
        </FormProvider>
      </Group>
      <Space h="sm" />
      {visibleRequestList.length > 0 ? (
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "center", md: "flex-start" }}
          columnGap="md"
          rowGap="md"
          wrap="wrap"
          pos="relative"
        >
          <LoadingOverlay visible={isFetchingRequestList} overlayBlur={2} />
          {visibleRequestList.map((request) => (
            <RequestCard key={request.request_id} request={request} />
          ))}
        </Flex>
      ) : (
        <Text align="center" size={24} weight="bolder" color="dark.1">
          No request/s found
        </Text>
      )}
      <Pagination
        value={activePage}
        onChange={async (value) => {
          setActivePage(value);
          await handleFilterForms();
        }}
        total={Math.ceil(requestListCount / DEFAULT_REQUEST_LIST_LIMIT)}
        mt="xl"
        position="right"
      />
    </Container>
  );
};

export default RequestListPage;
