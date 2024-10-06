import {
  checkSpreadsheetRowStatus,
  getTradeTestSummaryData,
} from "@/backend/api/get";
import { updateTradeTestStatus } from "@/backend/api/update";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  OptionType,
  TradeTestFilterFormValues,
  TradeTestSpreadsheetData,
} from "@/utils/types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconReload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import TradeTestColumnsMenu from "./TradeTestColumnsMenu";

import TradeTestFilterMenu from "./TradeTestFilterMenu";
import TradeTestSpreadsheetTable from "./TradeTestSpreadsheetTable/TradeTestSpreadsheetTable";

const initialSort = {
  sortBy: "trade_test_date_created",
  order: "DESC",
};

const formDefaultValues = {
  position: [],
  application_information_full_name: "",
  application_information_contact_number: "",
  application_information_email: "",
  application_information_request_id: "",
  application_information_score: {
    start: null,
    end: null,
  },
  general_assessment_request_id: "",
  general_assessment_score: {
    start: null,
    end: null,
  },
  technical_assessment_request_id: "",
  technical_assessment_score: {
    start: null,
    end: null,
  },
  trade_test_date_created: {
    start: "",
    end: "",
  },
  trade_test_status: [],
  trade_test_schedule: {
    start: null,
    end: null,
  },
  assigned_hr: [],
  meeting_link: "",
};

type Props = {
  positionOptionList: OptionType[];
  hrOptionList: OptionType[];
};

const TradeTestSpreadsheetView = ({
  positionOptionList,
  hrOptionList,
}: Props) => {
  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const [data, setData] = useState<TradeTestSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "TradeTestColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<TradeTestFilterFormValues>({
    defaultValues: formDefaultValues as unknown as TradeTestFilterFormValues,
  });

  const fetchData = async (data?: TradeTestFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getTradeTestSummaryData(supabaseClient, {
        ...filterData,
        ...data,
        userId: user.user_id,
        limit: DEFAULT_NUMBER_SSOT_ROWS,
        page: data?.page ?? page,
        sort: data?.sort ?? sort,
      });

      if (newData.length < DEFAULT_NUMBER_SSOT_ROWS) {
        setIsMax(true);
      }

      if ((data?.page ?? page) === 1) {
        setData(newData);
      } else {
        setData((prev) => [...prev, ...newData]);
      }
    } catch (e) {
      notifications.show({
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (currentPage: number) => {
    setPage(currentPage);
    await fetchData({
      page: currentPage,
    });
  };

  const handleReset = () => {
    filterFormMethods.reset(
      formDefaultValues as unknown as TradeTestFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "tradeTestSpreadsheetView",
      JSON.stringify({
        ...filterData,
        limit: DEFAULT_NUMBER_SSOT_ROWS,
        sort,
      })
    );
  });

  useEffect(() => {
    const handleSorting = async () => {
      await fetchData({ sort, page: 1 });
    };
    handleSorting();
  }, [sort]);

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchData({
        page: 1,
      });
      const storedData = localStorage.getItem("tradeTestSpreadsheetView");
      if (storedData) {
        const filterData: TradeTestFilterFormValues = JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(filterData as TradeTestFilterFormValues);
        await fetchData({
          ...filterData,
        });
      } else {
        await fetchData({
          page: 1,
        });
      }
    };
    fetchInitialData();
  }, [user?.user_id]);

  const handleUpdateTradeTestStatus = async (
    status: string,
    data: TradeTestSpreadsheetData
  ) => {
    const isStatusMatched = await handleCheckRow(data);
    if (!isStatusMatched) return;

    setIsLoading(true);
    try {
      if (!teamMember?.team_member_id || !user) throw new Error();

      await updateTradeTestStatus(supabaseClient, {
        status,
        teamMemberId: teamMember.team_member_id,
        data,
      });
      setData((prev) =>
        prev.map((prevData) => {
          if (prevData.hr_request_reference_id !== data.hr_request_reference_id)
            return prevData;

          return {
            ...prevData,
            trade_test_status: status,
            assigned_hr: `${user.user_first_name} ${user.user_last_name}`,
            assigned_hr_team_member_id: teamMember.team_member_id,
          };
        })
      );
      notifications.show({
        message: "Status updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRow = async (item: TradeTestSpreadsheetData) => {
    try {
      setIsLoading(true);
      const fetchedRow = await checkSpreadsheetRowStatus(supabaseClient, {
        id: item.trade_test_id,
        status: item.trade_test_status,
        table: "trade_test",
      });
      if (fetchedRow) {
        setData((prev) =>
          prev.map((thisItem) => {
            if (thisItem.trade_test_id !== item.trade_test_id) return thisItem;
            return fetchedRow as unknown as TradeTestSpreadsheetData;
          })
        );
        notifications.show({
          message: "This row is already updated.",
          color: "orange",
        });
        return false;
      }
      return true;
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack pos="relative">
      <Box>
        <Group>
          <Title order={2} color="dimmed">
            Trade Test Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <TradeTestFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
            />
          </FormProvider>
          <TradeTestColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <TradeTestSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        handleUpdateTradeTestStatus={handleUpdateTradeTestStatus}
        handleCheckRow={handleCheckRow}
      />
    </Stack>
  );
};

export default TradeTestSpreadsheetView;
