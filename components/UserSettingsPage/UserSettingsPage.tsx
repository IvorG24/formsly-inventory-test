import {
  createAttachment,
  resetPassword,
  uploadImage,
} from "@/backend/api/post";
import { useUserActions, useUserTeamMember } from "@/stores/useUserStore";
import { BASE_URL } from "@/utils/constant";
import { Database } from "@/utils/database";
import { editImageWithUUID } from "@/utils/functions";
import { trimObjectProperties } from "@/utils/string";
import { UserWithSignatureType } from "@/utils/types";
import {
  Alert,
  Box,
  Button,
  Container,
  CopyButton,
  Group,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { IconNote } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import UploadSignature from "../UploadSignature/UploadSignature";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";

export type PersonalInfoForm = {
  user_id: string;
  user_email: string;
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  user_phone_number: string;
  user_job_title: string;
  user_avatar: string;
};

export type ChangePasswordForm = {
  old_password: string;
  password: string;
  confirm_password: string;
};

type Props = {
  user: UserWithSignatureType;
};

const UserSettingsPage = ({ user }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const userData = useUser();

  const teamMember = useUserTeamMember();
  const { setUserAvatar, setUserInitials } = useUserActions();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdatingPersonalInfo, setIsUpdatingPersonalInfo] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [openCanvas, setOpenCanvas] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isUpdatingSignature, setIsUpdatingSignature] = useState(false);

  const userMetadata = userData?.app_metadata;
  const isUserEmailProviderOnly =
    userMetadata?.provider === "email" &&
    userMetadata.providers.includes("email") &&
    userMetadata.providers.length === 1;

  useEffect(() => {
    const getUserSignatureUrl = async () => {
      try {
        setIsUpdatingSignature(true);
        const {
          data: { publicUrl },
        } = supabaseClient.storage
          .from("USER_SIGNATURES")
          .getPublicUrl(user.user_signature_attachment.attachment_value);
        const url = `${publicUrl}?id=${uuidv4()}`;

        setSignatureUrl(url);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
        await router.push("/500");
      } finally {
        setIsUpdatingSignature(false);
      }
    };
    if (user.user_signature_attachment) {
      getUserSignatureUrl();
    }
  }, [user]);

  const personalInfoFormMethods = useForm<PersonalInfoForm>({
    defaultValues: {
      user_id: user.user_id,
      user_email: user.user_email,
      user_username: user.user_username,
      user_first_name: user.user_first_name,
      user_last_name: user.user_last_name,
      user_phone_number: user.user_phone_number || "",
      user_job_title: user.user_job_title || "",
      user_avatar: user.user_avatar || "",
    },
  });

  const changePasswordFormMethods = useForm<ChangePasswordForm>();

  const handleSavePersonalInfo = async (data: PersonalInfoForm) => {
    try {
      setIsUpdatingPersonalInfo(true);

      let imageUrl = "";
      if (avatarFile) {
        imageUrl = (
          await uploadImage(supabaseClient, {
            image: avatarFile,
            bucket: "USER_AVATARS",
            fileType: "a",
            userId: user.user_id,
          })
        ).publicUrl;
        setUserAvatar(imageUrl);
      }

      const { error } = await supabaseClient.rpc("update_user", {
        input_data: {
          userData: {
            ...trimObjectProperties({
              ...data,
              user_phone_number: `${data.user_phone_number}`,
            }),
            user_avatar: imageUrl ? imageUrl : data.user_avatar,
          },
          previousUsername:
            data.user_username !== user.user_username
              ? data.user_username
              : undefined,
        },
      });
      if (error) throw error;

      setUserInitials(
        (data.user_first_name[0] + data.user_last_name[0]).toUpperCase()
      );

      notifications.show({
        message: "Personal info updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsUpdatingPersonalInfo(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordForm) => {
    try {
      setIsUpdatingPassword(true);

      if (isUserEmailProviderOnly) {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: user.user_email,
          password: data.old_password,
        });

        if (error) throw error.message;
      }

      const { error } = await resetPassword(supabaseClient, data.password);
      if (error) throw error.message;

      notifications.show({
        message: "Password updated.",
        color: "green",
      });

      changePasswordFormMethods.reset();
    } catch (e) {
      let errorMessage = "";
      errorMessage = e as unknown as string;
      if (errorMessage === "Invalid login credentials")
        errorMessage = "Wrong old password.";
      notifications.show({
        message: errorMessage,
        color: "red",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUploadSignature = async (signature: File | null) => {
    try {
      setIsUpdatingSignature(true);
      if (signature === null) return;

      // compress image
      let compressedImage: File | null = null;
      if (signature.size > 500000) {
        compressedImage = await editImageWithUUID(signature);
      }
      const editedSignature = await editImageWithUUID(signature);
      const { data: signatureAttachment, url } = await createAttachment(
        supabaseClient,
        {
          attachmentData: {
            attachment_name: signature.name,
            attachment_bucket: "USER_SIGNATURES",
            attachment_value: "",
            attachment_id: user.user_signature_attachment_id
              ? user.user_signature_attachment_id
              : undefined,
          },
          file: compressedImage || editedSignature,
          fileType: "s",
          userId: user.user_id,
        }
      );

      const { error } = await supabaseClient.rpc("update_user", {
        input_data: {
          userData: {
            user_id: user.user_id,
            user_signature_attachment_id: signatureAttachment.attachment_id,
          },
          previousSignatureUrl: url,
        },
      });
      if (error) throw error;

      setSignatureUrl(url);
      notifications.show({
        message: "Signature updated.",
        color: "green",
      });
    } catch {
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
    <Container>
      <Title order={2}>User Settings</Title>

      <FormProvider {...personalInfoFormMethods}>
        <PersonalInfo
          onSavePersonalInfo={handleSavePersonalInfo}
          avatarFile={avatarFile}
          onAvatarFileChange={setAvatarFile}
          isUpdatingPersonalInfo={isUpdatingPersonalInfo}
          employeeNumber={user.user_employee_number}
        />
      </FormProvider>

      {teamMember && (
        <Box m="xl">
          <Alert
            icon={<IconNote size="1rem" />}
            title="Recruit Applicant!"
            color="blue"
          >
            <Group>
              <Text>Copy Link to Recruit & Earn Points</Text>
              <CopyButton
                value={`${BASE_URL}/public-form/16ae1f62-c553-4b0e-909a-003d92828036/create?recruiter=${teamMember.team_member_id}`}
              >
                {({ copied, copy }) => (
                  <Button
                    variant="outline"
                    color={copied ? "teal" : "blue"}
                    onClick={copy}
                  >
                    {copied ? "Copied link" : "Copy link"}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </Alert>
        </Box>
      )}

      <FormProvider {...changePasswordFormMethods}>
        <ChangePassword
          onChangePassword={handleChangePassword}
          isUpdatingPassword={isUpdatingPassword}
          isUserEmailProviderOnly={isUserEmailProviderOnly}
        />
      </FormProvider>

      <UploadSignature
        onUploadSignature={handleUploadSignature}
        user={user}
        isUpdatingSignature={isUpdatingSignature}
        openCanvas={openCanvas}
        setOpenCanvas={setOpenCanvas}
        signatureFile={signatureFile}
        setSignatureFile={setSignatureFile}
        signatureUrl={signatureUrl}
      />
    </Container>
  );
};

export default UserSettingsPage;
