import { createAttachment, insertError } from "@/backend/api/post";
import { updateJobOfferStatus } from "@/backend/api/update";
import { useLoadingActions } from "@/stores/useLoadingStore";
import {
  BASE_URL,
  formatDate,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_IN_MB,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError } from "@/utils/functions";
import { getStatusToColor } from "@/utils/styling";
import { AttachmentTableRow, JobOfferTableRow } from "@/utils/types";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  FileInput,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useSession, useUser } from "@supabase/auth-helpers-react";
import { IconFile, IconMap, IconNote } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  jobOfferData: JobOfferTableRow & AttachmentTableRow;
  jobOfferStatus: string;
  setJobOfferStatus: Dispatch<SetStateAction<string>>;
  applicationInformationFormslyId: string | null;
};
const JobOffer = ({
  jobOfferData,
  jobOfferStatus,
  setJobOfferStatus,
  applicationInformationFormslyId,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const user = useUser();
  const session = useSession();
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const { setIsLoading } = useLoadingActions();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    reason: string;
  }>({ defaultValues: { reason: "" } });

  const {
    control,
    formState: { errors: acceptErrors },
    setValue: acceptSetValue,
    handleSubmit: acceptHandleSubmit,
  } = useForm<{
    signedJobOffer: File | null;
  }>({ defaultValues: { signedJobOffer: null } });

  useEffect(() => {
    const attachment_public_url = supabaseClient.storage
      .from(jobOfferData.attachment_bucket)
      .getPublicUrl(`${jobOfferData.attachment_value}`).data.publicUrl;
    setAttachmentUrl(attachment_public_url);
  }, [jobOfferData]);

  const handleUpdateJobOffer = async (
    action: string,
    response: {
      reason?: string;
      signedJobOffer?: File | null;
    }
  ) => {
    const { reason, signedJobOffer } = response;

    try {
      if (!user?.email) throw new Error("Missing user email");
      if (!applicationInformationFormslyId) return;
      setIsLoading(true);
      const newStatus = action === "Accept" ? "ACCEPTED" : "REJECTED";

      let attachmentId = "";
      if (signedJobOffer) {
        const { data } = await createAttachment(supabaseClient, {
          attachmentData: {
            attachment_name: signedJobOffer.name,
            attachment_bucket: "JOB_OFFER_ATTACHMENTS",
            attachment_value: "",
          },
          file: signedJobOffer,
          fileType: "sjo",
          userId: "",
          applicationInformationFormslyId,
        });
        attachmentId = data.attachment_id;
      }

      await updateJobOfferStatus(supabaseClient, {
        status: newStatus,
        requestReferenceId: jobOfferData.job_offer_request_id,
        title: jobOfferData.job_offer_title as string,
        attachmentId: attachmentId ?? jobOfferData.attachment_id,
        teamMemberId: jobOfferData.job_offer_team_member_id as string,
        projectAssignment: jobOfferData.job_offer_project_assignment as string,
        reason,
        projectAddress:
          jobOfferData.job_offer_project_assignment_address as string,
        manpowerLoadingId: jobOfferData.job_offer_manpower_loading_id as string,
        manpowerLoadingReferenceCreatedBy:
          jobOfferData.job_offer_manpower_loading_reference_created_by as string,
        compensation: jobOfferData.job_offer_compensation as string,
        email: user.email,
      });

      if (action === "Accept") {
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestReferenceId: jobOfferData.job_offer_request_id,
            email: user.email,
            token: `Bearer ${session?.access_token}`,
          }),
        };
        await fetch(`${BASE_URL}/api/formsly/accept-job-offer`, requestOptions);
      }

      setJobOfferStatus(newStatus);
      notifications.show({
        message: `Job offer ${action === "Accept" ? "accepted" : "rejected"}.`,
        color: "green",
      });
      modals.closeAll();
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
            error_function: "handleUpdateJobOffer",
            error_user_email: user?.email,
            error_user_id: user?.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const acceptModal = () =>
    modals.open({
      title: <Text>Are you sure you want to accept this job offer?</Text>,
      children: (
        <form
          onSubmit={acceptHandleSubmit((data) =>
            handleUpdateJobOffer("Accept", {
              signedJobOffer: data.signedJobOffer,
            })
          )}
        >
          <Controller
            control={control}
            name="signedJobOffer"
            render={({ field: { value, onChange } }) => (
              <FileInput
                label="Signed Job Offer"
                placeholder="Upload signed job offer"
                icon={<IconFile size={16} />}
                value={value as File | null}
                clearable
                multiple={false}
                onChange={onChange}
                error={acceptErrors.signedJobOffer?.message}
                required
              />
            )}
            rules={{
              required: {
                value: true,
                message: "Signed Job Offer is required",
              },
              validate: {
                fileSize: (value) => {
                  if (!value) return true;
                  const formattedValue = value as File;
                  return formattedValue.size !== undefined
                    ? formattedValue.size <= MAX_FILE_SIZE ||
                        `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`
                    : true;
                },
              },
            }}
          />
          <Group position="right" mt="xl">
            <Button
              onClick={() => {
                acceptSetValue("signedJobOffer", null);
                modals.closeAll();
              }}
              color="green"
              variant="default"
            >
              Cancel
            </Button>
            <Button color="green" type="submit">
              Confirm
            </Button>
          </Group>
        </form>
      ),
      centered: true,
    });

  const rejectModal = () =>
    modals.open({
      title: <Text>Are you sure you want to reject this job offer?</Text>,
      children: (
        <>
          <form
            onSubmit={handleSubmit((data) =>
              handleUpdateJobOffer("Reject", { reason: data.reason })
            )}
          >
            <TextInput
              label="Reason for rejection"
              {...register("reason")}
              error={errors.reason?.message}
              required={true}
            />
            <Group position="right" mt="xl">
              <Button
                onClick={() => {
                  setValue("reason", "");
                  modals.closeAll();
                }}
                color="red"
                variant="default"
              >
                Cancel
              </Button>
              <Button color="red" type="submit">
                Confirm
              </Button>
            </Group>
          </form>
        </>
      ),
      centered: true,
    });

  return (
    <Stack spacing="xl" sx={{ flex: 1 }}>
      <Title order={3}>Job Offer</Title>
      <Stack>
        <Group>
          <Text>Status: </Text>
          <Badge color={getStatusToColor(jobOfferStatus ?? "")}>
            {jobOfferStatus}
          </Badge>
          {jobOfferData.job_offer_date_created && (
            <Text color="dimmed">
              on {formatDate(new Date(jobOfferData.job_offer_date_created))}
            </Text>
          )}
        </Group>
        {jobOfferData.job_offer_attachment_id && (
          <>
            <Group>
              <Text>Job Title: </Text>
              <Title order={5}>{jobOfferData.job_offer_title}</Title>
            </Group>
            <Group>
              <Text>Project Assignment: </Text>
              <Title order={5}>
                {jobOfferData.job_offer_project_assignment}
              </Title>
            </Group>
            <Group>
              <Text>Project Address: </Text>
              <Title order={5}>
                {jobOfferData.job_offer_project_assignment_address}
              </Title>
              {jobOfferData.job_offer_project_latitude &&
              jobOfferData.job_offer_project_longitude ? (
                <ActionIcon
                  variant="outline"
                  color="blue"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${jobOfferData.job_offer_project_latitude},${jobOfferData.job_offer_project_longitude}`,
                      "_blank"
                    )
                  }
                >
                  <IconMap size={16} />
                </ActionIcon>
              ) : null}
            </Group>
            <Group>
              <Text>Compensation: </Text>
              <Title order={5}>{jobOfferData.job_offer_compensation}</Title>
            </Group>
            <Group>
              <Text>Job Offer: </Text>
              <Button
                variant="light"
                rightIcon={<IconFile size={16} />}
                onClick={() => {
                  window.open(attachmentUrl, "_blank");
                }}
              >
                View Job Offer
              </Button>
            </Group>
          </>
        )}
        {jobOfferStatus === "PENDING" && (
          <Group>
            <Text>Action: </Text>
            <Group spacing="xs">
              <Button color="green" w={100} onClick={() => acceptModal()}>
                Accept
              </Button>
              <Button color="red" w={100} onClick={() => rejectModal()}>
                Reject
              </Button>
            </Group>
          </Group>
        )}
        {jobOfferStatus === "ACCEPTED" ||
          (jobOfferStatus === "WITH ACCEPTED OFFER" && (
            <Alert mb="xl" title="Note!" icon={<IconNote size={16} />}>
              <Text>
                We appreciate you taking us up on our job offer. Kindly expect
                to get the message from HR.
              </Text>
            </Alert>
          ))}
        {jobOfferStatus === "WAITING FOR OFFER" && (
          <Alert mb="xl" title="Note!" icon={<IconNote size={16} />}>
            <Text>
              We’re finalizing your job offer. Please wait for further details
              and feel free to contact us if you have any questions. We
              appreciate your patience and look forward to updating you soon!
            </Text>
          </Alert>
        )}
        {jobOfferStatus === "FOR POOLING" && (
          <Alert mb="xl" title="Note!" icon={<IconNote size={16} />}>
            <Text>
              Thank you for your interest! We’ve placed your application in our
              candidate pool for future opportunities. While we don’t have a
              current opening that fits, we’re impressed with your
              qualifications and will keep you in mind for suitable roles.
              Please don’t hesitate to reach out if you have any questions.
            </Text>
          </Alert>
        )}
      </Stack>
    </Stack>
  );
};

export default JobOffer;
