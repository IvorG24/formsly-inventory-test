import { useActiveTeam } from "@/stores/useTeamStore";
import { JoyRideNoSSR, isEmpty } from "@/utils/functions";
import { TeamMemberTableRow, TeamTableRow } from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Stepper,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CreateTeamForm from "./CreateTeamForm";
import InviteForm from "./InviteForm";
import TeamCard from "./TeamCard";

const CreateTeamPage = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [newTeam, setNewTeam] = useState<TeamTableRow | null>(null);
  const [ownerData, setOwnerData] = useState<TeamMemberTableRow | null>(null);
  // const [isCreateTeam, setIsCreateTeam] = useState(false);
  const { colors } = useMantineTheme();
  const activeTeam = useActiveTeam();
  const renderSteps = (activeStep: number) => {
    switch (activeStep) {
      case 1:
        return (
          <CreateTeamForm
            changeStep={setActiveStep}
            setNewTeam={setNewTeam}
            setOwnerData={setOwnerData}
          />
        );

      case 2:
        return (
          <InviteForm
            changeStep={setActiveStep}
            ownerData={ownerData as TeamMemberTableRow}
            team={newTeam as TeamTableRow}
          />
        );

      case 3:
        return <TeamCard team={newTeam as TeamTableRow} />;

      default:
        break;
    }
  };

  const openUserRouteModal = () =>
    modals.open({
      centered: true,
      closeOnEscape: false,
      closeOnClickOutside: false,
      withCloseButton: false,
      children: (
        <Box>
          <Title order={3}>Team Selection</Title>
          <Text>
            Decide your role in collaboration. Create a new team for leadership
            or join an existing team to contribute.
          </Text>
          <Button
            h={100}
            fullWidth
            variant="filled"
            mt="md"
            onClick={async () => {
              modals.closeAll();
              await router.push("/user/join-team?onboarding=true");
            }}
          >
            <Box>
              <Title order={4}>Join Team</Title>
              <Text>
                Select this option if you want to join an existing team.
              </Text>
            </Box>
          </Button>

          {/* <Button
            h={100}
            fullWidth
            variant="outline"
            mt="md"
            onClick={() => {
              modals.closeAll();
              setIsCreateTeam(true);
            }}
          >
            <Box>
              <Title order={4}> Create Team</Title>
              <Text>Use this option if you want to start a new team.</Text>
            </Box>
          </Button> */}
        </Box>
      ),
    });

  useEffect(() => {
    if (router.query.onboarding === "true") {
      openUserRouteModal();
    }
  }, [router.query]);

  return (
    <Container>
      <JoyRideNoSSR
        steps={[
          {
            target: ".onboarding-create-team",
            content: <Text>Follow these steps to create a team.</Text>,
            disableBeacon: true,
          },
        ]}
        run={false}
        hideCloseButton
        disableCloseOnEsc
        disableOverlayClose
        hideBackButton
        styles={{ buttonNext: { backgroundColor: colors.blue[6] } }}
      />
      <div className="onboarding-create-team">
        <Title className="my-first-step">Create Team </Title>
        {isEmpty(activeTeam) ? (
          <Text className="my-other-step" color="dimmed">
            or wait for a team invitation that will show up in your
            notification.
          </Text>
        ) : null}
        <Stepper my="xl" iconSize={42} active={activeStep} breakpoint="sm">
          <Stepper.Step label="Step 1" description="Create team" />
          <Stepper.Step label="Step 2" description="Invite members" />
          <Stepper.Step label="Step 3" description="Go to team" />
        </Stepper>
        {renderSteps(activeStep)}
      </div>
    </Container>
  );
};

export default CreateTeamPage;
