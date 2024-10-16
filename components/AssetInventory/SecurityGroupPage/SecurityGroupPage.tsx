import { getGroupList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { TeamGroupTableRow } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/router";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export type Department = {
  team_department_id: string;
  team_department_name: string;
};

type FormValues = {
  search: string;
  department_name: string;
};

const SecurityGroupPage = () => {
  const activeTeam = useActiveTeam();
  const router = useRouter();
  const teamMember = useUserTeamMember();
  const isAdminOrOwner = ["OWNER", "ADMIN"].some((role) =>
    teamMember?.team_member_role.includes(role)
  );
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentTeamGroup, setCurrentTeamGroup] = useState<TeamGroupTableRow[]>(
    []
  );
  const [teamGroupCount, setTeamGroupCount] = useState(0);

  const [isFetchingGroupList, setIsFetchingGroupList] = useState(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage]);

  const handleFetchGroupList = async (page: number) => {
    try {
      const { search } = getValues();
      const { data, totalCount } = await getGroupList(supabaseClient, {
        search,
        limit: ROW_PER_PAGE,
        page,
      });
      setCurrentTeamGroup(data);
      setTeamGroupCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingGroupList(true);
      setActivePage(1);
      await handleFetchGroupList(1);
    } catch (e) {
    } finally {
      setIsFetchingGroupList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingGroupList(true);
      setActivePage(page);
      await handleFetchGroupList(page);
    } catch (e) {
    } finally {
      setIsFetchingGroupList(false);
    }
  };

  const handleEditGroup = (groupId: string) => {
    router.push(
      `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/security-groups/${groupId}`
    );
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Groups</Title>
        <Text>
          This is the list of Departments currently in the system, including
          their descriptions and available actions. You can edit or delete each
          site as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by Group Name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
          </Group>
        </form>

        <DataTable
          fontSize={16}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="team_group_id"
          page={activePage}
          totalRecords={teamGroupCount}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentTeamGroup}
          fetching={isFetchingGroupList}
          columns={[
            {
              accessor: "team_group_id",
              width: "90%",
              title: "Group Name",
              render: (department) => <Text>{department.team_group_name}</Text>,
            },

            {
              accessor: "actions",
              width: "30%",
              title: "Actions",
              render: (department) =>
                isAdminOrOwner ? ( // Conditionally render the Edit button
                  <Button
                    variant="light"
                    onClick={() => handleEditGroup(department.team_group_id)}
                  >
                    Edit Group
                  </Button>
                ) : null,
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default SecurityGroupPage;
