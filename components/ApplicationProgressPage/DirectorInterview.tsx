import { getInterview } from "@/backend/api/get";
import { insertError } from "@/backend/api/post";
import { formatDate } from "@/utils/constant";
import { isError } from "@/utils/functions";
import { getStatusToColor } from "@/utils/styling";
import { DirectorInterviewTableRow } from "@/utils/types";
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
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { IconNote } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import SchedulingCalendar from "./SchedulingCalendar";

type Props = {
  directorInterviewData: DirectorInterviewTableRow;
};
const DirectorInterview = ({ directorInterviewData: initialData }: Props) => {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  const [directorInterviewData, setDirectorInterviewData] =
    useState<DirectorInterviewTableRow>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState<string>(
    directorInterviewData.director_interview_status
  );
  const [isReadyToSelect, setIsReadyToSelect] = useState(false);

  const refetchData = async () => {
    try {
      setIsFetching(true);
      const targetId = directorInterviewData.director_interview_id;
      const data = await getInterview(supabaseClient, {
        interviewId: targetId,
        table: "director_interview",
      });
      setDirectorInterviewData(data);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "refetchData",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <LoadingOverlay visible={isLoading} />
      <Title order={3}>Director Interview</Title>
      <Stack>
        <Group>
          <Text>Date Created: </Text>
          <Title order={5}>
            {formatDate(
              new Date(
                directorInterviewData.director_interview_date_created ?? ""
              )
            )}
          </Title>
        </Group>
        <Group>
          <Text>Status: </Text>
          <Badge color={getStatusToColor(status ?? "")}>{status}</Badge>
          {directorInterviewData.director_interview_status_date_updated && (
            <Text color="dimmed">
              on{" "}
              {formatDate(
                new Date(
                  directorInterviewData.director_interview_status_date_updated
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
            meetingType="director_interview"
            dateCreated={directorInterviewData.director_interview_date_created}
            targetId={directorInterviewData.director_interview_id}
            intialDate={directorInterviewData.director_interview_schedule}
            status={directorInterviewData.director_interview_status}
            isRefetchingData={isFetching}
            setStatus={setStatus}
            setIsFetching={setIsFetching}
            setIsLoading={setIsLoading}
          />
        )}
        <Box mb={"xs"}>
          {!isReadyToSelect &&
            directorInterviewData.director_interview_status === "PENDING" && (
              <Alert title="Note!" icon={<IconNote size={16} />}>
                <Text>
                  Your Director Interview is scheduled. The meeting link will be
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

export default DirectorInterview;
