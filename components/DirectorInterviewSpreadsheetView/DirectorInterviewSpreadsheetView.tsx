import {
  checkSpreadsheetRowStatus,
  getDirectorInterviewSummaryData,
} from "@/backend/api/get";
import { updateDirectorInterviewStatus } from "@/backend/api/update";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  DirectorInterviewFilterFormValues,
  DirectorInterviewSpreadsheetData,
  OptionType,
} from "@/utils/types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconReload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import DirectorInterviewColumnsMenu from "./DirectorInterviewColumnsMenu";

import DirectorInterviewFilterMenu from "./DirectorInterviewFilterMenu";
import DirectorInterviewSpreadsheetTable from "./DirectorInterviewSpreadsheetTable/DirectorInterviewSpreadsheetTable";

const initialSort = {
  sortBy: "director_interview_date_created",
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
  director_interview_date_created: {
    start: "",
    end: "",
  },
  director_interview_status: [],
  director_interview_schedule: {
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

const DirectorInterviewSpreadsheetView = ({
  positionOptionList,
  hrOptionList,
}: Props) => {
  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const [data, setData] = useState<DirectorInterviewSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "DirectorInterviewColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<DirectorInterviewFilterFormValues>({
    defaultValues:
      formDefaultValues as unknown as DirectorInterviewFilterFormValues,
  });

  const fetchData = async (data?: DirectorInterviewFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getDirectorInterviewSummaryData(supabaseClient, {
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
      formDefaultValues as unknown as DirectorInterviewFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "directorInterviewSpreadsheetView",
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
      const storedData = localStorage.getItem(
        "directorInterviewSpreadsheetView"
      );
      if (storedData) {
        const filterData: DirectorInterviewFilterFormValues =
          JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(
          filterData as DirectorInterviewFilterFormValues
        );
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

  const handleUpdateDirectorInterviewStatus = async (
    status: string,
    data: DirectorInterviewSpreadsheetData
  ) => {
    const isStatusMatched = await handleCheckRow(data);
    if (!isStatusMatched) return;

    setIsLoading(true);
    try {
      if (!teamMember?.team_member_id || !user) throw new Error();

      await updateDirectorInterviewStatus(supabaseClient, {
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
            director_interview_status: status,
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

  const handleCheckRow = async (item: DirectorInterviewSpreadsheetData) => {
    try {
      setIsLoading(true);
      const fetchedRow = await checkSpreadsheetRowStatus(supabaseClient, {
        id: item.director_interview_id,
        status: item.director_interview_status,
        table: "director_interview",
      });
      if (fetchedRow) {
        setData((prev) =>
          prev.map((thisItem) => {
            if (thisItem.director_interview_id !== item.director_interview_id)
              return thisItem;
            return fetchedRow as unknown as DirectorInterviewSpreadsheetData;
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
            Director Interview Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <DirectorInterviewFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
            />
          </FormProvider>
          <DirectorInterviewColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <DirectorInterviewSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        handleUpdateDirectorInterviewStatus={
          handleUpdateDirectorInterviewStatus
        }
        handleCheckRow={handleCheckRow}
      />
    </Stack>
  );
};

export default DirectorInterviewSpreadsheetView;
