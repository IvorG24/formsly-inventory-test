import { getHRPhoneInterviewSummaryData } from "@/backend/api/get";
import { updateHRPhoneInterviewStatus } from "@/backend/api/update";
import { useUserTeamMember } from "@/stores/useUserStore";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  HRPhoneInterviewFilterFormValues,
  HRPhoneInterviewSpreadsheetData,
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
import HRPhoneInterviewColumnsMenu from "./HRPhoneInterviewColumnsMenu";
import HRPhoneInterviewFilterMenu from "./HRPhoneInterviewFilterMenu";
import HRPhoneInterviewSpreadsheetTable from "./HRPhoneInterviewSpreadsheetTable/HRPhoneInterviewSpreadsheetTable";

const initialSort = {
  sortBy: "hr_phone_interview_date_created",
  order: "DESC",
};

const formDefaultValues = {
  position: "",
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
  hr_phone_interview_date_created: {
    start: "",
    end: "",
  },
  hr_phone_interview_status: "",
  hr_phone_interview_schedule: {
    start: null,
    end: null,
  },
};

type Props = {
  positionOptionList: OptionType[];
};

const HRPhoneInterviewSpreadsheetView = ({ positionOptionList }: Props) => {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const teamMember = useUserTeamMember();
  const [data, setData] = useState<HRPhoneInterviewSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "HRPhoneInterviewColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<HRPhoneInterviewFilterFormValues>({
    defaultValues:
      formDefaultValues as unknown as HRPhoneInterviewFilterFormValues,
  });

  const fetchData = async (data?: HRPhoneInterviewFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getHRPhoneInterviewSummaryData(supabaseClient, {
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
      formDefaultValues as unknown as HRPhoneInterviewFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "hrPhoneInterviewSpreadsheetView",
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
        "hrPhoneInterviewSpreadsheetView"
      );
      if (storedData) {
        const filterData: HRPhoneInterviewFilterFormValues =
          JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(filterData as HRPhoneInterviewFilterFormValues);
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

  const handleUpdateHRPhoneInterviewStatus = async (
    status: string,
    data: HRPhoneInterviewSpreadsheetData
  ) => {
    setIsLoading(true);
    try {
      if (!teamMember?.team_member_id) throw new Error();

      await updateHRPhoneInterviewStatus(supabaseClient, {
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
            hr_phone_interview_status: status,
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
            HR Phone Interview Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <HRPhoneInterviewFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
            />
          </FormProvider>
          <HRPhoneInterviewColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <HRPhoneInterviewSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        handleUpdateHRPhoneInterviewStatus={handleUpdateHRPhoneInterviewStatus}
      />
    </Stack>
  );
};

export default HRPhoneInterviewSpreadsheetView;
