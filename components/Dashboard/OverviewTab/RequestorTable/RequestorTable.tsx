import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { DashboardRequestorAndSignerType } from "@/utils/types";
import {
  Box,
  Center,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import { IconTrophyFilled } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import RequestorItem from "./RequestorItem";

const useStyles = createStyles(() => ({
  withBorderBottom: {
    borderBottom: "0.0625rem solid #dee2e6",
  },
}));

type RequestorTableProps = {
  totalRequestCount: number;
  requestorList: DashboardRequestorAndSignerType[];
  loadMoreRequestor: (page: number) => void;
  isRequestorFetchable: boolean;
  requestorOffset: number;
  setRequestorOffset: Dispatch<SetStateAction<number>>;
};

const RequestorTable = ({
  totalRequestCount,
  requestorList,
  loadMoreRequestor,
  isRequestorFetchable,
  requestorOffset,
  setRequestorOffset,
}: RequestorTableProps) => {
  const teamMemberList = useTeamMemberList();
  const { classes } = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isInView, setIsInView] = useState(false);

  const handleScroll = () => {
    if (!isRequestorFetchable) return;
    if (containerRef.current && typeof window !== "undefined") {
      const container = containerRef.current;
      const { bottom } = container.getBoundingClientRect();
      const { innerHeight } = window;
      setIsInView(bottom <= innerHeight);
    }
  };

  useEffect(() => {
    if (isInView) {
      const newRequestorOffset = requestorOffset + 1;
      loadMoreRequestor(newRequestorOffset);
      setRequestorOffset(newRequestorOffset);
    }
  }, [isInView]);

  return (
    <ScrollArea w="100%" h="100%" onScrollCapture={handleScroll}>
      <Paper w={{ base: "100%" }} mih={420} withBorder>
        <Group p="md" spacing="xs" className={classes.withBorderBottom}>
          <Center c="green">
            <IconTrophyFilled />
          </Center>
          <Title order={4}>Top Requestor</Title>
        </Group>

        <Stack p="lg" mb="sm" spacing={32} ref={containerRef}>
          {totalRequestCount > 0 ? (
            requestorList.map((requestor) => {
              const teamMemberData = teamMemberList.find(
                (member) => member.team_member_id === requestor.team_member_id
              );
              if (!teamMemberData) return <></>;
              return (
                <Box key={requestor.team_member_id}>
                  <RequestorItem
                    requestor={requestor}
                    teamMemberData={teamMemberData}
                  />
                </Box>
              );
            })
          ) : (
            <Center h={175}>
              <Text size={20} color="dimmed" weight={600}>
                No data to display
              </Text>
            </Center>
          )}
        </Stack>
      </Paper>
    </ScrollArea>
  );
};

export default RequestorTable;
