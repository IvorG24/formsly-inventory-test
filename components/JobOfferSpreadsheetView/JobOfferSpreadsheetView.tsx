import {
  checkJobOfferRow,
  getHRProjectOptions,
  getJobOfferSummaryData,
} from "@/backend/api/get";
import { DEFAULT_NUMBER_SSOT_ROWS } from "@/utils/constant";
import {
  HRProjectType,
  JobOfferFilterFormValues,
  JobOfferSpreadsheetData,
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
import JobOfferColumnsMenu from "./JobOfferColumnsMenu";

import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserProfile,
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import JobOfferFilterMenu from "./JobOfferFilterMenu";
import JobOfferSpreadsheetTable from "./JobOfferSpreadsheetTable/JobOfferSpreadsheetTable";

const initialSort = {
  sortBy: "job_offer_date_created",
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
  job_offer_date_created: {
    start: "",
    end: "",
  },
  job_offer_status: [],
  job_offer_attachment: "",
  job_offer_project_assignment: "",
  job_offer_history: "",
  assigned_hr: [],
};

type Props = {
  positionOptionList: OptionType[];
  hrOptionList: OptionType[];
};

const JobOfferSpreadsheetView = ({
  positionOptionList,
  hrOptionList,
}: Props) => {
  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const team = useActiveTeam();
  const teamMember = useUserTeamMember();
  const teamMemberGroupList = useUserTeamMemberGroupList();

  const [data, setData] = useState<JobOfferSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "JobOfferColumns",
    defaultValue: [],
  });
  const teamMemberOptions = useTeamMemberList();
  const [projectOptions, setProjectOptions] = useState<HRProjectType[]>([]);

  const filterFormMethods = useForm<JobOfferFilterFormValues>({
    defaultValues: formDefaultValues as unknown as JobOfferFilterFormValues,
  });

  const fetchData = async (data?: JobOfferFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);

      const filterData = filterFormMethods.getValues();

      const newData = await getJobOfferSummaryData(supabaseClient, {
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
      formDefaultValues as unknown as JobOfferFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "jobOfferSpreadsheetView",
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
      const storedData = localStorage.getItem("jobOfferSpreadsheetView");
      if (storedData) {
        const filterData: JobOfferFilterFormValues = JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(filterData as JobOfferFilterFormValues);
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

  useEffect(() => {
    const fetchJobOfferData = async () => {
      try {
        setIsLoading(true);
        const projectData = await getHRProjectOptions(supabaseClient);
        setProjectOptions(projectData);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (team.team_id) {
      fetchJobOfferData();
    }
  }, [team.team_id]);

  const handleCheckRow = async (item: JobOfferSpreadsheetData) => {
    try {
      setIsLoading(true);
      const fetchedRow = await checkJobOfferRow(supabaseClient, {
        id: item.job_offer_id,
        status: item.job_offer_status,
        requestId: item.hr_request_reference_id,
      });

      if (fetchedRow) {
        setData((prev) =>
          prev.map((thisItem) => {
            if (thisItem.job_offer_id !== item.job_offer_id) return thisItem;
            return fetchedRow as unknown as JobOfferSpreadsheetData;
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
            Job Offer Spreadsheet View
          </Title>
          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => {
              setPage(1);
              fetchData({ page: 1 });
            }}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <JobOfferFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
              isLoading={isLoading}
            />
          </FormProvider>
          <JobOfferColumnsMenu
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
            columnList={Object.keys(formDefaultValues)}
          />
        </Group>
      </Box>
      <JobOfferSpreadsheetTable
        data={data}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
        setData={setData}
        positionOptionList={positionOptionList}
        handleCheckRow={handleCheckRow}
        user={user}
        teamMember={teamMember}
        team={team}
        projectOptions={projectOptions}
        teamMemberGroupList={teamMemberGroupList}
        teamMemberOptions={teamMemberOptions}
      />
    </Stack>
  );
};

export default JobOfferSpreadsheetView;
