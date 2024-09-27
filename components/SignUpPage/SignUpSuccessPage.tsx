import { getEmailResendTimer } from "@/backend/api/get";
import { resendEmail } from "@/backend/api/post";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { Database } from "@/utils/database";
import {
  ActionIcon,
  Button,
  Center,
  Container,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCircleCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const SuccessPage = () => {
  const supabaseClient = useSupabaseClient<Database>();
  const router = useRouter();
  const { setIsLoading } = useLoadingActions();

  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const fetchResendData = async () => {
      try {
        setIsLoading(true);
        const email = router.query.email;
        if (!email || typeof email !== "string") throw new Error();
        const data = await getEmailResendTimer(supabaseClient, { email });

        setTimer(data);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchResendData();
  }, [router.query.email]);

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  const handleResend = async () => {
    try {
      setIsResending(true);
      const email = router.query.email;
      if (!email || typeof email !== "string") throw new Error();

      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email: email,
      });
      if (error) throw error;

      await resendEmail(supabaseClient, { email });
      setTimer(60);

      notifications.show({
        message:
          "Confirmation email sent. Please check your email inbox to proceed.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Container h="100%" p={24}>
      <Center mt={65}>
        <Paper
          px={{ base: 32, sm: 64 }}
          py={32}
          w={493}
          shadow="sm"
          radius="md"
        >
          <Flex
            w="100%"
            justify="center"
            direction="column"
            align="center"
            ta="center"
            gap={16}
          >
            <ActionIcon size={84} color="green">
              <IconCircleCheck size={84} />
            </ActionIcon>

            <Title size={20}>Check your mailbox</Title>
            <Text size={14}>
              We have sent you a confirmation email to complete your
              registration. To proceed, click the link provided in the email. If
              you don&apos;t see it in your inbox, please check your spam
              folder.
            </Text>
            <Stack spacing="xs">
              <Button
                h={38}
                fullWidth
                variant="light"
                onClick={handleResend}
                loading={isResending}
                disabled={Boolean(timer)}
              >
                Resend Email Verification {timer ? timer : ""}
              </Button>
              <Link
                href={"/"}
                style={{ textDecoration: "none", width: "100%" }}
              >
                <Button h={38} fullWidth>
                  Return to homepage
                </Button>
              </Link>
            </Stack>
          </Flex>
        </Paper>
      </Center>
    </Container>
  );
};

export default SuccessPage;
