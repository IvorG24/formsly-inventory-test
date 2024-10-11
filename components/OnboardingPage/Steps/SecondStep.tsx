import { checkUserSSSIDNumber } from "@/backend/api/get";
import { removeMultipleSpaces } from "@/utils/string";
import {
  Box,
  Checkbox,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { OnboardUserParams } from "../OnboardingPage";
import SubmitSection from "../SubmitSection";
import UploadId from "../UploadId";

type Props = {
  activeStep: number;
  totalSections: number;
  handleChangeStep: (action: "PREVIOUS" | "NEXT") => Promise<void>;
};

const SecondStep = ({ activeStep, totalSections, handleChangeStep }: Props) => {
  const supabaseClient = useSupabaseClient();

  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  const {
    control,
    formState: { errors },
    setError,
    register,
    setValue,
  } = useFormContext<OnboardUserParams>();

  const defaultInputProps = {
    styles: { required: { color: "red" } },
    h: { sm: 80 },
  };

  const sssIDFormatter = (value: string) => {
    if (!value) return "";
    const cleaned = ("" + value).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{7})(\d{1})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return value;
  };

  return (
    <Flex h="100%" direction="column" gap={{ base: 24, sm: 32 }}>
      <Flex justify="space-between">
        <Box>
          <Text size={20} weight={700}>
            Upload an ID
          </Text>
          <Text size={14}>Be sure to use the data indicated in your ID.</Text>
        </Box>
        <Text weight={600}>{`${activeStep}/${totalSections}`}</Text>
      </Flex>
      <Flex h="fit-content" gap={32} direction={{ base: "column", sm: "row" }}>
        <Flex direction="column" justify="space-between" gap={24} mih="100%">
          <Group
            align="center"
            p={18}
            w="100%"
            mah={300}
            h="100%"
            sx={{ border: "1px dashed #CED4DA", borderRadius: 8 }}
          >
            <Controller
              control={control}
              name="sss_front_image"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <UploadId
                  value={value}
                  onChange={onChange}
                  onError={(error: string) =>
                    setError("sss_front_image", { message: error })
                  }
                  fieldError={error?.message}
                  size={90}
                />
              )}
            />
            <Stack spacing={0}>
              <Text size={14} weight={600}>
                Front ID
              </Text>
              <Box c="#495057">
                <Text size={12}>Allowed *.jpg, *jpeg, *.png</Text>
                <Text size={12}>Max allowed of 5 MB</Text>
              </Box>
            </Stack>
          </Group>
          <Group
            align="center"
            p={18}
            w="100%"
            mah={300}
            h="100%"
            sx={{ border: "1px dashed #CED4DA", borderRadius: 8 }}
          >
            <Controller
              control={control}
              name="sss_back_image"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <UploadId
                  value={value}
                  onChange={onChange}
                  onError={(error: string) =>
                    setError("sss_back_image", { message: error })
                  }
                  fieldError={error?.message}
                  size={90}
                />
              )}
            />
            <Stack spacing={0}>
              <Text size={14} weight={600}>
                Back ID
              </Text>
              <Box c="#495057">
                <Text size={12}>Allowed *.jpg, *jpeg, *.png</Text>
                <Text size={12}>Max allowed of 5 MB</Text>
              </Box>
            </Stack>
          </Group>
        </Flex>
        <Box h="100%" sx={{ flex: 1 }}>
          <Stack justify="space-between" spacing={36}>
            <SimpleGrid
              cols={2}
              breakpoints={[{ maxWidth: "sm", cols: 1, spacing: "sm" }]}
            >
              <Controller
                control={control}
                name="sss_number"
                rules={{
                  required: "SSS ID Number is required",
                  validate: {
                    checkNumberOfCharacter: (value) => {
                      const stringifiedValue = value ? `${value}` : "";

                      if (stringifiedValue.length !== 12) {
                        return "Invalid SSS ID Number";
                      }
                      return true;
                    },
                    isUnique: async (value) => {
                      if (!value) return;
                      const numberOnly = value.replace(/\D/g, "");
                      const result = await checkUserSSSIDNumber(
                        supabaseClient,
                        {
                          idNumber: numberOnly.trim(),
                        }
                      );
                      return result ? result : "SSS ID Number is already used";
                    },
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    label="SSS ID Number"
                    placeholder="XX-XXXXXXX-X"
                    required
                    maxLength={10}
                    value={value}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      const numberOnly = value.replace(/\D/g, "");
                      const newValue = sssIDFormatter(numberOnly);
                      if (newValue.length === 12) {
                        onChange(newValue);
                        return;
                      } else {
                        onChange(numberOnly);
                        return;
                      }
                    }}
                    error={errors.sss_number?.message}
                    {...defaultInputProps}
                  />
                )}
              />
              <TextInput
                label="Job Title"
                placeholder="Office Staff"
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
                {...defaultInputProps}
              />
            </SimpleGrid>
            <Checkbox
              label="I confirm that all data is correct and truthful to the best of my knowledge."
              checked={isDataConfirmed}
              onChange={(e) => setIsDataConfirmed(e.currentTarget.checked)}
              required
            />
            <SubmitSection
              activeStep={activeStep}
              handleChangeStep={handleChangeStep}
              disableSubmit={!isDataConfirmed}
            />
          </Stack>
        </Box>
      </Flex>
    </Flex>
  );
};

export default SecondStep;
