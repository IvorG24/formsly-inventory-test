import { checkUniqueValue, getSiteList } from "@/backend/api/get";
import { createDataDrawer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
import {
  InventoryAssetFormValues,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
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
import DisableModal from "../FormModal/DisableModal";
import UpdateModal from "../FormModal/UpdateModal";
import SiteDrawer from "./SiteDrawer";

type FormValues = {
  search: string;
  site_name: string;
  site_description: string;
};
type Props = {
  securityGroup: SecurityGroupData;
};
const SiteSetupPage = ({ securityGroup }: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();

  const [activePage, setActivePage] = useState(1);
  const [currentSiteList, setCurrentSiteList] = useState<SiteTableRow[]>([]);
  const [siteListCount, setSiteListCount] = useState(0);
  const [isFetchingSiteList, setIsFetchingSiteList] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [updateModalOpened, setUpdatedModalOpened] = useState(false);
  const [siteId, setSiteId] = useState<string>("");
  const [initialSiteData, setInitialSiteData] = useState<{
    site_name: string;
    site_description: string;
  }>({
    site_name: "",
    site_description: "",
  });
  const canAddData = securityGroup.privileges.site.add === true;
  const canDeleteData = securityGroup.privileges.site.delete === true;
  const canEditData = securityGroup.privileges.site.edit === true;
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
      setIsFetchingSiteList(false);
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
    if (!canEditData) {
      notifications.show({
        message: "Action not allowed",
        color: "red",
      });
      return;
    }
    const site = currentSiteList.find((site) => site.site_id === site_id);

    if (site) {
      setSiteId(site_id);
      setInitialSiteData({
        site_name: site.site_name,
        site_description: site.site_description,
      });
      setUpdatedModalOpened(true);
    }
  };

  const handleDelete = async (site_id: string) => {
    if (!canDeleteData) {
      notifications.show({
        message: "Action not allowed",
        color: "red",
      });
      return;
    }
    setSiteId(site_id);
    setModalOpened(true);
  };

  const handleSiteSubmit = async (data: InventoryAssetFormValues) => {
    try {
      if (!activeTeam.team_id) return;
      const checkIfUniqueValue = await checkUniqueValue(supabaseClient, {
        type: "site",
        typeValue: data.site_name?.trim() || "",
      });
      if (checkIfUniqueValue) {
        notifications.show({
          message: "Site already exist",
          color: "red",
        });
        return;
      }
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
    <Container maw={3840} h="100%">
      <DisableModal
        handleFetch={handleFetchSiteList}
        activePage={activePage}
        typeId={siteId}
        close={() => {
          setModalOpened(false);
        }}
        opened={modalOpened}
        type="site"
      />
      <UpdateModal
        typeId={siteId}
        handleFetch={handleFetchSiteList}
        activePage={activePage}
        initialData={initialSiteData.site_name}
        initialDescription={initialSiteData.site_description}
        close={() => setUpdatedModalOpened(false)}
        opened={updateModalOpened}
        type="site"
      />

      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>List of Sites</Title>
          <Text>
            This is the list of sites currently in the system, including their
            descriptions and available actions. You can edit or delete each site
            as needed.
          </Text>
        </Box>
      </Flex>
      <Paper p="md">
        <Stack>
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
              {canAddData && (
                <Button leftIcon={<IconPlus size={16} />} onClick={open}>
                  Add New Site
                </Button>
              )}
            </Group>
          </form>

          <Divider />

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
                    {canEditData && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleEdit(site.site_id)}
                      >
                        Edit
                      </Button>
                    )}
                    {canDeleteData && (
                      <Button
                        size="xs"
                        variant="outline"
                        color="red"
                        onClick={() => handleDelete(site.site_id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Group>
                ),
              },
            ]}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default SiteSetupPage;
