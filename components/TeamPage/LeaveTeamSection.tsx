import { createAttachment } from "@/backend/api/post";
import { updateUser } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { UserWithSignatureType } from "@/utils/types";
import {
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import Compressor from "compressorjs";
import { useState } from "react";
import UploadSignature from "../UploadSignature/UploadSignature";

type Props = {
  onLeaveTeam: () => void;
};

const LeaveTeamSection = ({ onLeaveTeam }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const user = useUserProfile();
  const activeTeam = useActiveTeam();

  const [openCanvas, setOpenCanvas] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isUpdatingSignature, setIsUpdatingSignature] = useState(false);

  const [openFirstWarningModal, setOpenFirstWarningModal] = useState(false);
  const [openLeaveTeamFormModal, setOpenLeaveTeamFormModal] = useState(false);
  const [checkedLeave, setCheckedLeave] = useState(false);

  const handleOpenLeaveTeamFormModal = () => {
    setOpenFirstWarningModal(false);
    setOpenLeaveTeamFormModal(true);
  };

  const handleUploadSignature = async (signature: File | null) => {
    try {
      setIsUpdatingSignature(true);
      if (signature === null || !user) return;

      // compress image
      let compressedImage: File | null = null;
      if (signature.size > 50000) {
        compressedImage = await new Promise((resolve) => {
          new Compressor(signature, {
            quality: 0.2,
            success(result) {
              resolve(result as File);
            },
            error(error) {
              throw error;
            },
          });
        });
      }

      const { data: signatureAttachment, url } = await createAttachment(
        supabaseClient,
        {
          attachmentData: {
            attachment_name: signature.name,
            attachment_bucket: "USER_SIGNATURES",
            attachment_value: "",
            attachment_id: user?.user_signature_attachment_id
              ? user.user_signature_attachment_id
              : undefined,
          },
          file: compressedImage || signature,
          fileType: "s",
          userId: user.user_id,
        }
      );

      await updateUser(supabaseClient, {
        user_id: user?.user_id,
        user_signature_attachment_id: signatureAttachment.attachment_id,
      });

      setSignatureUrl(url);
      notifications.show({
        message: "Signature updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setOpenCanvas(false);
      setIsUpdatingSignature(false);
    }
  };

  return (
    <Paper mt="xl" p="lg" shadow="xs">
      <Title order={3}>Leave Team</Title>

      <Card mt="md" withBorder radius="md">
        <Card.Section inheritPadding py="xs">
          <Group position="apart">
            <Text>
              If you go ahead, you&apos;ll lose access to everything in this
              team. Please proceed with caution.
            </Text>
            <Button color="red" onClick={() => setOpenFirstWarningModal(true)}>
              Leave Team
            </Button>
          </Group>
        </Card.Section>
      </Card>

      {/* FIRST WARNING MODAL */}
      <Modal
        centered
        opened={openFirstWarningModal}
        onClose={() => setOpenFirstWarningModal(false)}
        title={`Leave team ${activeTeam.team_name}`}
      >
        <Stack spacing="xl" py="xs">
          <Group position="center" spacing="xs">
            <Text>
              Leaving the team will revoke your access to team-specific forms
              and requests.
            </Text>
          </Group>
          <Button variant="default" onClick={handleOpenLeaveTeamFormModal}>
            I want to leave this team
          </Button>
        </Stack>
      </Modal>

      {/* LEAVE TEAM FORM MODAL */}
      <Modal
        centered
        opened={openLeaveTeamFormModal}
        onClose={() => {
          setOpenLeaveTeamFormModal(false);
          setOpenCanvas(false);
          setSignatureFile(null);
          setCheckedLeave(false);
          setSignatureUrl("");
        }}
        title={`Leave team ${activeTeam.team_name}`}
      >
        <Text>
          Confirm your departure by drawing or uploading your signature.
        </Text>

        <UploadSignature
          onUploadSignature={handleUploadSignature}
          user={user as UserWithSignatureType}
          isUpdatingSignature={isUpdatingSignature}
          openCanvas={openCanvas}
          setOpenCanvas={setOpenCanvas}
          signatureFile={signatureFile}
          setSignatureFile={setSignatureFile}
          signatureUrl={signatureUrl}
        />

        <Stack spacing="xl" py="xs">
          <Checkbox
            label="I have read and understand the effects of this action."
            checked={checkedLeave}
            onChange={(e) => setCheckedLeave(e.currentTarget.checked)}
            required
          />

          <Button
            color="red"
            onClick={onLeaveTeam}
            disabled={Boolean(!checkedLeave || signatureUrl.length === 0)}
          >
            Leave this team
          </Button>
        </Stack>
      </Modal>
    </Paper>
  );
};

export default LeaveTeamSection;
