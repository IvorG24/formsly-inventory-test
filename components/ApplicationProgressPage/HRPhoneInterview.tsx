import { getInterview } from "@/backend/api/get";
import { formatDate } from "@/utils/constant";
import { getStatusToColor } from "@/utils/styling";
import { HRPhoneInterviewTableRow } from "@/utils/types";
import {
  Alert,
  Badge,
  Box,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconNote } from "@tabler/icons-react";
import { useState } from "react";
import SchedulingCalendar from "./SchedulingCalendar";

type Props = {
  hrPhoneInterviewData: HRPhoneInterviewTableRow;
};
const HRPhoneInterview = ({ hrPhoneInterviewData: initialData }: Props) => {
  const supabaseClient = useSupabaseClient();
  const [hrPhoneInterviewData, setHRPhoneInterviewData] =
    useState<HRPhoneInterviewTableRow>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isReadyToSelect, setIsReadyToSelect] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState<string>(
    hrPhoneInterviewData.hr_phone_interview_status
  );

  const refetchData = async () => {
    try {
      setIsFetching(true);
      const targetId = hrPhoneInterviewData.hr_phone_interview_id;
      const data = await getInterview(supabaseClient, {
        interviewId: targetId,
        table: "hr_phone_interview",
      });
      setHRPhoneInterviewData(data);
    } catch (error) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <LoadingOverlay visible={isLoading} />
      <Title order={3}>HR Phone Interview</Title>
      <Stack>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(
                hrPhoneInterviewData.hr_phone_interview_date_created ?? ""
              )
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge color={getStatusToColor(status ?? "")}>{status}</Badge>
          {hrPhoneInterviewData.hr_phone_interview_status_date_updated && (
            <Text color="dimmed">
              on{" "}
              {formatDate(
                new Date(
                  hrPhoneInterviewData.hr_phone_interview_status_date_updated
                )
              )}
            </Text>
          )}
        </Group>
        {status && (
          <SchedulingCalendar
            setIsReadyToSelect={setIsReadyToSelect}
            isReadyToSelect={isReadyToSelect}
            refetchData={refetchData}
            meetingType="hr_phone_interview"
            dateCreated={hrPhoneInterviewData.hr_phone_interview_date_created}
            targetId={hrPhoneInterviewData.hr_phone_interview_id}
            intialDate={hrPhoneInterviewData.hr_phone_interview_schedule}
            status={hrPhoneInterviewData.hr_phone_interview_status}
            setIsLoading={setIsLoading}
            setStatus={setStatus}
            isRefetchingData={isFetching}
          />
        )}
        <Box mb={"xl"}>
          {!isReadyToSelect &&
            hrPhoneInterviewData.hr_phone_interview_status === "PENDING" && (
              <Alert title="Note!" icon={<IconNote size={16} />}>
                <Text>
                  Your HR Phone Interview is scheduled. The meeting link will be
                  made available on the exact date of the meeting. Please wait
                  for further details and let us know if you have any questions.
                  Looking forward to speaking with you soon!
                </Text>
              </Alert>
            )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default HRPhoneInterview;
