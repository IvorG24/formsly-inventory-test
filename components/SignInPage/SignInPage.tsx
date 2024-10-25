import { getInvitationId } from "@/backend/api/get";
import { checkIfEmailExists, signInUser } from "@/backend/api/post";
import {
  Anchor,
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
import { useForm } from "react-hook-form";
import validator from "validator";
import RedirectButton from "../SignUpPage/RedirectButton";
import SocialMediaButtonList from "../SocialMediaButton/SocialMediaButtonList";
import ResetPasswordModal from "./ResetPasswordModal";

type SignInFormValues = {
  email: string;
  password: string;
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

const SignInPage = () => {
  const { classes } = useStyles();
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [openResetPasswordModal, setOpenResetPasswordModal] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>();

  const handleSignIn = async (data: SignInFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await signInUser(supabaseClient, {
        email: data.email,
        password: data.password,
      });

      if (error?.toLowerCase().includes("invalid login credentials")) {
        notifications.show({
          message: "Invalid login credentials.",
          color: "red",
        });
        setIsLoading(false);
        return;
      } else if (
        error?.toLowerCase().includes("authapierror: email not confirmed")
      ) {
        notifications.show({
          message:
            "You need to verify your email first before proceeding to formsly. If you don't received the verification email, you can try to sign up again",
          color: "orange",
          autoClose: false,
        });
        setIsLoading(false);
        return;
      } else if (error) throw error;
      notifications.show({
        message: "Sign in successful.",
        color: "green",
      });
      const isUserOnboarded = await checkIfEmailExists(supabaseClient, {
        email: data.email,
      });
      if (isUserOnboarded) {
        const { inviteToken } = router.query;

        if (inviteToken) {
          const response = await fetch("/api/jwt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "decrypt",
              value: inviteToken,
            }),
          });
          const { data } = await response.json();
          if (!data) throw new Error("Jwt decoded token is null");

          const { teamId, invitedEmail } = data;
          const invitationId = await getInvitationId(supabaseClient, {
            teamId: `${teamId}`,
            userEmail: `${invitedEmail}`,
          });
          await router.push(`/user/invitation/${invitationId}`);
        } else {
          await router.push(`/userActiveTeam`);
        }
        return;
      }
      await router.push("/onboarding");
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setIsLoading(false);
    }
  };

  return (
    <Container px={0} fluid h="100%">
      <Flex h="100%" w="100%" justify="center" mt={{ sm: 45, lg: 75 }}>
        <Paper
          w={{ base: "100%", sm: 800 }}
          h={{ base: "100%", sm: 520 }}
          shadow="sm"
          className={classes.formContainer}
        >
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <Flex direction={{ base: "column", sm: "row" }} h="100%">
            <Stack
              spacing="sm"
              justify="space-evenly"
              sx={{ flex: 1, backgroundColor: "#228BE6" }}
              h={{ base: 100, sm: 520 }}
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
                    Effortless Efficiency
                  </Title>
                  <Text className={classes.bannerSubtitle}>
                    Transform your processes with digital solutions. Start for
                    free!
                  </Text>
                </Flex>
              </Flex>
              <MediaQuery smallerThan="sm" styles={{ display: "none" }}>
                <Box w="100%">
                  <RedirectButton
                    link={"/sign-up"}
                    label="Don't have an account?"
                    highlightLabel="Register Here"
                  />
                </Box>
              </MediaQuery>
            </Stack>
            <Stack
              spacing={24}
              h="100%"
              p={{ base: 16, sm: 32 }}
              sx={{ flex: 1 }}
            >
              <form onSubmit={handleSubmit(handleSignIn)}>
                <Stack>
                  <Title fw={600} order={5}>
                    Sign in to your account.
                  </Title>
                  <TextInput
                    placeholder="Enter your email address"
                    label="Email"
                    error={errors.email?.message}
                    {...register("email", {
                      required:
                        "Email field cannot be empty. Please enter your email address.",
                      validate: (value) =>
                        validator.isEmail(value) ||
                        "Email is invalid. Please enter a valid email address.",
                    })}
                    data-cy="signin-input-email"
                  />
                  <Box>
                    <PasswordInput
                      placeholder="Enter your password"
                      label="Password"
                      error={errors.password?.message}
                      {...register("password", {
                        required:
                          "Password field cannot be empty. Please enter your password.",
                      })}
                      data-cy="signin-input-password"
                    />
                    <Anchor
                      component="button"
                      mt={8}
                      size="xs"
                      align="right"
                      onClick={() => setOpenResetPasswordModal(true)}
                    >
                      Forgot Password?
                    </Anchor>
                  </Box>
                  <Button
                    size="md"
                    type="submit"
                    data-cy="signin-button-submit"
                    disabled={isLoading}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>

              <Divider
                color="#343A40"
                label={<Text>Or sign in with</Text>}
                labelPosition="center"
              />
              <SocialMediaButtonList
                flexprops={{ mt: "md", direction: "column", gap: 10 }}
                buttonprops={{ variant: "outline", color: "dark", fz: 12 }}
                providerLabel={{
                  google: "Sign in with Google",
                  azure: "Sign in with Azure",
                }}
              />
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Box w="100%" mt={8}>
                  <RedirectButton
                    link={"/sign-up"}
                    label="Don't have an account?"
                    highlightLabel="Register Here"
                  />
                </Box>
              </MediaQuery>
            </Stack>
          </Flex>
        </Paper>
      </Flex>
      <ResetPasswordModal
        opened={openResetPasswordModal}
        onClose={() => setOpenResetPasswordModal(false)}
      />
    </Container>
  );
};

export default SignInPage;
