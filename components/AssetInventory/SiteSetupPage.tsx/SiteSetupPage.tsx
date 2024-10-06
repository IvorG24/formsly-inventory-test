import { getSiteList } from "@/backend/api/get";
import { createDataDrawer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import { InventoryAssetFormValues, SiteTableRow } from "@/utils/types";
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
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Database } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DisableModal from "../DisableModal";
import SiteDrawer from "./SiteDrawer";

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
  const [siteListCount, setSiteListCount] = useState(0);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);
  const formMethods = useForm<FormValues>({
    defaultValues: {
      site_name: "",
      site_description: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(activePage);
  }, [activePage, activeTeam.team_id]);

  const handleFetchSiteList = async (page: number) => {
    try {
      if (!activeTeam.team_id) return;
      const { search } = getValues();
      const { data, totalCount } = await getSiteList(supabaseClient, {
        search,
        teamid: activeTeam.team_id,
        page,
        limit: ROW_PER_PAGE,
      });
      setCurrentSiteList(data);
      setSiteListCount(totalCount);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  const handleFilterForms = async () => {
    try {
      setIsFetchingSiteList(true);
      setActivePage(1);
      await handleFetchSiteList(1);
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
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
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setIsFetchingSiteList(false);
    }
  };

  const handleEdit = (site_id: string) => {
    console.log("Edit site with ID:", site_id);
  };

  const handleDelete = (site_id: string) => {
    setModalOpened(true);
    console.log(modalOpened);

    console.log("Delete site with ID:", site_id);
  };

  const handleSiteSubmit = async (data: InventoryAssetFormValues) => {
    try {
      if (!activeTeam.team_id) return;
      const result = await createDataDrawer(supabaseClient, {
        type: "site",
        InventoryFormValues: data,
        teamId: activeTeam.team_id,
      });

      const newData = {
        site_id: result.result_id,
        site_name: result.result_name,
        site_description: result.result_description,
        site_is_disabled: false,
        site_team_id: result.result_team_id,
      };

      setCurrentSiteList((prev) => [...prev, newData]);

      notifications.show({
        message: "Site Data Created",
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  return (
    <Container fluid>
      <DisableModal
        close={() => setModalOpened(false)} // Use setModalOpened to close the modal
        opened={modalOpened}
        type="site"
      />
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
          totalRecords={siteListCount}
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
                <Group spacing="xs" noWrap>
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
