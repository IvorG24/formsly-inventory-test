import { getBackgroundCheckSummaryData } from "@/backend/api/get";
import { updateBackgroundCheckStatus } from "@/backend/api/update";
import { useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  BackgroundCheckFilterFormValues,
  BackgroundCheckSpreadsheetData,
  OptionType,
} from "@/utils/types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { IconReload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import BackgroundCheckColumnsMenu from "./BackgroundCheckColumnsMenu";

import BackgroundCheckFilterMenu from "./BackgroundCheckFilterMenu";
import BackgroundCheckSpreadsheetTable from "./BackgroundCheckSpreadsheetTable/BackgroundCheckSpreadsheetTable";

const initialSort = {
  sortBy: "background_check_date_created",
  order: "DESC",
};

const formDefaultValues = {
  position: [],
  application_information_full_name: "",
  application_information_nickname: "",
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
  background_check_date_created: {
    start: "",
    end: "",
  },
  background_check_status: [],
  background_check_schedule: {
    start: null,
    end: null,
  },
  assigned_hr: [],
};

type Props = {
  positionOptionList: OptionType[];
  hrOptionList: OptionType[];
};

const BackgroundCheckSpreadsheetView = ({
  positionOptionList,
  hrOptionList,
}: Props) => {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const [data, setData] = useState<BackgroundCheckSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "BackgroundCheckColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<BackgroundCheckFilterFormValues>({
    defaultValues:
      formDefaultValues as unknown as BackgroundCheckFilterFormValues,
  });

  const fetchData = async (data?: BackgroundCheckFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getBackgroundCheckSummaryData(supabaseClient, {
        ...filterData,
        ...data,
        userId: user.id,
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
      formDefaultValues as unknown as BackgroundCheckFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "backgroundCheckSpreadsheetView",
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
      const storedData = localStorage.getItem("backgroundCheckSpreadsheetView");
      if (storedData) {
        const filterData: BackgroundCheckFilterFormValues =
          JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(filterData as BackgroundCheckFilterFormValues);
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
  }, [user?.id]);

  const handleUpdateBackgroundCheckStatus = async (
    status: string,
    data: BackgroundCheckSpreadsheetData
  ) => {
    setIsLoading(true);
    try {
      if (!teamMember?.team_member_id) throw new Error();

      await updateBackgroundCheckStatus(supabaseClient, {
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
            background_check_status: status,
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

  return (
    <Stack pos="relative">
      <Box>
        <Group>
          <Title order={2} color="dimmed">
            Background Check Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <BackgroundCheckFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
              isLoading={isLoading}
            />
          </FormProvider>
          <BackgroundCheckColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <BackgroundCheckSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        handleUpdateBackgroundCheckStatus={handleUpdateBackgroundCheckStatus}
        setData={setData}
      />
    </Stack>
  );
};

export default BackgroundCheckSpreadsheetView;
