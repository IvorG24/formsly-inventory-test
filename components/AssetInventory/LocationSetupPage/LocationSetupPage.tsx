import { getLocationList } from "@/backend/api/get";
import { ROW_PER_PAGE } from "@/utils/constant";
import { Database } from "@/utils/database";
import { LocationTableRow, SiteTableRow } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Group,
  Select,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconLocation, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import LocationDrawer, { SiteFormValues } from "./LocationDrawer";

type FormValues = {
  site_id: string;
  location_name: string;
};
type Props = {
  siteListData: SiteTableRow[];
};
const LocationSetupPage = ({ siteListData }: Props) => {
  const [activePage, setActivePage] = useState(1);
  const [currentLocationList, setCurrentLocationList] = useState<
    LocationTableRow[]
  >([]);
  const supabaseClient = createPagesBrowserClient<Database>();
  const [isFetchingLocationList, setIsFetchingLocationList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);
  const siteOptionList = siteListData.map((option) => ({
    label: option.site_name,
    value: option.site_id,
  }));

  const formMethods = useForm<FormValues>({
    defaultValues: {
      site_id: siteOptionList[0].value,
      location_name: "",
    },
  });

  const { control, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    handlePagination(1);
  }, [activePage]);

  const handleFetchLocationList = async (
    page: number,
    value: string | null
  ) => {
    const { site_id } = getValues();
    const siteId = value ? value : site_id;

    const data = await getLocationList(supabaseClient, {
      site_id: siteId,
      limit: ROW_PER_PAGE,
      page,
    });

    setCurrentLocationList(data);
  };

  const handleFilterForms = async (value: string | null) => {
    try {
      setIsFetchingLocationList(true);
      setActivePage(1);
      handleFetchLocationList(1, value);
    } catch (e) {
      console.error("Error fetching filtered locations:", e);
    } finally {
      setIsFetchingLocationList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      const { site_id } = getValues();
      setIsFetchingLocationList(true);
      setActivePage(page);
      await handleFetchLocationList(page, site_id);
    } catch (e) {
      console.error("Error fetching paginated locations:", e);
    } finally {
      setIsFetchingLocationList(false);
    }
  };

  const handleEdit = (location_id: string) => {
    console.log("Edit location with ID:", location_id);
  };

  const handleDelete = (location_id: string) => {
    console.log("Delete location with ID:", location_id);
  };

  const handleLocationSubmit = async (data: SiteFormValues) => {
    try {
      const { site_id, location_name } = data;
      console.log(site_id, location_name);

      close();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Container fluid>
      <Flex direction="column" gap="sm">
        <Title order={2}>List of Locations</Title>
        <Text>
          This is the list of locations currently in the system. You can edit or
          delete each location as needed.
        </Text>

        <form
          onSubmit={handleSubmit((data) => handleFilterForms(data.site_id))}
        >
          <Group position="apart" align="center">
            <Controller
              name="site_id"
              control={control}
              defaultValue={getValues("site_id")}
              render={({ field }) => (
                <Select
                  placeholder="Search by location name"
                  data={siteOptionList}
                  searchable
                  clearable
                  {...field}
                  rightSection={
                    <ActionIcon size="xs" type="submit">
                      <IconLocation />
                    </ActionIcon>
                  }
                  onChange={(value) => {
                    field.onChange(value); // Update the form value
                    handleFilterForms(value); // Call your custom handler
                  }}
                />
              )}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Location
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <LocationDrawer
            siteOptionList={siteOptionList}
            handleSiteSubmit={handleLocationSubmit}
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
          idAccessor="location_id"
          page={activePage}
          totalRecords={currentLocationList.length}
          recordsPerPage={ROW_PER_PAGE}
          onPageChange={handlePagination}
          records={currentLocationList}
          fetching={isFetchingLocationList}
          columns={[
            {
              accessor: "location_name",
              width: "85%",
              title: "Location Name",
              render: (location) => <Text>{location.location_name}</Text>,
            },
            {
              accessor: "actions",
              title: "Actions",
              render: (location) => (
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleEdit(location.location_id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => handleDelete(location.location_id)}
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

export default LocationSetupPage;
