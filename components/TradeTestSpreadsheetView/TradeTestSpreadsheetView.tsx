import {
  checkSpreadsheetRowStatus,
  getTradeTestSummaryData,
} from "@/backend/api/get";
import {
  overrideStep,
  updatePracticalTestEvaluator,
  updateTradeTestStatus,
} from "@/backend/api/update";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import {
  BASE_URL,
  DEFAULT_NUMBER_HR_SSOT_ROWS,
  formatDate,
  formatTime,
} from "@/utils/constant";
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
import { useEffect, useRef, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import TradeTestColumnsMenu from "./TradeTestColumnsMenu";

import { useActiveTeam } from "@/stores/useTeamStore";
import { isEqual } from "@/utils/functions";
import { formatTeamNameToUrlKey, startCase } from "@/utils/string";
import { EmailNotificationTemplateProps } from "../Resend/EmailNotificationTemplate";
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
  const team = useActiveTeam();
  const [data, setData] = useState<TradeTestSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "TradeTestColumns",
    defaultValue: [],
  });

  const prevSortRef = useRef<{
    sortBy: string;
    order: string;
  }>();

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
        limit: DEFAULT_NUMBER_HR_SSOT_ROWS,
        page: data?.page ?? page,
        sort: data?.sort ?? sort,
      });

      if (newData.length < DEFAULT_NUMBER_HR_SSOT_ROWS) {
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
        limit: DEFAULT_NUMBER_HR_SSOT_ROWS,
        sort,
      })
    );
  });

  useEffect(() => {
    const handleSorting = async () => {
      await fetchData({ sort, page: 1 });
    };
    if (user && user.user_id) {
      handleSorting();
    }
    if (user && user.user_id && !isEqual(prevSortRef.current, sort)) {
      prevSortRef.current = sort;
      handleSorting();
    }
  }, [sort]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedData = localStorage.getItem("tradeTestSpreadsheetView");
      if (storedData) {
        const filterData: TradeTestFilterFormValues = JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(filterData as TradeTestFilterFormValues);
      } else {
        await fetchData({
          page: 1,
        });
      }
    };
    if (user && user.user_id) {
      fetchInitialData();
    }
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

  const handleOverride = async (hrTeamMemberId: string, rowId: string) => {
    try {
      if (!teamMember) return;

      setIsLoading(true);
      await overrideStep(supabaseClient, {
        hrTeamMemberId: teamMember?.team_member_id,
        rowId,
        table: "trade_test",
      });

      setData((prev) =>
        prev.map((thisItem) => {
          if (thisItem.trade_test_id !== rowId) return thisItem;
          return {
            ...thisItem,
            assigned_hr: startCase(
              `${user?.user_first_name} ${user?.user_last_name}`
            ),
            assigned_hr_team_member_id: hrTeamMemberId,
          };
        })
      );

      notifications.show({
        message: "The applicant is successfully reassigned.",
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

  const handleAssignEvaluator = async (
    data: { evaluatorId: string; evaluatorName: string },
    practicalTestId: string,
    formslyId: string,
    candidateData: {
      name: string;
      position: string;
    },
    meetingLink: string,
    schedule: string
  ) => {
    try {
      setIsLoading(true);
      const link = `${BASE_URL}/${formatTeamNameToUrlKey(
        team.team_name
      )}/forms/55af2040-4905-4a42-810e-21aae916171b/create?practicalTestId=${practicalTestId}&teamMemberId=${
        data.evaluatorId
      }`;
      const notificationLink = `/${formatTeamNameToUrlKey(
        team.team_name
      )}/forms/55af2040-4905-4a42-810e-21aae916171b/create?practicalTestId=${practicalTestId}&teamMemberId=${
        data.evaluatorId
      }`;

      const evaluatorUserData = await updatePracticalTestEvaluator(
        supabaseClient,
        {
          link,
          notificationLink,
          teamMemberId: data.evaluatorId,
          practicalTestId,
          formslyId,
        }
      );

      const scheduledDate = new Date(schedule);
      const formattedDate = formatDate(scheduledDate);
      const formattedTime = formatTime(scheduledDate);

      const emailNotificationProps: {
        to: string;
        subject: string;
      } & EmailNotificationTemplateProps = {
        to: evaluatorUserData.user_email,
        subject: `Practical Test Evaluation - ${formattedDate} ${formattedTime} - ${startCase(
          candidateData.name
        )} - ${candidateData.position}`,
        greetingPhrase: `Dear ${startCase(
          evaluatorUserData.user_first_name
        )} ${startCase(evaluatorUserData.user_last_name)},`,
        message: `
              <p>
                This is to inform you that a practical test with ${startCase(
                  candidateData.name
                )} for the position of ${
          candidateData.position
        } has been scheduled with the following details below:
              </p>
              <p>
                <b>Date: </b>${formattedDate}
              </p>
              <p>
                <b>Time: </b>${formattedTime}
              </p>
              <p>
                <b>Meeting Link: </b><a href=${meetingLink}>${meetingLink}</a>
              </p>
              <p>
                Following the test, we kindly request your prompt insights and evaluation of the candidate to facilitate the next steps in the hiring process. Please complete the evaluation form through your Formsly account, or you can click the link below to proceed:
              </p>
              <p>
                <a href=${link}>${link}</a>
              </p>
              <p>
                Should you require any further information or adjustments, please don't hesitate to reach out to the Recruitment Team.
              </p>
              <p>
                Please note that this is an automated email; do not reply to this message.
              </p>
          `,
        closingPhrase: "Best regards,",
        signature: "Sta. Clara International Corporation Recruitment Team",
      };
      await fetch("/api/resend/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailNotificationProps),
      });

      setData((prev) =>
        prev.map((prevData) => {
          if (prevData.trade_test_id !== practicalTestId) return prevData;

          return {
            ...prevData,
            trade_test_assigned_evaluator: data.evaluatorName,
            trade_test_evaluator_team_member_id: data.evaluatorId,
            trade_test_evaluation_link: link,
          };
        })
      );
      notifications.show({
        message: "Evaluation updated.",
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
            Practical Test Spreadsheet View
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
            <TradeTestFilterMenu
              fetchData={fetchData}
              handleReset={handleReset}
              positionOptionList={positionOptionList}
              hrOptionList={hrOptionList}
              isLoading={isLoading}
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
        handleAssignEvaluator={handleAssignEvaluator}
        handleOverride={handleOverride}
      />
    </Stack>
  );
};

export default TradeTestSpreadsheetView;
