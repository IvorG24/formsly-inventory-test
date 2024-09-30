import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
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
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SiteDrawer, { SiteFormValues } from "./SiteDrawer";

type Site = {
  site_id: string;
  site_name: string;
  site_description: string;
};

const mockSites: Site[] = [
  {
    site_id: "1",
    site_name: "Site A",
    site_description: "Description for Site A",
  },
  {
    site_id: "2",
    site_name: "Site B",
    site_description: "Description for Site B",
  },
  {
    site_id: "3",
    site_name: "Site C",
    site_description: "Description for Site C",
  },
];

type FormValues = {
  search: string;
  site_name: string;
  site_description: string;
};

const SiteSetupPage = () => {
  const activeTeam = useActiveTeam();
  const [activePage, setActivePage] = useState(1);
  const [currentSiteList, setCurrentSiteList] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>(mockSites);
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
    const start = (activePage - 1) * ROW_PER_PAGE;
    const end = start + ROW_PER_PAGE;
    setCurrentSiteList(filteredSites.slice(start, end));
  }, [activePage, filteredSites]);

  const handleFetchSiteList = async (page: number) => {
    const { search } = getValues();
    const filtered = mockSites.filter(
      (site) =>
        site.site_name.toLowerCase().includes(search.toLowerCase()) ||
        site.site_description.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredSites(filtered);
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
          style={{ borderRadius: 4 }}
          withBorder
          idAccessor="site_id"
          page={activePage}
          totalRecords={filteredSites.length}
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
