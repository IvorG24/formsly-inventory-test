import { deleteInterviewOnlineMeeting } from "@/backend/api/delete";
import {
  getCurrentDate,
  getInterviewOnlineMeeting,
  getPhoneMeetingSlots,
  phoneInterviewValidation,
} from "@/backend/api/get";
import { createInterviewOnlineMeeting, insertError } from "@/backend/api/post";
import {
  cancelInterview,
  updateInterviewOnlineMeeting,
} from "@/backend/api/update";
import { useUserProfile } from "@/stores/useUserStore";
import {
  APPLICATION_STATUS_CANCELLED,
  APPLICATION_STATUS_PENDING,
  formatDate,
  MEETING_TYPE_DETAILS,
} from "@/utils/constant";
import { formatTimeToLocal, isError, JoyRideNoSSR } from "@/utils/functions";
import { capitalizeEachWord } from "@/utils/string";
import {
  InterviewOnlineMeetingTableInsert,
  InterviewOnlineMeetingTableRow,
  InterviewOnlineMeetingTableUpdate,
  MeetingType,
} from "@/utils/types";
import {
  Button,
  Flex,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { EmailNotificationTemplateProps } from "../Resend/EmailNotificationTemplate";

type SchedulingType = {
  meetingType:
    | "hr_phone_interview"
    | "trade_test"
    | "technical_interview"
    | "director_interview";
  meetingTypeNumber?: number;
  targetId: string;
  intialDate: string | null;
  refetchData: () => Promise<void>;
  status: string;
  isRefetchingData: boolean;
  dateCreated: string;
  isReadyToSelect: boolean;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
  setIsReadyToSelect: React.Dispatch<React.SetStateAction<boolean>>;
};

type HrSlotType = {
  slot_start: string;
  slot_end: string;
  isDisabled: boolean;
};

const SchedulingCalendar = ({
  setIsFetching,
  setIsReadyToSelect,
  isReadyToSelect,
  meetingType,
  meetingTypeNumber,
  targetId,
  intialDate,
  refetchData,
  status,
  dateCreated,
  isRefetchingData,
  setStatus,
  setIsLoading,
}: SchedulingType) => {
  const testOnlineMeetingProps = {
    interview_meeting_date_created: moment().toISOString(),
    interview_meeting_interview_id: targetId,
    interview_meeting_provider_id: uuidv4(),
    interview_meeting_url: "https://mock-url.com/meeting",
  };

  const { colors } = useMantineTheme();
  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (intialDate) {
      return new Date(intialDate);
    }
    return null;
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [hrSlot, setHrSlot] = useState<HrSlotType[]>([]);
  const [isReschedule, setIsReschedule] = useState(false);

  const [interviewOnlineMeeting, setInterviewOnlineMeeting] =
    useState<InterviewOnlineMeetingTableRow | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>();
  const appliedDate = moment(dateCreated);
  const minDate = moment(currentDate).format();
  const maxDate = appliedDate.clone().add(30, "days").toDate();
  const scheduleDate = intialDate ? moment(intialDate) : moment();
  const initialDate = moment(intialDate).format();
  const isDayBeforeSchedule =
    scheduleDate.startOf("day").diff(moment(minDate).startOf("day"), "days") ===
    1;
  const isAfterSchedule = scheduleDate
    .startOf("day")
    .isBefore(moment(minDate).startOf("day"));
  const isToday = moment(intialDate).isSame(
    moment(currentDate).format(),
    "day"
  );
  const cancelRestricted = moment(minDate).isSameOrAfter(
    moment(initialDate),
    "minutes"
  );

  const cancelInterviewHandler = async () => {
    if (cancelRestricted) {
      notifications.show({
        message: "Cannot cancel interview.",
        color: "orange",
      });
      return;
    }
    try {
      setIsLoading(true);

      if (interviewOnlineMeeting) {
        await handleCancelOnlineMeeting(
          interviewOnlineMeeting.interview_meeting_provider_id ?? ""
        );
      }

      await cancelInterview(supabaseClient, {
        targetId,
        status: APPLICATION_STATUS_CANCELLED,
        table: meetingType,
        meetingTypeNumber,
      });

      refetchData();
      notifications.show({
        message: "Interview cancellation successful!",
        color: "green",
      });
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
            error_function: "cancelInterviewHandler",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const rescheduleHandler = () => {
    setIsReschedule(true);
    setSelectedSlot("");
    setSelectedDate(null);
    setIsReadyToSelect(true);
  };

  const fetchTime = async ({
    slotDuration,
    breakDuration,
  }: {
    slotDuration: number;
    breakDuration: number;
  }) => {
    if (selectedDate !== null) {
      const start = moment(selectedDate).set({
        hour: 8,
        minute: 0,
        second: 0,
        millisecond: 0,
      }); // Set to 8 AM
      const end = moment(selectedDate).set({
        hour: 18,
        minute: 30,
        second: 0,
        millisecond: 0,
      }); // Set to 6:30 PM

      // meeting duration
      // technical = 15 mins
      // qualifying = 15 mins
      // phone = 5 mins

      // restriction
      // 10 mins rest between meeting
      // schedule limited to 30 days into the future

      const params = {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        meetingDuration: slotDuration * 60 * 1000,
        breakDuration: breakDuration * 60 * 1000,
      };

      try {
        setIsFetching(true);
        const data = await getPhoneMeetingSlots(supabaseClient, params);
        const newDate = await getCurrentDate(supabaseClient);
        setCurrentDate(newDate);
        setHrSlot(data);
      } catch (e) {
        notifications.show({
          message: "Error fetching meeting slots",
          color: "orange",
        });
        if (isError(e)) {
          await insertError(supabaseClient, {
            errorTableRow: {
              error_message: e.message,
              error_url: router.asPath,
              error_function: "fetchTime",
              error_user_email: user?.user_email,
              error_user_id: user?.user_id,
            },
          });
        }
      } finally {
        setIsFetching(false);
      }
    }
  };

  const handleCreateOrUpdateSchedule = async () => {
    if (!selectedDate) {
      notifications.show({
        message: "Date is required.",
        color: "orange",
      });
      return;
    }
    if (!selectedSlot) {
      notifications.show({
        message: "Time is required.",
        color: "orange",
      });
      return;
    }
    setIsLoading(true);
    setIsReadyToSelect(false);
    try {
      const [time, meridiem] = selectedSlot.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      const tempDate = new Date(selectedDate);
      tempDate.setHours(meridiem === "PM" ? hours + 12 : hours, minutes);

      const {
        status,
        assigned_hr_team_member_id,
        assigned_hr_full_name,
        assigned_hr_email,
      } = await phoneInterviewValidation(supabaseClient, {
        interview_schedule: tempDate.toISOString(),
      });

      if (status === "success") {
        await handleCreateOrUpdateOnlineMeeting(
          tempDate,
          meetingType as MeetingType,
          assigned_hr_full_name,
          assigned_hr_email,
          {
            interviewSchedule: tempDate.toISOString(),
            targetId,
            status: APPLICATION_STATUS_PENDING,
            table: meetingType,
            meetingTypeNumber,
            team_member_id: assigned_hr_team_member_id,
          }
        );
        setStatus(APPLICATION_STATUS_PENDING);
        setSelectedDate(tempDate);
      }
      await refetchData();

      setSelectedDate(tempDate);
      notifications.show({
        message: "Schedule updated successfully.",
        color: "green",
      });
      await refetchData();
    } catch (e) {
      notifications.show({
        message: "Error updating schedule",
        color: "orange",
      });
      fetchTime({ breakDuration: 10, slotDuration: 5 });
      setSelectedSlot("");
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleCreateOrUpdateSchedule",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removePrevTime = () => {
    const parseTimeString = (timeString: string): moment.Moment => {
      const [time, period] = timeString.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      const formattedHours = period === "PM" ? (hours % 12) + 12 : hours % 12;

      return moment().set({
        hour: formattedHours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
    };

    const today = moment().startOf("day");
    const selectedDateMoment = selectedDate
      ? moment(selectedDate).startOf("day")
      : null;

    if (selectedDateMoment && today.isSame(selectedDateMoment, "day")) {
      const now = moment();
      const currentTime = moment().set({
        hour: now.hour(),
        minute: now.minute(),
        second: 0,
        millisecond: 0,
      });

      const filteredSlots = hrSlot
        .map((slot) => ({
          value: formatTimeToLocal(slot.slot_start),
          label: formatTimeToLocal(slot.slot_start),
          disabled: slot.isDisabled,
          time: parseTimeString(formatTimeToLocal(slot.slot_start)),
        }))
        .filter((slot) => slot.time.isSameOrAfter(currentTime));

      // Remove the current first time slot
      if (filteredSlots.length > 0) {
        filteredSlots.shift();
      }

      return filteredSlots;
    } else {
      return hrSlot.map((slot) => ({
        value: formatTimeToLocal(slot.slot_start),
        label: formatTimeToLocal(slot.slot_start),
        disabled: slot.isDisabled,
      }));
    }
  };

  const handleCreateOrUpdateOnlineMeeting = async (
    tempDate: Date,
    meeting_type: MeetingType,
    assigned_hr_full_name: string,
    assigned_hr_email: string,
    updateScheduleProps: {
      interviewSchedule: string;
      targetId: string;
      status: string;
      table: string;
      meetingTypeNumber?: number;
      team_member_id: string;
    }
  ) => {
    const { breakDuration, duration } = MEETING_TYPE_DETAILS[meeting_type];

    if (interviewOnlineMeeting) {
      if (process.env.NODE_ENV === "production") {
        await handleRescheduleOnlineMeeting(tempDate, updateScheduleProps);
      } else {
        const newInterviewOnlineMeeting = await updateInterviewOnlineMeeting(
          supabaseClient,
          {
            ...testOnlineMeetingProps,
            interview_meeting_id: interviewOnlineMeeting.interview_meeting_id,
            updateScheduleProps,
          }
        );
        setInterviewOnlineMeeting(newInterviewOnlineMeeting);
      }
    } else {
      // create online meeting
      if (process.env.NODE_ENV === "production") {
        await handleCreateOnlineMeeting(
          tempDate,
          assigned_hr_full_name,
          assigned_hr_email,
          breakDuration,
          duration,
          updateScheduleProps
        );
      } else {
        const newInterviewOnlineMeeting = await createInterviewOnlineMeeting(
          supabaseClient,
          {
            ...testOnlineMeetingProps,
            interview_meeting_break_duration: breakDuration,
            interview_meeting_duration: duration,
            interview_meeting_schedule: tempDate.toISOString(),
            updateScheduleProps,
          }
        );

        setInterviewOnlineMeeting(newInterviewOnlineMeeting);
      }
    }
  };

  const handleCreateOnlineMeeting = async (
    tempDate: Date,
    assigned_hr_full_name: string,
    assigned_hr_email: string,
    breakDuration: number,
    duration: number,
    updateScheduleProps: {
      interviewSchedule: string;
      targetId: string;
      status: string;
      table: string;
      meetingTypeNumber?: number;
      team_member_id: string;
    }
  ) => {
    const hrRepresentativeName = capitalizeEachWord(assigned_hr_full_name);
    const hrRepresentativeEmail = assigned_hr_email;
    const formattedDate = moment(tempDate).format("dddd, MMMM Do YYYY, h:mm A");
    const userFullname = `${user?.user_first_name} ${user?.user_last_name}`;
    const meetingDetails = {
      subject: "HR Interview",
      body: {
        contentType: "HTML",
        content: `Interview with HR representative ${hrRepresentativeName} and applicant ${userFullname} on ${formattedDate}.`,
      },
      start: {
        dateTime: moment(tempDate).format(),
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: moment(tempDate).add(15, "m").format(),
        timeZone: "Asia/Manila",
      },
      attendees: [
        {
          emailAddress: {
            address: hrRepresentativeEmail,
            name: hrRepresentativeName,
          },
          type: "required",
        },
        {
          emailAddress: {
            address: user?.user_email,
            name: userFullname,
          },
          type: "required",
        },
        {
          emailAddress: {
            address: "recruitment@staclara.com.ph",
            name: "Sta Clara Recruitment",
          },
          type: "required",
        },
      ],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    };

    let meetingUrl = "";
    let meetingDataId = "";

    if (meetingType !== "hr_phone_interview") {
      const createMeetingResponse = await fetch(
        "/api/ms-graph/create-meeting",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingDetails),
        }
      );
      if (createMeetingResponse.status !== 200) throw new Error();

      const createMeetingData = await createMeetingResponse.json();

      meetingUrl = createMeetingData.onlineMeeting.joinUrl;
      meetingDataId = createMeetingData.id;
    }

    const emailNotificationProps = {
      subject: `${meetingType
        .replaceAll("_", " ")
        .toUpperCase()} Schedule | Sta. Clara International Corporation`,
      userFullname,
      message: `
          <p>
            Your ${meetingType
              .replaceAll("_", " ")
              .toUpperCase()} has been scheduled. Please find the details
            of your interview below:
          </p>
          <p>
            <strong>Date</strong>:{" "}
            <span>${moment(tempDate).format("dddd, MMMM Do YYYY")}</span>
          </p>
          <p>
            <strong>Time</strong>:{" "}
            <span>${moment(tempDate).format("h:mm A")}</span>
          </p>
          ${
            meetingUrl.length
              ? `
            <p>
              <strong>Meeting Link</strong>
              <a href=${meetingUrl}>Interview Meeting Link</a>
            </p>
            `
              : ""
          }
          <p>
            If you have any questions or need to make adjustments, please
            contact us at recruitment@staclara.com.ph. We look forward to
            speaking with you.
          </p>
      )`,
      closingPhrase: "Best regards,",
      signature: "Sta. Clara International Corporation Recruitment Team",
    };

    await handleSendEmailNotification(emailNotificationProps);

    const interviewOnlineMeeting: InterviewOnlineMeetingTableInsert = {
      interview_meeting_interview_id: targetId,
      interview_meeting_url: meetingUrl,
      interview_meeting_provider_id: meetingDataId,
      interview_meeting_break_duration: breakDuration,
      interview_meeting_duration: duration,
      interview_meeting_schedule: tempDate.toISOString(),
    };

    const newInterviewOnlineMeeting = await createInterviewOnlineMeeting(
      supabaseClient,
      {
        ...interviewOnlineMeeting,
        updateScheduleProps,
      }
    );
    setInterviewOnlineMeeting(newInterviewOnlineMeeting);
  };

  const handleRescheduleOnlineMeeting = async (
    tempDate: Date,
    updateScheduleProps: {
      interviewSchedule: string;
      targetId: string;
      status: string;
      table: string;
      meetingTypeNumber?: number;
      team_member_id: string;
    }
  ) => {
    if (!interviewOnlineMeeting) {
      notifications.show({
        message: "Cannot reschedule meeting because it does not exist",
        color: "red",
      });
      return;
    }
    const userFullname = `${user?.user_first_name} ${user?.user_last_name}`;
    const meetingDetails = {
      start: {
        dateTime: moment(tempDate).format(),
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: moment(tempDate).add(15, "m").format(),
        timeZone: "Asia/Manila",
      },
    };

    let meetingUrl = "";
    let meetingDataId = "";

    if (meetingType !== "hr_phone_interview") {
      const updateMeetingResponse = await fetch(
        "/api/ms-graph/update-meeting",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingDetails,
            meetingId: interviewOnlineMeeting.interview_meeting_provider_id,
          }),
        }
      );
      const updateMeetingData = await updateMeetingResponse.json();
      meetingUrl = updateMeetingData.onlineMeeting.joinUrl;
      meetingDataId = updateMeetingData.id;
    }

    const emailNotificationProps = {
      subject: `${meetingType
        .replaceAll("_", " ")
        .toUpperCase()} Schedule | Sta. Clara International Corporation`,
      userFullname,
      message: `
          <p>
            Your ${meetingType
              .replaceAll("_", " ")
              .toUpperCase()} has been rescheduled. Please find the
            details of your interview new interview below:
          </p>
          <p>
            <strong>Date</strong>:{" "}
            <span>${moment(tempDate).format("dddd, MMMM Do YYYY")}</span>
          </p>
          <p>
            <strong>Time</strong>:{" "}
            <span>${moment(tempDate).format("h:mm A")}</span>
          </p>
          ${
            meetingUrl.length
              ? `
              <p>
                <strong>Meeting Link</strong>
                <a href=${meetingUrl}>Interview Meeting Link</a>
              </p>
            `
              : ""
          }
          <p>
            If you have any questions or need to make adjustments, please
            contact us at recruitment@staclara.com.ph. We look forward to
            speaking with you.
          </p>
      )`,
      closingPhrase: "Best regards,",
      signature: "Sta. Clara International Corporation Recruitment Team",
    };

    await handleSendEmailNotification(emailNotificationProps);

    const interviewOnlineMeetingProps: InterviewOnlineMeetingTableUpdate = {
      interview_meeting_url: meetingUrl,
      interview_meeting_provider_id: meetingDataId,
      interview_meeting_id: interviewOnlineMeeting.interview_meeting_id,
      interview_meeting_schedule: tempDate.toISOString(),
    };

    const newInterviewOnlineMeeting = await updateInterviewOnlineMeeting(
      supabaseClient,
      {
        ...interviewOnlineMeetingProps,
        updateScheduleProps,
      }
    );
    setInterviewOnlineMeeting(newInterviewOnlineMeeting);
  };

  const handleCancelOnlineMeeting = async (meetingId: string) => {
    if (!interviewOnlineMeeting) {
      notifications.show({
        message: "Cannot cancel meeting because it does not exist",
        color: "red",
      });
      return;
    }
    try {
      if (process.env.NODE_ENV === "production") {
        await fetch("/api/ms-graph/cancel-meeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingId,
          }),
        });
      }

      await deleteInterviewOnlineMeeting(
        supabaseClient,
        interviewOnlineMeeting.interview_meeting_id
      );
      setStatus(APPLICATION_STATUS_CANCELLED);
    } catch (e) {
      notifications.show({
        message: "Failed to cancel MS Teams meeting",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleCancelOnlineMeeting",
            error_user_email: user?.user_email,
            error_user_id: user?.user_id,
          },
        });
      }
    }
  };

  const handleSendEmailNotification = async ({
    userFullname,
    subject,
    message,
    closingPhrase,
    signature,
  }: {
    userFullname: string;
    subject: string;
    message: string;
    closingPhrase: string;
    signature: string;
  }) => {
    const emailNotificationProps: {
      to: string;
      subject: string;
    } & EmailNotificationTemplateProps = {
      to: user?.user_email as string,
      subject: subject,
      greetingPhrase: `Dear ${userFullname},`,
      message: message,
      closingPhrase,
      signature,
    };

    await fetch("/api/resend/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailNotificationProps),
    });
  };

  const handleFetchInterviewOnlineMeeting = async () => {
    const currentInterviewOnlineMeeting = await getInterviewOnlineMeeting(
      supabaseClient,
      targetId
    );

    if (currentInterviewOnlineMeeting) {
      setInterviewOnlineMeeting(currentInterviewOnlineMeeting);
    }
  };

  const openCancelInterviewModal = () =>
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          Are you sure you want to cancel your {meetingType} interview?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: () => cancelInterviewHandler(),
      confirmProps: { color: "dark" },
      centered: true,
    });

  useEffect(() => {
    const handleFetchSlot = () => {
      const slotConfigurations: Record<
        string,
        { breakDuration: number; slotDuration: number }
      > = {
        hr_phone_interview: { breakDuration: 5, slotDuration: 15 },
        trade_test: { breakDuration: 5, slotDuration: 60 },
        technical_interview: { breakDuration: 5, slotDuration: 30 },
        director_interview: { breakDuration: 5, slotDuration: 30 },
      };

      const config = slotConfigurations[meetingType];

      if (config) {
        fetchTime(config);
        setSelectedSlot("");
      }
    };

    handleFetchSlot();
  }, [selectedDate]);

  useEffect(() => {
    handleFetchInterviewOnlineMeeting();
  }, [targetId]);

  return (
    <>
      <Flex direction="column" gap={10} mb={20}>
        <JoyRideNoSSR
          steps={[
            {
              target: ".set-schedule",
              content: (
                <Text>
                  You can now set a schedule. To continue, simply click the
                  &ldquo;Set Schedule&ldquo; button.
                </Text>
              ),
              disableBeacon: true,
            },
          ]}
          run={true}
          hideCloseButton
          disableCloseOnEsc
          disableOverlayClose
          hideBackButton
          styles={{ buttonNext: { backgroundColor: colors.blue[6] } }}
        />
        {intialDate && (
          <Stack>
            <Group>
              <Text>Scheduled Date:</Text>
              <Text component="a" fw="bold">
                {" "}
                {formatDate(new Date(intialDate))}
              </Text>
            </Group>
            <Group>
              <Text>Scheduled Time:</Text>
              <Text component="a" fw="bold">
                {" "}
                {moment(new Date(intialDate)).format("hh:mm A")}
              </Text>
            </Group>
          </Stack>
        )}
        {isReadyToSelect === false && intialDate && status === "PENDING" && (
          <>
            {(() => {
              return (
                <>
                  <Group>
                    <Text>Action: </Text>
                    <Group spacing="xs">
                      <Button
                        onClick={rescheduleHandler}
                        style={{ width: "max-content" }}
                        disabled={
                          isRefetchingData ||
                          isDayBeforeSchedule ||
                          isAfterSchedule ||
                          isToday
                        }
                        color="orange"
                      >
                        Reschedule
                      </Button>
                      <Button
                        onClick={openCancelInterviewModal}
                        style={{ width: "max-content" }}
                        disabled={isRefetchingData || cancelRestricted}
                        color="dark"
                      >
                        Cancel
                      </Button>
                    </Group>
                  </Group>
                </>
              );
            })()}
          </>
        )}

        {status === "WAITING FOR SCHEDULE" && (
          <Group>
            <Text>Schedule: </Text>
            <Group spacing="xs">
              <Button
                onClick={async () => {
                  setIsReadyToSelect(true);
                  setSelectedDate(null);
                }}
                disabled={!Boolean(!isReadyToSelect)}
                className="set-schedule"
              >
                Set Schedule
              </Button>
            </Group>

            {isReschedule && (
              <Button
                color="dark"
                onClick={() => {
                  setIsReschedule(false);
                  setIsReadyToSelect(true);
                }}
                disabled={isToday}
              >
                Cancel
              </Button>
            )}
          </Group>
        )}

        {isReadyToSelect && (
          <>
            <Group>
              <Text>Select Date:</Text>
              <DatePickerInput
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={moment(minDate).toDate()}
                maxDate={maxDate}
                clearable
                icon={<IconCalendar size={16} />}
                w={260}
              />
            </Group>

            <Group>
              <Text>Select Time:</Text>
              <Select
                data={removePrevTime()}
                value={selectedSlot}
                searchable
                onChange={(value) => {
                  refetchData();
                  setSelectedSlot(value as string);
                }}
                disabled={isRefetchingData}
                clearable
                icon={<IconClock size={16} />}
                w={260}
                rightSection={isRefetchingData && <Loader size={16} />}
              />
            </Group>
            {!isReschedule && (
              <Group position="left" align="center" spacing="xs">
                <Text style={{ marginBottom: 0 }}>Action:</Text>
                <Button
                  style={{ width: "min-content" }}
                  color="dark"
                  onClick={() => {
                    setIsReadyToSelect(false);
                  }}
                  disabled={isRefetchingData || isDayBeforeSchedule}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrUpdateSchedule}
                  disabled={isRefetchingData}
                >
                  Submit
                </Button>
              </Group>
            )}
            {isReschedule && (
              <Group position="left" align="center" spacing="xs">
                <Text style={{ marginBottom: 0 }}>Action:</Text>
                <Button
                  style={{ width: "min-content" }}
                  color="dark"
                  onClick={() => {
                    setIsReadyToSelect(false);
                  }}
                  disabled={isRefetchingData || isDayBeforeSchedule}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrUpdateSchedule}
                  disabled={isRefetchingData}
                >
                  Submit
                </Button>
              </Group>
            )}
          </>
        )}

        {!isReadyToSelect &&
        interviewOnlineMeeting &&
        status === "PENDING" &&
        interviewOnlineMeeting.interview_meeting_url ? (
          <Flex gap="xs" align="center" mt="sm">
            <Text>Online Meeting:</Text>
            <Button
              className="meeting-link"
              disabled={!moment(initialDate).isSame(moment(minDate), "day")}
              onClick={() =>
                window.open(
                  interviewOnlineMeeting.interview_meeting_url,
                  "_blank" // Opens the meeting URL in a new tab
                )
              }
            >
              Join Meeting
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </>
  );
};

export default SchedulingCalendar;
