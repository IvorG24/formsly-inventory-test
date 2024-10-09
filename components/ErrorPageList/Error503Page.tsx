import {
  Button,
  Container,
  createStyles,
  Flex,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { useRouter } from "next/router";

const useStyles = createStyles((theme) => ({
  root: {
    paddingTop: 80,
    paddingBottom: 80,
  },

  title: {
    fontWeight: 900,
    fontSize: 34,
    marginBottom: theme.spacing.md,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,

    [theme.fn.smallerThan("sm")]: {
      fontSize: 32,
    },
  },

  control: {
    [theme.fn.smallerThan("sm")]: {
      width: "100%",
    },
  },

  mobileImage: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  desktopImage: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },
}));

const Error503Page = () => {
  const { classes } = useStyles();
  const router = useRouter();

  return (
    <Container className={classes.root}>
      <SimpleGrid
        spacing={80}
        cols={2}
        breakpoints={[{ maxWidth: "sm", cols: 1, spacing: 40 }]}
      >
        <div>
          <Title className={classes.title}>Service unavailable...</Title>
          <Text color="dimmed" size="lg">
            We are currently undergoing maintenance. Please try again later.
          </Text>
          <Flex gap="xs">
            <Button
              size="md"
              mt="xl"
              className={classes.control}
              onClick={() => router.back()}
              variant="outline"
            >
              Get back
            </Button>
            <Button
              size="md"
              mt="xl"
              className={classes.control}
              onClick={async () => await router.push("/")}
            >
              Get to home page
            </Button>
          </Flex>
        </div>
      </SimpleGrid>
    </Container>
  );
};

export default Error503Page;
