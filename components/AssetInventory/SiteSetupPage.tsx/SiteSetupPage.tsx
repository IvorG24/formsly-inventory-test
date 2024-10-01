import { getSiteList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { SiteTableRow } from "@/utils/types";
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
import { useDisclosure } from "@mantine/hooks";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SiteDrawer, { SiteFormValues } from "./SiteDrawer";

type FormValues = {
  search: string;
  site_name: string;
  site_description: string;
};

const SiteSetupPage = () => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const [activePage, setActivePage] = useState(1);
  const [currentSiteList, setCurrentSiteList] = useState<SiteTableRow[]>([]);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  // Initialize React Hook Form with default values for the drawer
  const formMethods = useForm<FormValues>({
    defaultValues: {
      site_name: "",
      site_description: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);

  const handleFetchSiteList = async (page: number) => {
    const { search } = getValues();
    const data = await getSiteList(supabaseClient, {
      search,
      teamid: activeTeam.team_id,
      page,
      limit: ROW_PER_PAGE,
    });

    setCurrentSiteList(data);
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(1);
      await handleFetchSiteList(1);
    } catch (e) {
      console.error("Error fetching filtered sites:", e);
    } finally {
      setIsFetchingSiteList(false); // Hide loading state
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(page);
      await handleFetchSiteList(page);
    } catch (e) {
      console.error("Error fetching paginated sites:", e);
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handleEdit = (site_id: string) => {
    console.log("Edit site with ID:", site_id);
  };

  const handleDelete = (site_id: string) => {
    console.log("Delete site with ID:", site_id);
  };

  const handleSiteSubmit = async (data: SiteFormValues) => {
    try {
      const { site_name, site_description } = data;
      console.log(site_name, site_description);
      //site logic put here
      close();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Sites</Title>
        <Text>
          This is the list of sites currently in the system, including their
          descriptions and available actions. You can edit or delete each site
          as needed.
        </Text>

        <form onSubmit={handleSubmit(handleFilterForms)}>
          <Group position="apart" align="center">
            <TextInput
              placeholder="Search by site name"
              {...register("search")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconSearch />
                </ActionIcon>
              }
              miw={250}
              maw={320}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Site
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <SiteDrawer
            handleSiteSubmit={handleSiteSubmit}
            isOpen={opened}
            close={close}
          />
        </FormProvider>

        <DataTable
          fontSize={16}
          style={{
            borderRadius: 4,
            minHeight: "300px",
          }}
          withBorder
          idAccessor="site_id"
          page={activePage}
          totalRecords={currentSiteList.length}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentSiteList}
          fetching={isFetchingSiteList}
          columns={[
            {
              accessor: "site_name",
              width: "20%",
              title: "Site Name",
              render: (site) => <Text>{site.site_name}</Text>,
            },
            {
              accessor: "site_description",
              width: "70%",
              title: "Site Description",
              render: (site) => <Text>{site.site_description}</Text>,
            },
            {
              accessor: "actions",
              title: "Actions",
              render: (site) => (
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(site.site_id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(site.site_id)}
                  >
                    Delete
                  </Button>
                </Group>
              ),
            },
          ]}
        />
      </Flex>
    </Container>
  );
};

export default SiteSetupPage;
