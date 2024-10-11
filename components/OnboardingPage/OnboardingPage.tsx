import { getEmployeeName, getUserPendingInvitation } from "@/backend/api/get";
import {
  createTeamMemberReturnTeamName,
  createUserWithSSSID,
  uploadImage,
} from "@/backend/api/post";
import { escapeQuotes, formatTeamNameToUrlKey, isUUID } from "@/utils/string";
import { Container, Flex, LoadingOverlay, Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FirstStep from "./Steps/FirstStep";
import SecondStep from "./Steps/SecondStep";

export type OnboardUserParams = {
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_username: string;
  user_avatar: string;
  user_phone_number: string;
  user_job_title: string;
  user_employee_number: string;
  sss_number: string;
  sss_front_image: File | null;
  sss_back_image: File | null;
};

type Props = {
  user: User;
};

const OnboardingPage = ({ user }: Props) => {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  const totalSections = 2;

  const submitOnboardingMethods = useForm<OnboardUserParams>({
    defaultValues: { user_id: user.id, user_email: user.email, sss_number: "" },
    reValidateMode: "onBlur",
  });

  const { handleSubmit, setValue, trigger } = submitOnboardingMethods;

  const handleOnboardUser = async (data: OnboardUserParams) => {
    setIsLoading(true);
    try {
      const { inviteTeamId } = router.query;
      const isValidTeamId = isUUID(inviteTeamId);

      let imageUrl = "";
      if (avatarFile) {
        imageUrl = await uploadImage(supabaseClient, {
          id: data.user_id,
          image: avatarFile,
          bucket: "USER_AVATARS",
        });
      }

      let idFrontImage = "";
      if (data.sss_front_image) {
        idFrontImage = await uploadImage(supabaseClient, {
          id: `${data.user_id}-front`,
          image: data.sss_front_image,
          bucket: "SSS_ID_ATTACHMENTS",
        });
      }
      let idBackImage = "";
      if (data.sss_back_image) {
        idBackImage = await uploadImage(supabaseClient, {
          id: `${data.user_id}-back`,
          image: data.sss_back_image,
          bucket: "SSS_ID_ATTACHMENTS",
        });
      }

      await createUserWithSSSID(supabaseClient, {
        user_id: data.user_id,
        user_email: data.user_email.trim(),
        user_first_name: data.user_first_name.trim(),
        user_last_name: data.user_last_name.trim(),
        user_username: data.user_username.trim(),
        user_phone_number: data.user_phone_number,
        user_job_title: escapeQuotes(data.user_job_title.trim()),
        user_active_team_id: isValidTeamId ? `${inviteTeamId}` : "",
        user_avatar: imageUrl,
        user_employee_number: data.user_employee_number,
        sss_number: data.sss_number.replace(/\D/g, ""),
        sss_front_image_url: idFrontImage,
        sss_back_image_url: idBackImage,
      });

      const pendingInvitation = await getUserPendingInvitation(supabaseClient, {
        userEmail: data.user_email,
      });

      if (isValidTeamId) {
        const team = await createTeamMemberReturnTeamName(supabaseClient, {
          team_member_team_id: `${inviteTeamId}`,
          team_member_user_id: data.user_id,
        });

        const activeTeamNameToUrl = formatTeamNameToUrlKey(
          team[0].team.team_name ?? ""
        );
        await router.push(`/${activeTeamNameToUrl}/dashboard?onboarding=true`);
      } else if (pendingInvitation) {
        await router.push(
          `/invitation/${pendingInvitation.invitation_id}?onboarding=true`
        );
      } else {
        await router.push("/user/requests");
      }

      notifications.show({
        message: "Profile completed.",
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

  const handleEmployeeNumberChange = async (value: string | null) => {
    try {
      if (!value) return;
      const employee = await getEmployeeName(supabaseClient, {
        employeeId: value,
      });

      if (!employee) return;

      setValue("user_first_name", employee.scic_employee_first_name);
      setValue("user_last_name", employee.scic_employee_last_name);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch employee data",
        color: "orange",
      });
    }
  };

  const handleChangeStep = async (action: "PREVIOUS" | "NEXT") => {
    setIsLoading(true);
    switch (action) {
      case "PREVIOUS":
        setActiveStep((prev) => prev - 1);
        break;

      case "NEXT":
        const isValid = await trigger();
        if (isValid) {
          setActiveStep((prev) => prev + 1);
        }
        break;

      default:
        break;
    }
    setIsLoading(false);
  };

  const renderActiveStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <FirstStep
            activeStep={step}
            totalSections={totalSections}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleChangeStep={handleChangeStep}
            handleEmployeeNumberChange={handleEmployeeNumberChange}
          />
        );

      case 2:
        return (
          <SecondStep
            activeStep={step}
            totalSections={totalSections}
            handleChangeStep={handleChangeStep}
          />
        );

      default:
        return;
    }
  };

  return (
    <Container p={0} h="100%" fluid>
      <Flex h="100%" w="100%" justify="center" mt={{ sm: 45, lg: 75 }}>
        <Paper
          p={{ base: 24, sm: 32 }}
          shadow="sm"
          w={{ base: "100%", sm: 800 }}
          h={{ base: "100%", sm: 520 }}
          pos="relative"
        >
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <FormProvider {...submitOnboardingMethods}>
            <form onSubmit={handleSubmit(handleOnboardUser)}>
              {renderActiveStep(activeStep)}
            </form>
          </FormProvider>
        </Paper>
      </Flex>
    </Container>
  );
};

export default OnboardingPage;
