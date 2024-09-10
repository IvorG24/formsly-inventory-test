import { deleteInterviewOnlineMeeting } from "@/backend/api/delete";
import {
  getCurrentDate,
  getInterviewOnlineMeeting,
  getPhoneMeetingSlots,
  phoneInterviewValidation,
} from "@/backend/api/get";
import { createInterviewOnlineMeeting } from "@/backend/api/post";
import {
  cancelInterview,
  updateInterviewOnlineMeeting,
  updateSchedule,
} from "@/backend/api/update";
import { useUserProfile } from "@/stores/useUserStore";
import {
  APPLICATION_STATUS_CANCELLED,
  APPLICATION_STATUS_PENDING,
  formatDate,
  MEETING_TYPE_DETAILS,
} from "@/utils/constant";
import { formatTimeToLocal } from "@/utils/functions";
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
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import moment from "moment";
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

  const user = useUserProfile();
  const supabaseClient = useSupabaseClient();
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
          interviewOnlineMeeting.interview_meeting_provider_id
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
      const [time] = selectedSlot.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      const tempDate = new Date(selectedDate);
      tempDate.setHours(hours, minutes);
      const { status, assigned_hr_team_member_id } =
        await phoneInterviewValidation(supabaseClient, {
          interview_schedule: tempDate.toISOString(),
        });
      if (status === "success") {
        await Promise.all([
          handleCreateOrUpdateOnlineMeeting(
            tempDate,
            meetingType as MeetingType
          ),
          await updateSchedule(supabaseClient, {
            interviewSchedule: tempDate.toISOString(),
            targetId,
            status: APPLICATION_STATUS_PENDING,
            table: meetingType,
            meetingTypeNumber,
            team_member_id: assigned_hr_team_member_id,
          }),
        ]);
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
    meeting_type: MeetingType
  ) => {
    const { breakDuration, duration } = MEETING_TYPE_DETAILS[meeting_type];

    if (interviewOnlineMeeting) {
      if (process.env.NODE_ENV === "production") {
        await handleRescheduleOnlineMeeting(tempDate);
      } else {
        const newInterviewOnlineMeeting = await updateInterviewOnlineMeeting(
          supabaseClient,
          {
            ...testOnlineMeetingProps,
            interview_meeting_id: interviewOnlineMeeting.interview_meeting_id,
          }
        );
        setInterviewOnlineMeeting(newInterviewOnlineMeeting);
      }
    } else {
      // create online meeting
      if (process.env.NODE_ENV === "production") {
        await handleCreateOnlineMeeting(tempDate);
      } else {
        const newInterviewOnlineMeeting = await createInterviewOnlineMeeting(
          supabaseClient,
          {
            ...testOnlineMeetingProps,
            interview_meeting_break_duration: breakDuration,
            interview_meeting_duration: duration,
            interview_meeting_schedule: tempDate.toISOString(),
          }
        );

        setInterviewOnlineMeeting(newInterviewOnlineMeeting);
      }
    }
  };

  const handleCreateOnlineMeeting = async (tempDate: Date) => {
    const hrRepresentativeName = "John Doe"; // replace with actual hr rep name
    const hrRepresentativeEmail = "johndoe@gmail.com"; // replace with actual hr rep email
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
            address: hrRepresentativeEmail, // replace with actual hr rep email
            name: hrRepresentativeName,
          },
          type: "required",
        },
        {
          emailAddress: {
            address: user?.user_email, // replace with actual user
            name: userFullname,
          },
          type: "required",
        },
      ],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    };

    const createMeetingResponse = await fetch("/api/ms-graph/create-meeting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meetingDetails),
    });
    const createMeetingData = await createMeetingResponse.json();

    const meetingUrl = createMeetingData.onlineMeeting.joinUrl;

    const interviewOnlineMeeting: InterviewOnlineMeetingTableInsert = {
      interview_meeting_interview_id: targetId,
      interview_meeting_url: meetingUrl,
      interview_meeting_provider_id: createMeetingData.id,
      interview_meeting_break_duration: 0,
      interview_meeting_duration: 0,
      interview_meeting_schedule: "",
    };

    const newInterviewOnlineMeeting = await createInterviewOnlineMeeting(
      supabaseClient,
      interviewOnlineMeeting
    );

    setInterviewOnlineMeeting(newInterviewOnlineMeeting);

    const emailNotificationProps = {
      subject: `HR Phone Interview Schedule | Sta. Clara International Corporation`,
      userFullname,
      message: `
          <p>
            Your HR phone interview has been scheduled. Please find the details
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
          <p>
            <strong>Meeting Link</strong>
            <a href=${meetingUrl}>Interview Meeting Link</a>
          </p>
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
  };

  const handleRescheduleOnlineMeeting = async (tempDate: Date) => {
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

    const updateMeetingResponse = await fetch("/api/ms-graph/update-meeting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meetingDetails,
        meetingId: interviewOnlineMeeting.interview_meeting_provider_id,
      }),
    });
    const updateMeetingData = await updateMeetingResponse.json();
    const meetingUrl = updateMeetingData.onlineMeeting.joinUrl;

    const interviewOnlineMeetingProps: InterviewOnlineMeetingTableUpdate = {
      interview_meeting_url: meetingUrl,
      interview_meeting_provider_id: updateMeetingData.id,
      interview_meeting_id: interviewOnlineMeeting.interview_meeting_id,
    };

    const newInterviewOnlineMeeting = await updateInterviewOnlineMeeting(
      supabaseClient,
      interviewOnlineMeetingProps
    );

    setInterviewOnlineMeeting(newInterviewOnlineMeeting);

    const emailNotificationProps = {
      subject: `HR Phone Interview Schedule | Sta. Clara International Corporation`,
      userFullname,
      message: `
          <p>
            Your HR phone interview has been rescheduled. Please find the
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
          <p>
            <strong>Meeting Link</strong>
            <a href=${meetingUrl}>Interview Meeting Link</a>
          </p>
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

        {!isReadyToSelect && interviewOnlineMeeting && status === "PENDING" ? (
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
