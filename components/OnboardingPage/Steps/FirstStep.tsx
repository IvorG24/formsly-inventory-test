import { checkPhoneNumber, checkUsername } from "@/backend/api/get";
import { Database } from "@/utils/database";
import { removeMultipleSpaces, toTitleCase } from "@/utils/string";
import {
  Box,
  Flex,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction } from "react";
import { Controller, useFormContext } from "react-hook-form";
import UploadAvatar from "../../UploadAvatar/UploadAvatar";
import { OnboardUserParams } from "../OnboardingPage";
import SubmitSection from "../SubmitSection";

type Props = {
  activeStep: number;
  totalSections: number;
  avatarFile: File | null;
  setAvatarFile: Dispatch<SetStateAction<File | null>>;
  handleChangeStep: (action: "PREVIOUS" | "NEXT") => Promise<void>;
  handleEmployeeNumberChange: (value: string | null) => void;
};

const FirstStep = ({
  activeStep,
  totalSections,
  avatarFile,
  setAvatarFile,
  handleChangeStep,
  handleEmployeeNumberChange,
}: Props) => {
  const isMobileScreen = useMediaQuery("(max-width: 475px)");
  const supabaseClient = createPagesBrowserClient<Database>();
  const {
    register,
    control,
    formState: { errors },
    setValue,
    setError,
  } = useFormContext<OnboardUserParams>();

  const defaultInputProps = {
    w: "100%",
    styles: { required: { color: "red" } },
    h: { sm: 80 },
  };

  return (
    <Stack h="100%" spacing={32}>
      <Flex justify="space-between">
        <Box>
          <Text size={20} weight={700}>
            Let&apos;s setup your account
          </Text>
          <Text size={14}>
            Fill up all required fields to proceed to the next step. Uploading a
            profile picture is optional.
          </Text>
        </Box>
        <Text weight={600}>{`${activeStep}/${totalSections}`}</Text>
      </Flex>
      <Flex
        h="fit-content"
        gap={{ base: 16, sm: 32 }}
        direction={{ base: "column", sm: "row" }}
      >
        <Flex
          gap={16}
          direction={{ base: "row", sm: "column" }}
          align="center"
          justify={{ base: "space-between", sm: "center" }}
          p="md"
          w={{ base: "100%", sm: 300 }}
          sx={{ border: "1px dashed #CED4DA", borderRadius: 8 }}
        >
          {!isMobileScreen && (
            <Text size={14} weight={600}>
              Profile Picture
            </Text>
          )}
          <UploadAvatar
            value={avatarFile}
            onChange={setAvatarFile}
            onError={(error: string) =>
              setError("user_avatar", { message: error })
            }
            size={isMobileScreen ? 100 : 140}
          />
          <Box>
            {isMobileScreen && (
              <Text size={14} weight={600}>
                Profile Picture
              </Text>
            )}
            <Text
              align={isMobileScreen ? "left" : "center"}
              color="#495057"
              size={14}
            >
              Allowed *.jpg, *jpeg, *.png
            </Text>
            <Text
              align={isMobileScreen ? "left" : "center"}
              color="#495057"
              size={14}
            >
              Max allowed of 5 MB
            </Text>
          </Box>
        </Flex>
        <Box h="100%" sx={{ flex: 1 }}>
          <Stack spacing={36}>
            <SimpleGrid
              cols={2}
              breakpoints={[{ maxWidth: "sm", cols: 1, spacing: "sm" }]}
            >
              <Controller
                control={control}
                name="user_employee_number"
                render={({ field: { onChange, value } }) => (
                  <NumberInput
                    label="Employee Number"
                    placeholder="00001"
                    value={Number(value) || ""}
                    onChange={onChange}
                    onBlur={() =>
                      handleEmployeeNumberChange(value ? `${value}` : null)
                    }
                    hideControls
                    {...defaultInputProps}
                  />
                )}
              />
              <TextInput
                label="Username"
                placeholder="jdelacruz01"
                {...register("user_username", {
                  required: "Username is required",
                  minLength: {
                    value: 2,
                    message: "Username must have at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Username must be shorter than 100 characters",
                  },
                  validate: {
                    validCharacters: (value) =>
                      /^[a-zA-Z0-9_.]+$/.test(value) ||
                      "Username can only contain letters, numbers, underscore, and period",
                    alreadyUsed: async (value) => {
                      const isAlreadyUsed = await checkUsername(
                        supabaseClient,
                        {
                          username: value,
                        }
                      );
                      return isAlreadyUsed ? "Username is already used" : true;
                    },
                  },
                })}
                error={errors.user_username?.message}
                data-cy="onboarding-input-username"
                required
                {...defaultInputProps}
              />
              <TextInput
                label="First Name"
                placeholder="Juan"
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
                data-cy="onboarding-input-first-name"
                required
                {...defaultInputProps}
              />

              <TextInput
                label="Last Name"
                placeholder="Dela Cruz"
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
                data-cy="onboarding-input-last-name"
                required
                {...defaultInputProps}
              />
              <Controller
                control={control}
                name="user_phone_number"
                rules={{
                  required: "Mobile Number is required.",
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
                render={({ field: { onChange, value } }) => (
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
                  />
                )}
              />
            </SimpleGrid>
            <SubmitSection
              activeStep={activeStep}
              handleChangeStep={handleChangeStep}
            />
          </Stack>
        </Box>
      </Flex>
    </Stack>
  );
};

export default FirstStep;
