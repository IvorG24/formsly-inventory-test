import { checkIfEmailExists, signUpUser } from "@/backend/api/post";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  LoadingOverlay,
  MediaQuery,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  createStyles,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import validator from "validator";
import SocialMediaButtonList from "../SocialMediaButton/SocialMediaButtonList";
import PasswordInputWithStrengthMeter from "./PasswordInputWithStrengthMeter";
import RedirectButton from "./RedirectButton";

export type SignUpFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const useStyles = createStyles((theme) => ({
  bannerContainer: {
    [theme.fn.largerThan(475)]: {
      borderRadius: "8px 0px 0px 8px",
    },
    border: 0,
  },
  bannerTitle: {
    [theme.fn.largerThan(475)]: {
      fontSize: 32,
      textAlign: "center",
    },
    fontSize: 20,
  },
  bannerSubtitle: {
    [theme.fn.largerThan(475)]: {
      fontSize: 20,
      textAlign: "center",
    },
    fontSize: 14,
  },
  formContainer: {
    [theme.fn.largerThan(475)]: {
      borderRadius: "0px 8px 8px 0px",
    },
    border: 0,
  },
}));

const SignUpPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { classes } = useStyles();
  const supabaseClient = useSupabaseClient();
  const signUpFormMethods = useForm<SignUpFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = signUpFormMethods;

  const handleSignUp = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);
      const isEmailExists = await checkIfEmailExists(supabaseClient, {
        email: data.email,
      });
      if (isEmailExists) {
        notifications.show({
          message: "Email already registered and onboarded.",
          color: "orange",
          autoClose: false,
        });
        return;
      }

      const { data: newUserData, error } = await signUpUser(supabaseClient, {
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      notifications.show({
        message:
          "Confirmation email sent. Please check your email inbox to proceed.",
        color: "green",
        withCloseButton: false,
      });
      await router.push(
        `/sign-up/success?confirmationId=${newUserData.user?.id}&email=${data.email}`
      );
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
    <Container px={0} fluid h="100%">
      <Flex h="100%" w="100%" justify="center" mt={{ sm: 45, lg: 75 }}>
        <Paper
          w={{ base: "100%", sm: 800 }}
          mih={{ base: "100%", sm: 520 }}
          mah={560}
          shadow="sm"
          className={classes.formContainer}
        >
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <Flex direction={{ base: "column", sm: "row" }} h="100%">
            <Stack
              spacing="sm"
              justify="space-evenly"
              sx={{ flex: 1, backgroundColor: "#228BE6" }}
              mih={{ base: 100, sm: 520 }}
              mah={{ base: 150, sm: 560 }}
              p={{ base: 16, sm: 32 }}
              className={classes.bannerContainer}
            >
              <Flex
                direction={{ base: "row-reverse", sm: "column" }}
                justify="center"
                align="center"
                gap={8}
                w="100%"
              >
                <Box
                  pos="relative"
                  miw={100}
                  w={{ sm: 150 }}
                  h={{ base: 100, sm: 150 }}
                >
                  <Image
                    src="/sign-up-page-banner-image.svg"
                    fill={true}
                    alt="Formlsy Sign Up page banner"
                  />
                </Box>
                <Flex direction="column" c="white" ta="start">
                  <Title className={classes.bannerTitle}>
                    Streamline Workflows
                  </Title>
                  <Text className={classes.bannerSubtitle}>
                    Shift from paper to web. Reduce your carbon footprint.
                  </Text>
                </Flex>
              </Flex>
              <MediaQuery smallerThan="sm" styles={{ display: "none" }}>
                <Box w="100%">
                  <RedirectButton
                    link={"/sign-in"}
                    label="Already have an account?"
                    highlightLabel="Login Here"
                  />
                </Box>
              </MediaQuery>
            </Stack>
            <Stack
              justify="space-evenly"
              h="100%"
              p={{ base: 16, sm: 32 }}
              sx={{ flex: 1 }}
            >
              <form onSubmit={handleSubmit(handleSignUp)}>
                <Stack>
                  <Title fw={600} order={5}>
                    Create an account.
                  </Title>
                  <TextInput
                    placeholder="Enter your email address"
                    label="Email"
                    error={errors.email?.message}
                    {...register("email", {
                      required: "Email field cannot be empty",
                      validate: (value) =>
                        validator.isEmail(value) || "Email is invalid.",
                    })}
                  />
                  <FormProvider {...signUpFormMethods}>
                    <PasswordInputWithStrengthMeter />
                  </FormProvider>
                  <PasswordInput
                    placeholder="Confirm your password"
                    label="Confirm Password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword", {
                      required: "Confirm password field cannot be empty",
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Your password does not match.",
                    })}
                  />
                  <Button type="submit" size="md">
                    Sign up
                  </Button>
                </Stack>
              </form>

              <Divider
                color="#343A40"
                label={<Text>Or sign up with</Text>}
                labelPosition="center"
              />
              <SocialMediaButtonList
                flexprops={{ direction: "column", gap: 10 }}
                buttonprops={{ variant: "outline", color: "dark", fz: 12 }}
                providerLabel={{
                  google: "Sign up with Google",
                  azure: "Sign up with Azure",
                }}
              />
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Box w="100%" mt={8}>
                  <RedirectButton
                    link={"/sign-in"}
                    label="Already have an account?"
                    highlightLabel="Login Here"
                  />
                </Box>
              </MediaQuery>
            </Stack>
          </Flex>
        </Paper>
      </Flex>
    </Container>
  );
};

export default SignUpPage;
