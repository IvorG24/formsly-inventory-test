import {
  checkSpreadsheetRowStatus,
  getTechnicalInterviewSummaryData,
} from "@/backend/api/get";
import { updateTechnicalInterviewStatus } from "@/backend/api/update";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  OptionType,
  TechnicalInterviewFilterFormValues,
  TechnicalInterviewSpreadsheetData,
} from "@/utils/types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconReload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import TechnicalInterviewColumnsMenu from "./TechnicalInterviewColumnsMenu";

import TechnicalInterviewFilterMenu from "./TechnicalInterviewFilterMenu";
import TechnicalInterviewSpreadsheetTable from "./TechnicalInterviewSpreadsheetTable/TechnicalInterviewSpreadsheetTable";

const initialSort = {
  sortBy: "technical_interview_date_created",
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
  technical_interview_date_created: {
    start: "",
    end: "",
  },
  technical_interview_status: [],
  technical_interview_schedule: {
    start: null,
    end: null,
  },
  assigned_hr: [],
  meeting_link: "",
};

type Props = {
  positionOptionList: OptionType[];
  technicalInterviewNumber: number;
  hrOptionList: OptionType[];
};

const TechnicalInterviewSpreadsheetView = ({
  positionOptionList,
  technicalInterviewNumber,
  hrOptionList,
}: Props) => {
  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const [data, setData] = useState<TechnicalInterviewSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "TechnicalInterviewColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<TechnicalInterviewFilterFormValues>({
    defaultValues:
      formDefaultValues as unknown as TechnicalInterviewFilterFormValues,
  });

  const fetchData = async (data?: TechnicalInterviewFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getTechnicalInterviewSummaryData(supabaseClient, {
        ...filterData,
        ...data,
        userId: user.user_id,
        limit: DEFAULT_NUMBER_SSOT_ROWS,
        page: data?.page ?? page,
        sort: data?.sort ?? sort,
        technicalInterviewNumber,
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
      formDefaultValues as unknown as TechnicalInterviewFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "technicalInterviewSpreadsheetView",
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
        "technicalInterviewSpreadsheetView"
      );
      if (storedData) {
        const filterData: TechnicalInterviewFilterFormValues =
          JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(
          filterData as TechnicalInterviewFilterFormValues
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

  const handleUpdateTechnicalInterviewStatus = async (
    status: string,
    data: TechnicalInterviewSpreadsheetData
  ) => {
    const isStatusMatched = await handleCheckRow(data);
    if (!isStatusMatched) return;

    setIsLoading(true);
    try {
      if (!teamMember?.team_member_id || !user) throw new Error();

      await updateTechnicalInterviewStatus(supabaseClient, {
        status,
        teamMemberId: teamMember.team_member_id,
        data,
        technicalInterviewNumber,
      });
      setData((prev) =>
        prev.map((prevData) => {
          if (prevData.hr_request_reference_id !== data.hr_request_reference_id)
            return prevData;

          return {
            ...prevData,
            technical_interview_status: status,
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

  const handleCheckRow = async (item: TechnicalInterviewSpreadsheetData) => {
    try {
      setIsLoading(true);
      const fetchedRow = await checkSpreadsheetRowStatus(supabaseClient, {
        id: item.technical_interview_id,
        status: item.technical_interview_status,
        table: "technical_interview",
      });
      if (fetchedRow) {
        setData((prev) =>
          prev.map((thisItem) => {
            if (thisItem.technical_interview_id !== item.technical_interview_id)
              return thisItem;
            return fetchedRow as unknown as TechnicalInterviewSpreadsheetData;
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
            Technical Interview {technicalInterviewNumber} Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <TechnicalInterviewFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
            />
          </FormProvider>
          <TechnicalInterviewColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <TechnicalInterviewSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        handleUpdateTechnicalInterviewStatus={
          handleUpdateTechnicalInterviewStatus
        }
        handleCheckRow={handleCheckRow}
      />
    </Stack>
  );
};

export default TechnicalInterviewSpreadsheetView;
