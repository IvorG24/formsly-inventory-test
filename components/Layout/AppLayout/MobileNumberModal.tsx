import { checkPhoneNumber } from "@/backend/api/get";
import { updateUser } from "@/backend/api/update";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export type MobileNumberParams = {
  mobile_number: string;
};

type Props = {
  userId: string;
  supabaseClient: SupabaseClient;
};

const MobileNumberModal = ({ userId, supabaseClient }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MobileNumberParams>({
    defaultValues: { mobile_number: "" },
    reValidateMode: "onBlur",
  });

  const handleOnboardUser = async (data: MobileNumberParams) => {
    setIsLoading(true);
    try {
      await updateUser(supabaseClient, {
        user_id: userId,
        user_phone_number: data.mobile_number,
      });

      notifications.show({
        message: "Mobile Number Submitted.",
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

  return (
    <>
      <form onSubmit={handleSubmit(handleOnboardUser)}>
        <Text size={14} color="dimmed">
          Kindly enter your mobile number to continue using Formsly. This
          information will be used solely for contact verification purposes and
          will be handled with strict confidentiality.
        </Text>
        <Flex h="100%" direction="column" gap={{ base: 24, sm: 32 }} mt="xl">
          <Flex
            h="fit-content"
            gap={32}
            direction={{ base: "column", sm: "row" }}
          >
            <Box h="100%" sx={{ flex: 1 }}>
              <Stack>
                <Controller
                  control={control}
                  name="mobile_number"
                  rules={{
                    required: "Mobile Number is required",
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
                        return result
                          ? result
                          : "Mobile Number is already used";
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
                      error={errors.mobile_number?.message}
                      icon={"+63"}
                    />
                  )}
                />

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

export default MobileNumberModal;
