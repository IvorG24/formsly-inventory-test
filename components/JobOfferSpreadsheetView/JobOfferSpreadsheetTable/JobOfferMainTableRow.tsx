import {
  getHRProjectOptions,
  getJobHistory,
  getTeamMemberList,
} from "@/backend/api/get";
import { createAttachment } from "@/backend/api/post";
import { addJobOffer, updateJobOfferStatus } from "@/backend/api/update";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  useUserProfile,
  useUserTeamMember,
  useUserTeamMemberGroupList,
} from "@/stores/useUserStore";
import {
  formatDate,
  formatTime,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_IN_MB,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import { capitalizeEachWord, formatTeamNameToUrlKey } from "@/utils/string";
import { getStatusToColor, mobileNumberFormatter } from "@/utils/styling";
import {
  HRProjectType,
  JobOfferFormType,
  JobOfferHistoryType,
  JobOfferSpreadsheetData,
  OptionType,
  TeamMemberType,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Center,
  createStyles,
  FileInput,
  Flex,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Timeline,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconCheck,
  IconFile,
  IconHistory,
  IconHourglass,
  IconProgress,
  IconTag,
  IconX,
} from "@tabler/icons-react";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

const useStyles = createStyles((theme) => ({
  row: {
    "& td": {
      backgroundColor: theme.colors.blue[0],
    },
  },
}));

type Props = {
  item: JobOfferSpreadsheetData;
  hiddenColumnList: string[];
  setData: Dispatch<SetStateAction<JobOfferSpreadsheetData[]>>;
  positionOptionList: OptionType[];
  handleCheckRow: (item: JobOfferSpreadsheetData) => Promise<boolean>;
};

const JobOfferMainTableRow = ({
  item,
  hiddenColumnList,
  setData,
  positionOptionList,
  handleCheckRow,
}: Props) => {
  const { classes } = useStyles();
  const supabaseClient = createPagesBrowserClient<Database>();
  const team = useActiveTeam();
  const user = useUserProfile();
  const teamMember = useUserTeamMember();
  const teamMemberGroupList = useUserTeamMemberGroupList();
  const { setIsLoading } = useLoadingActions();

  const [
    jobOfferModalIsOpen,
    { open: openJobOfferModal, close: closeJobOfferModal },
  ] = useDisclosure(false);
  const [
    historyModalIsOpen,
    { open: openHistoryModal, close: closeHistoryModal },
  ] = useDisclosure(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [history, setHistory] = useState<JobOfferHistoryType[]>([]);
  const [isOverriding, setIsOverriding] = useState(false);
  const [teamMemberOptions, setTeamMemberOptions] = useState<TeamMemberType[]>(
    []
  );
  const [projectOptions, setProjectOptions] = useState<HRProjectType[]>([]);

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    clearErrors,
    register,
  } = useForm<JobOfferFormType>({
    defaultValues: {
      title: "",
      projectAssignment: "",
      projectAddress: "",
      manpowerLoadingId: "",
      manpowerLoadingReferenceCreatedBy: "",
      compensation: "",
      attachment: null,
      projectLatitude: undefined,
      projectLongitude: undefined,
    },
  });

  useEffect(() => {
    const fetchJobOfferData = async () => {
      try {
        setIsLoading(true);
        const teamMemberData = await getTeamMemberList(supabaseClient, {
          teamId: team.team_id,
        });
        setTeamMemberOptions(teamMemberData);
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

  useEffect(() => {
    if (!jobOfferModalIsOpen) {
      setValue("title", "");
      setValue("projectAssignment", "");
      setValue("projectAddress", "");
      setValue("manpowerLoadingId", "");
      setValue("manpowerLoadingReferenceCreatedBy", "");
      setValue("compensation", "");
      setValue("attachment", null);
      setValue("projectLatitude", undefined);
      setValue("projectLongitude", undefined);
      clearErrors();
    }
  }, [jobOfferModalIsOpen]);

  useEffect(() => {
    if (historyModalIsOpen) {
      const fetchHistory = async () => {
        try {
          setIsFetchingHistory(true);
          const historyData = await getJobHistory(supabaseClient, {
            requestId: item.hr_request_reference_id,
          });

          setHistory(historyData);
        } catch (e) {
          notifications.show({
            message: "Something went wrong. Please try again later.",
            color: "red",
          });
        } finally {
          setIsFetchingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [historyModalIsOpen]);

  const handleAddOffer = async (data: JobOfferFormType) => {
    const isJobOfferMatched = await handleCheckRow(item);
    if (!isJobOfferMatched) return;

    try {
      if (!teamMember?.team_member_id || !data.attachment || !user)
        throw new Error();

      setIsScheduling(true);

      const { data: attachmentData, url } = await createAttachment(
        supabaseClient,
        {
          attachmentData: {
            attachment_name: data.attachment.name,
            attachment_bucket: "JOB_OFFER_ATTACHMENTS",
            attachment_value: uuidv4(),
          },
          file: data.attachment,
        }
      );

      await addJobOffer(supabaseClient, {
        ...data,
        teamMemberId: teamMember.team_member_id,
        requestReferenceId: item.hr_request_reference_id,
        userEmail: item.application_information_email,
        applicationInformationFormslyId:
          item.application_information_request_id,
        attachmentId: attachmentData.attachment_id,
      });

      setData((prev) =>
        prev.map((prevItem) => {
          if (prevItem.hr_request_reference_id !== item.hr_request_reference_id)
            return prevItem;
          return {
            ...prevItem,
            job_offer_title: data.title,
            job_offer_attachment_url: url,
            job_offer_status: "PENDING",
            job_offer_attachment_id: attachmentData.attachment_id,
            job_offer_project_assignment: data.projectAssignment,
            assigned_hr: `${user.user_first_name} ${user.user_last_name}`,
            assigned_hr_team_member_id: teamMember.team_member_id,
          };
        })
      );
      notifications.show({
        message: "Job Offer Added.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const statusToIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <IconCheck size={14} />;
      case "WAITING FOR OFFER":
        return <IconTag size={14} />;
      case "REJECTED":
        return <IconX size={14} />;
      case "WAITING FOR OFFER":
        return <IconTag size={14} />;
      case "PENDING":
        return <IconProgress size={14} />;
      case "FOR POOLING":
        return <IconHourglass size={14} />;
    }
  };

  const handleUpdateJobOffer = async () => {
    const isJobOfferMatched = await handleCheckRow(item);
    if (!isJobOfferMatched) return;

    try {
      if (!teamMember || !user) throw new Error();

      setIsLoading(true);
      await updateJobOfferStatus(supabaseClient, {
        status: "FOR POOLING",
        requestReferenceId: item.hr_request_reference_id,
        title: "",
        attachmentId: "",
        teamMemberId: teamMember.team_member_id,
        projectAssignment: "",
        projectAddress: "",
        manpowerLoadingId: "",
        manpowerLoadingReferenceCreatedBy: "",
        compensation: "",
      });

      setData((prev) =>
        prev.map((prevItem) => {
          if (prevItem.hr_request_reference_id !== item.hr_request_reference_id)
            return prevItem;
          return {
            ...prevItem,
            job_offer_status: "FOR POOLING",
            assigned_hr: `${user.user_first_name} ${user.user_last_name}`,
            assigned_hr_team_member_id: teamMember.team_member_id,
          };
        })
      );
      notifications.show({
        message: `Applicant's status is set to "For Pooling".`,
        color: "green",
      });
      modals.closeAll();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const poolingModal = () =>
    modals.openConfirmModal({
      title: <Text>Please confirm your action.</Text>,
      children: (
        <Text>
          Are you sure you want to set the status of the applicant to &quot;For
          Pooling&quot;?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      centered: true,
      confirmProps: { color: "yellow" },
      onConfirm: async () => handleUpdateJobOffer(),
    });

  const isForPooling = !["ACCEPTED", "PENDING", "FOR POOLING"].includes(
    item.job_offer_status
  );
  const isForAddOffer = [
    "WAITING FOR OFFER",
    "REJECTED",
    "FOR POOLING",
  ].includes(item.job_offer_status);

  if (!team.team_name) return null;
  return (
    <tr className={classes.row}>
      <Modal
        opened={jobOfferModalIsOpen}
        onClose={closeJobOfferModal}
        title="Add Offer"
        centered
        closeOnEscape={false}
        closeOnClickOutside={false}
        withCloseButton={false}
        trapFocus={false}
      >
        <Stack spacing="xl">
          <Text color="dimmed" size={14}>
            Job Offer for <b>{item.application_information_full_name}</b>{" "}
            applying for <b>{item.position.replaceAll('"', "")}</b> position.
          </Text>

          <form
            id="offer"
            onSubmit={handleSubmit(async (data) => {
              await handleAddOffer(data);
              closeJobOfferModal();
            })}
          >
            <Stack spacing="xs">
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange } }) => {
                  return (
                    <Select
                      label="Job Title"
                      clearable
                      value={value}
                      required
                      searchable
                      onChange={onChange}
                      error={errors.title?.message}
                      data={positionOptionList}
                      withinPortal
                      autoFocus={false}
                    />
                  );
                }}
                rules={{
                  required: "Job title is required.",
                }}
              />
              <Controller
                control={control}
                name="projectAssignment"
                render={({ field: { value, onChange } }) => {
                  return (
                    <Select
                      label="Project Assignment"
                      clearable
                      value={value}
                      required
                      searchable
                      onChange={(value) => {
                        const projectAddress = projectOptions.find(
                          (project) => project.hr_project_name === value
                        )?.hr_project_address;

                        setValue(
                          "projectLatitude",
                          projectAddress && projectAddress?.address_latitude
                            ? projectAddress.address_latitude
                            : undefined
                        );
                        setValue(
                          "projectLongitude",
                          projectAddress && projectAddress?.address_longitude
                            ? projectAddress.address_longitude
                            : undefined
                        );
                        setValue(
                          "projectAddress",
                          [
                            projectAddress?.address_region,
                            projectAddress?.address_province,
                            projectAddress?.address_city,
                            projectAddress?.address_barangay,
                            projectAddress?.address_street,
                            projectAddress?.address_zip_code,
                          ].join(", ")
                        );
                        onChange(value);
                      }}
                      error={errors.projectAssignment?.message}
                      data={projectOptions.map((project) => {
                        return {
                          label: project.hr_project_name,
                          value: project.hr_project_name,
                        };
                      })}
                      withinPortal
                      autoFocus={false}
                    />
                  );
                }}
                rules={{
                  required: "Project assignment is required.",
                }}
              />
              <TextInput
                label="Project Address"
                {...register("projectAddress", {
                  required: "Project address is required.",
                })}
                required
                error={errors.projectAddress?.message}
                readOnly
                variant="filled"
              />
              <TextInput
                label="Manpower Loading ID"
                {...register("manpowerLoadingId", {
                  required: "Manpower loading ID is required.",
                })}
                required
                error={errors.manpowerLoadingId?.message}
              />
              <Controller
                control={control}
                name="manpowerLoadingReferenceCreatedBy"
                render={({ field: { value, onChange } }) => {
                  return (
                    <Select
                      label="Manpower Loading Reference Createdy By"
                      clearable
                      value={value}
                      required
                      searchable
                      onChange={onChange}
                      error={errors.projectAssignment?.message}
                      data={teamMemberOptions.map((teamMember) => {
                        return {
                          label: `${teamMember.team_member_user.user_first_name} ${teamMember.team_member_user.user_last_name}`,
                          value: `${teamMember.team_member_user.user_first_name} ${teamMember.team_member_user.user_last_name}`,
                        };
                      })}
                      withinPortal
                      autoFocus={false}
                    />
                  );
                }}
                rules={{
                  required: "Project assignment is required.",
                }}
              />
              <TextInput
                label="Compensation"
                {...register("compensation", {
                  required: "Compensation is required.",
                })}
                required
                error={errors.compensation?.message}
              />
              <Controller
                control={control}
                name="attachment"
                render={({ field: { value, onChange } }) => {
                  return (
                    <FileInput
                      label="Attachment"
                      clearable
                      value={value}
                      required
                      onChange={onChange}
                      error={errors.attachment?.message}
                      multiple={false}
                    />
                  );
                }}
                rules={{
                  required: "Attachment is required.",
                  validate: {
                    fileSize: (value) => {
                      if (!value) return true;
                      const formattedValue = value as File;
                      return formattedValue.size <= MAX_FILE_SIZE
                        ? true
                        : `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`;
                    },
                  },
                }}
              />
            </Stack>
          </form>

          <Group spacing="xs" position="right">
            <Button
              variant="outline"
              onClick={closeJobOfferModal}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button type="submit" form="offer" loading={isScheduling}>
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={historyModalIsOpen}
        onClose={closeHistoryModal}
        title="Job Offer History"
        centered
        size="lg"
      >
        {isFetchingHistory && (
          <Center p="xl">
            <Loader />
          </Center>
        )}
        {!isFetchingHistory && (
          <Stack spacing="xl" mt="xs">
            <ScrollArea h={500} type="auto" offsetScrollbars>
              <Timeline active={history.length} bulletSize={24} lineWidth={2}>
                {history.map((value) => {
                  return (
                    <Timeline.Item
                      title={value.job_offer_status}
                      key={value.job_offer_id}
                      color={getStatusToColor(value.job_offer_status)}
                      bullet={statusToIcon(value.job_offer_status)}
                    >
                      <Text size="xs" mt={4} color="dimmed">
                        {`${formatDate(
                          new Date(value.job_offer_date_created)
                        )} at ${formatTime(
                          new Date(value.job_offer_date_created)
                        )}`}
                      </Text>
                      <Stack spacing="xs" mt="md">
                        {value.job_offer_title && (
                          <Group>
                            <Text size={14}>Job Offer By: </Text>
                            <Title order={6}>
                              {
                                value.job_offer_team_member
                                  .team_member_full_name
                              }
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_title && (
                          <Group>
                            <Text size={14}>Job Title: </Text>
                            <Title order={6}>{value.job_offer_title}</Title>
                          </Group>
                        )}
                        {value.job_offer_project_assignment && (
                          <Group>
                            <Text size={14}>Project Assignment: </Text>
                            <Title order={6}>
                              {value.job_offer_project_assignment}
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_project_assignment_address && (
                          <Group>
                            <Text size={14}>Project Address: </Text>
                            <Title order={6}>
                              {value.job_offer_project_assignment_address}
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_manpower_loading_id && (
                          <Group>
                            <Text size={14}>Manpower Loading ID: </Text>
                            <Title order={6}>
                              {value.job_offer_manpower_loading_id}
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_manpower_loading_reference_created_by && (
                          <Group>
                            <Text size={14}>
                              Manpower Loading Reference Created By:{" "}
                            </Text>
                            <Title order={6}>
                              {
                                value.job_offer_manpower_loading_reference_created_by
                              }
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_compensation && (
                          <Group>
                            <Text size={14}>Compensation: </Text>
                            <Title order={6}>
                              {value.job_offer_compensation}
                            </Title>
                          </Group>
                        )}
                        {value.job_offer_attachment && (
                          <Group>
                            <Text size={14}>Job Offer: </Text>
                            <ActionIcon
                              variant="outline"
                              color="blue"
                              onClick={async () => {
                                const attachment_public_url =
                                  supabaseClient.storage
                                    .from(
                                      `${value?.job_offer_attachment?.attachment_bucket}`
                                    )
                                    .getPublicUrl(
                                      `${value?.job_offer_attachment?.attachment_value}`
                                    ).data.publicUrl;
                                window.open(attachment_public_url, "_blank");
                              }}
                              w={100}
                            >
                              <Flex align="center" justify="center" gap={5}>
                                <Text size={14}>View File</Text>{" "}
                                <IconFile size={14} />
                              </Flex>
                            </ActionIcon>
                          </Group>
                        )}
                        {value.job_offer_reason_for_rejection && (
                          <Group>
                            <Text size={14}>Reason for rejection: </Text>
                            <Title order={6}>
                              {value.job_offer_reason_for_rejection}
                            </Title>
                          </Group>
                        )}
                      </Stack>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </ScrollArea>
          </Stack>
        )}
      </Modal>

      {!hiddenColumnList.includes("position") && (
        <td>
          <Text>{safeParse(item.position)}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_full_name") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {capitalizeEachWord(item.application_information_full_name)}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_contact_number") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {mobileNumberFormatter(item.application_information_contact_number)}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_email") && (
        <td>
          <Text>{item.application_information_email}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.application_information_request_id
            }`}
          >
            {item.application_information_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("application_information_score") && (
        <td>
          <Text>{item.application_information_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("general_assessment_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.general_assessment_request_id
            }`}
          >
            {item.general_assessment_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("general_assessment_score") && (
        <td>
          <Text>{item.general_assessment_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("technical_assessment_request_id") && (
        <td>
          <Anchor
            target="_blank"
            href={`/${formatTeamNameToUrlKey(team.team_name)}/requests/${
              item.technical_assessment_request_id
            }`}
          >
            {item.technical_assessment_request_id}
          </Anchor>
        </td>
      )}
      {!hiddenColumnList.includes("technical_assessment_score") && (
        <td>
          <Text>{item.technical_assessment_score}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("job_offer_date_created") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>
            {formatDate(new Date(item.job_offer_date_created))}
          </Text>
        </td>
      )}
      {!hiddenColumnList.includes("job_offer_status") && (
        <td>
          <Badge
            variant="filled"
            color={getStatusToColor(item.job_offer_status)}
          >
            {item.job_offer_status}
          </Badge>
        </td>
      )}
      {!hiddenColumnList.includes("job_offer_attachment") && (
        <td>
          {item.job_offer_attachment && (
            <ActionIcon
              w="100%"
              variant="outline"
              color="blue"
              onClick={async () => {
                const attachment_public_url = supabaseClient.storage
                  .from(`${item?.job_offer_attachment?.attachment_bucket}`)
                  .getPublicUrl(
                    `${item?.job_offer_attachment?.attachment_value}`
                  ).data.publicUrl;
                window.open(attachment_public_url, "_blank");
              }}
            >
              <Flex align="center" justify="center" gap={5}>
                <Text size={14}>File</Text> <IconFile size={14} />
              </Flex>
            </ActionIcon>
          )}
        </td>
      )}
      {!hiddenColumnList.includes("job_offer_project_assignment") && (
        <td>
          <Text>{item.job_offer_project_assignment}</Text>
        </td>
      )}
      {!hiddenColumnList.includes("job_offer_history") && (
        <td>
          {item.job_offer_status !== "WAITING FOR OFFER" && (
            <ActionIcon
              w="100%"
              variant="outline"
              color="blue"
              onClick={openHistoryModal}
            >
              <Flex align="center" justify="center" gap={5}>
                <Text size={14}>History</Text> <IconHistory size={14} />
              </Flex>
            </ActionIcon>
          )}
        </td>
      )}
      {!hiddenColumnList.includes("assigned_hr") && (
        <td>
          <Text sx={{ whiteSpace: "nowrap" }}>{item.assigned_hr}</Text>
        </td>
      )}
      <td>
        {teamMember?.team_member_id !== item.assigned_hr_team_member_id &&
          teamMemberGroupList.includes("HUMAN RESOURCES") &&
          !isOverriding && (
            <Stack spacing="xs">
              {(isForPooling || isForAddOffer) && (
                <Button
                  w={140}
                  onClick={() =>
                    modals.openConfirmModal({
                      title: "Confirm Override",
                      centered: true,
                      children: (
                        <Text size="sm">
                          Are you sure you want to override this application?
                        </Text>
                      ),
                      labels: { confirm: "Confirm", cancel: "Cancel" },
                      onConfirm: async () => {
                        const result = await handleCheckRow(item);
                        if (result) {
                          setIsOverriding(true);
                        }
                      },
                    })
                  }
                >
                  Override
                </Button>
              )}
            </Stack>
          )}
        {(teamMember?.team_member_id === item.assigned_hr_team_member_id ||
          isOverriding) && (
          <Stack spacing="xs">
            {isForPooling && (
              <Button color="yellow" w={140} onClick={poolingModal}>
                For Pooling
              </Button>
            )}
            {isForAddOffer && (
              <Button color="green" w={140} onClick={openJobOfferModal}>
                Add Offer
              </Button>
            )}
          </Stack>
        )}
      </td>
    </tr>
  );
};

export default JobOfferMainTableRow;
