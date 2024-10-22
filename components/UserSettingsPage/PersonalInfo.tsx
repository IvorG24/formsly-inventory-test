import { checkPhoneNumber } from "@/backend/api/get";
import { useUserIntials, useUserProfile } from "@/stores/useUserStore";
import { removeMultipleSpaces, toTitleCase } from "@/utils/string";
import {
  Button,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { usePrevious } from "@mantine/hooks";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Dispatch, SetStateAction } from "react";
import { Controller, useFormContext } from "react-hook-form";
import validator from "validator";
import UploadAvatar from "../UploadAvatar/UploadAvatar";
import { PersonalInfoForm } from "./UserSettingsPage";

type Props = {
  onSavePersonalInfo: (data: PersonalInfoForm) => void;
  avatarFile: File | null;
  onAvatarFileChange: Dispatch<SetStateAction<File | null>>;
  isUpdatingPersonalInfo: boolean;
  employeeNumber?: string | null;
};

const PersonalInfo = ({
  onSavePersonalInfo,
  avatarFile,
  onAvatarFileChange,
  isUpdatingPersonalInfo,
  employeeNumber,
}: Props) => {
  const supabaseClient = useSupabaseClient();
  const user = useUserProfile();
  const userInitials = useUserIntials();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, isDirty },
    setValue,
  } = useFormContext<PersonalInfoForm>();

  const prevAvatarFile = usePrevious(avatarFile);
  const isAvatarChanged = avatarFile !== prevAvatarFile;

  return (
    <Container p={0} mt="xl" pos="relative" fluid>
      <LoadingOverlay
        visible={isUpdatingPersonalInfo}
        overlayBlur={2}
        transitionDuration={500}
      />
      <Paper p="lg" shadow="xs">
        <form onSubmit={handleSubmit(onSavePersonalInfo)}>
          <Stack spacing={12}>
            <Text weight={600}>Personal Info</Text>

            <Divider mt={-12} />

            <Flex mt="md" justify="space-between" gap="xl" wrap="wrap">
              <UploadAvatar
                // {...register("user_avatar")}
                src={getValues("user_avatar")}
                value={avatarFile}
                onChange={onAvatarFileChange}
                onError={(error: string) =>
                  setError("user_avatar", { message: error })
                }
                initials={userInitials}
                id={user?.user_id}
              />
              {/* <Button size="xs">View Public Profile</Button> */}
            </Flex>

            <Flex direction={{ base: "column", md: "row" }} gap={16}>
              <TextInput
                w="100%"
                label="Email"
                {...register("user_email", {
                  required: true,
                  validate: {
                    isEmail: (value: string) =>
                      validator.isEmail(value) || "Email is invalid",
                  },
                })}
                error={errors.user_email?.message}
                disabled
              />
              <TextInput
                w="100%"
                label="Employee Number"
                disabled={true}
                value={employeeNumber ?? "---"}
              />
            </Flex>

            <Flex direction={{ base: "column", md: "row" }} gap={16}>
              <TextInput
                w="100%"
                label="First Name"
                {...register("user_first_name", {
                  onChange: (e) => {
                    const format = toTitleCase(
                      removeMultipleSpaces(e.currentTarget.value)
                    );
                    setValue("user_first_name", format);
                  },
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must have at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "First name must be shorter than 100 characters",
                  },
                })}
                error={errors.user_first_name?.message}
              />

              <TextInput
                w="100%"
                label="Last Name"
                {...register("user_last_name", {
                  onChange: (e) => {
                    const format = toTitleCase(
                      removeMultipleSpaces(e.currentTarget.value)
                    );
                    setValue("user_last_name", format);
                  },
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must have at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Last name must be shorter than 100 characters",
                  },
                })}
                error={errors.user_last_name?.message}
              />
            </Flex>

            <Flex direction={{ base: "column", md: "row" }} gap={16}>
              <Controller
                control={control}
                name="user_phone_number"
                rules={{
                  validate: {
                    checkNumberOfCharacter: (value) => {
                      const stringifiedValue = value ? `${value}` : "";

                      if (stringifiedValue.length !== 10) {
                        return "Invalid Mobile Number";
                      }
                      return true;
                    },
                    isUnique: async (value) => {
                      if (!value) return;
                      const numberOnly = value.replace(/\D/g, "");
                      const result = await checkPhoneNumber(supabaseClient, {
                        phoneNumber: numberOnly.trim(),
                      });
                      return result ? result : "Mobile Number is already used";
                    },
                    startsWith: (value) => {
                      return `${value}`[0] === "9"
                        ? true
                        : "Contact number must start with 9";
                    },
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    label="Mobile Number"
                    required
                    placeholder="9123456789"
                    maxLength={10}
                    value={value}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      const numberOnly = value.replace(/\D/g, "");

                      if (numberOnly.length === 10) {
                        onChange(numberOnly);
                        return;
                      } else {
                        onChange(numberOnly);
                        return;
                      }
                    }}
                    error={errors.user_phone_number?.message}
                    icon={"+63"}
                    w="100%"
                  />
                )}
              />

              <TextInput
                w="100%"
                label="Job Title"
                {...register("user_job_title", {
                  onChange: (e) => {
                    const format = removeMultipleSpaces(e.currentTarget.value);
                    setValue("user_job_title", format);
                  },
                  minLength: {
                    value: 2,
                    message: "Job title must have at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Job title must be shorter than 100 characters",
                  },
                })}
                error={errors.user_job_title?.message}
              />
            </Flex>

            <Button
              type="submit"
              size="xs"
              sx={{ alignSelf: "flex-end" }}
              disabled={!isAvatarChanged && !isDirty}
            >
              Save Changes
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default PersonalInfo;
