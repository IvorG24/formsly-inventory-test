import { checkUserSSSIDNumber } from "@/backend/api/get";
import { createSSSID, uploadImage } from "@/backend/api/post";
import UploadId from "@/components/OnboardingPage/UploadId";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export type SSSParams = {
  sss_number: string;
  sss_front_image: File | null;
  sss_back_image: File | null;
};

type Props = {
  userId: string;
  supabaseClient: SupabaseClient;
};

const SSSModal = ({ userId, supabaseClient }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<SSSParams>({
    defaultValues: { sss_number: "" },
    reValidateMode: "onBlur",
  });

  const sssIDFormatter = (value: string) => {
    if (!value) return "";
    const cleaned = ("" + value).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{7})(\d{1})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handleOnboardUser = async (data: SSSParams) => {
    setIsLoading(true);
    try {
      let idFrontImage = "";
      if (data.sss_front_image) {
        idFrontImage = (
          await uploadImage(supabaseClient, {
            image: data.sss_front_image,
            bucket: "SSS_ID_ATTACHMENTS",
            fileType: "sf",
            userId,
            sssId: data.sss_number,
          })
        ).publicUrl;
      }
      let idBackImage = "";
      if (data.sss_back_image) {
        idBackImage = (
          await uploadImage(supabaseClient, {
            image: data.sss_back_image,
            bucket: "SSS_ID_ATTACHMENTS",
            fileType: "sb",
            userId,
            sssId: data.sss_number,
          })
        ).publicUrl;
      }

      await createSSSID(supabaseClient, {
        sssData: {
          user_sss_user_id: userId,
          user_sss_number: data.sss_number.replace(/\D/g, ""),
          user_sss_front_image_url: idFrontImage,
          user_sss_back_image_url: idBackImage,
        },
      });

      notifications.show({
        message: "SSS ID Submitted.",
        color: "green",
      });
      modals.closeAll();
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleOnboardUser)}>
        <Text size={14} color="dimmed">
          Kindly enter your Social Security System (SSS) ID number to continue
          using Formsly. This information will be used solely for identity
          verification purposes and will be handled with strict confidentiality.
        </Text>
        <Flex h="100%" direction="column" gap={{ base: 24, sm: 32 }} mt="xl">
          <Flex
            h="fit-content"
            gap={32}
            direction={{ base: "column", sm: "row" }}
          >
            <Flex
              direction="column"
              justify="space-between"
              gap={24}
              mih="100%"
            >
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
                          return result
                            ? result
                            : "SSS ID Number is already used";
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
                      />
                    )}
                  />
                </SimpleGrid>
                <Checkbox
                  label="I confirm that all data is correct and truthful to the best of my knowledge."
                  checked={isDataConfirmed}
                  onChange={(e) => setIsDataConfirmed(e.currentTarget.checked)}
                  required
                />
                <Button
                  disabled={!isDataConfirmed}
                  loading={isLoading}
                  type="submit"
                >
                  Submit
                </Button>
              </Stack>
            </Box>
          </Flex>
        </Flex>
      </form>
    </>
  );
};

export default SSSModal;
