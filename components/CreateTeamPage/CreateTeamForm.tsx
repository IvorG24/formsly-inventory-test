import { checkIfTeamNameExists } from "@/backend/api/get";
import { TeamMemberTableRow, TeamTableRow } from "@/utils/types";
import {
  Button,
  Center,
  Flex,
  LoadingOverlay,
  Paper,
  Stack,
  Switch,
  TextInput,
  Title,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import validator from "validator";
import UploadLogo from "../UploadLogo/UploadAvatar";

type CreateFormProps = {
  changeStep: Dispatch<SetStateAction<number>>;
  setNewTeam: Dispatch<SetStateAction<TeamTableRow | null>>;
  setOwnerData: Dispatch<SetStateAction<TeamMemberTableRow | null>>;
};

type FormValues = {
  teamName: string;
  teamLogo: File | null;
  isWithFormslyForms: boolean;
};

const isValidImage = (mimeType: string) => {
  return (
    (validator.isMimeType("image/jpeg") || validator.isMimeType("image/png")) &&
    mimeType.startsWith("image/")
  );
};

const CreateTeamForm = ({}: // changeStep,
// setNewTeam,
// setOwnerData,
CreateFormProps) => {
  // const user = useUserProfile();
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  // const { setTeamList } = useTeamActions();
  // const teamList = useTeamList();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  // const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // const handleCreateTeam = async (data: FormValues) => {
  //   try {
  //     setIsCreatingTeam(true);
  //     if (!user) {
  //       return notifications.show({
  //         message: "Invalid User. Please login and try again.",
  //         color: "red",
  //       });
  //     }
  //     const teamId = uuidv4();

  //     let imageUrl = "";
  //     if (data.teamLogo) {
  //       imageUrl = await uploadImage(supabaseClient, {
  //         id: teamId,
  //         image: data.teamLogo,
  //         bucket: "TEAM_LOGOS",
  //       });
  //     }

  //     const teamData = await createTeam(supabaseClient, {
  //       team_id: teamId,
  //       team_name: data.teamName.trim(),
  //       team_user_id: user.user_id,
  //       team_logo: imageUrl,
  //     });

  //     const ownerData = (
  //       await createTeamMember(supabaseClient, {
  //         team_member_team_id: teamData.team_id,
  //         team_member_user_id: user.user_id,
  //         team_member_role: "OWNER",
  //       })
  //     )[0];

  //     if (data.isWithFormslyForms) {
  //       await createFormslyPremadeForms(supabaseClient, {
  //         teamMemberId: ownerData.team_member_id,
  //       });
  //     }

  //     if (teamData && ownerData) {
  //       const updatedTeamList = [teamData, ...teamList];
  //       setNewTeam(teamData);
  //       setOwnerData(ownerData);
  //       setTeamList(updatedTeamList);
  //       changeStep((prev) => prev + 1);
  //     }
  //   } catch (e) {
  //     notifications.show({
  //       message: "Something went wrong. Please try again later.",
  //       color: "red",
  //     });
  //   } finally {
  //     setIsCreatingTeam(false);
  //   }
  // };

  const tempSubmit = () => {
    return notifications.show({
      message: "Create team is temporarily disabled",
      color: "gray",
    });
  };

  return (
    <Paper p="xl" mt="xl">
      <form onSubmit={handleSubmit(tempSubmit)}>
        <LoadingOverlay
          // visible={isCreatingTeam}
          visible={false}
          overlayBlur={2}
        />
        <Stack spacing="lg">
          <Title order={4}>Enter team details</Title>
          <Controller
            control={control}
            name="teamLogo"
            render={({ field: { onChange, value } }) => (
              <Center mt="lg">
                <UploadLogo
                  onChange={(value) => onChange(value)}
                  value={value}
                  onError={(error: string) =>
                    notifications.show({
                      message: error,
                      color: "red",
                    })
                  }
                />
              </Center>
            )}
            rules={{
              validate: (v) => {
                if (!v) {
                  return true;
                }
                return (
                  isValidImage(v?.type || "") ||
                  "Image is invalid. Please use jpeg and png images only."
                );
              },
            }}
          />

          <TextInput
            label="Team Name"
            w="100%"
            withAsterisk
            {...register("teamName", {
              required: true,
              validate: {
                isDuplicateTeamName: async (value: string) => {
                  const isExisting = await checkIfTeamNameExists(
                    supabaseClient,
                    {
                      teamName: value.trim(),
                    }
                  );
                  return isExisting ? "Team name is already taken." : true;
                },
                isAlphaNumericWithSpaces: (value: string) => {
                  const alphanumericWithSpacesRegex = /^[a-zA-Z0-9\s]*$/;

                  return !alphanumericWithSpacesRegex.test(value.trim())
                    ? "Team name must be alphanumeric (letters, numbers, and spaces only)."
                    : true;
                },
              },
            })}
            error={errors.teamName?.message}
          />

          <Controller
            control={control}
            name="isWithFormslyForms"
            render={({ field: { value, onChange } }) => (
              <Switch
                checked={value as boolean}
                onChange={(e) => onChange(e.currentTarget.checked)}
                mt="xs"
                sx={{ label: { cursor: "pointer" } }}
                error={errors.isWithFormslyForms?.message}
                label="Create with Formsly pre-made forms"
                onLabel="ON"
                offLabel="OFF"
              />
            )}
          />

          <Flex gap="md" wrap="wrap">
            <Button
              sx={{ flex: 1 }}
              size="md"
              variant="outline"
              leftIcon={<IconArrowLeft size={rem(14)} />}
              type="button"
              onClick={() => router.back()}
            >
              Go back
            </Button>
            <Button sx={{ flex: 1 }} size="md" type="submit">
              Create Team
            </Button>
          </Flex>
        </Stack>
      </form>
    </Paper>
  );
};

export default CreateTeamForm;
