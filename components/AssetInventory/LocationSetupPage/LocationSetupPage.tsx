import { useActiveTeam } from "@/stores/useTeamStore";
import { ROW_PER_PAGE } from "@/utils/constant";
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
import { IconLocation, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import LocationDrawer, { SiteFormValues } from "./LocationDrawer";

type Location = {
  location_id: string;
  location_name: string;
};

const mockLocations: Location[] = [
  {
    location_id: "1",
    location_name: "Location A",
  },
  {
    location_id: "2",
    location_name: "Location B",
  },
  {
    location_id: "3",
    location_name: "Location C",
  },
];

const mockLocationsOptions = [
  {
    value: "Location A",
    label: "Location A",
  },
  {
    value: "Location B",
    label: "Location B",
  },
  {
    value: "Location C",
    label: "Location C",
  },
];

type FormValues = {
  site_name: string;
  location_name: string;
};

const LocationSetupPage = () => {
  const activeTeam = useActiveTeam();
  const [activePage, setActivePage] = useState(1);
  const [currentLocationList, setCurrentLocationList] = useState<Location[]>(
    []
  );
  const [filteredLocations, setFilteredLocations] =
    useState<Location[]>(mockLocations);
  const [isFetchingLocationList, setIsFetchingLocationList] = useState(false); // Loading state
  const [opened, { open, close }] = useDisclosure(false);

  const formMethods = useForm<FormValues>({
    defaultValues: {
      site_name: mockLocationsOptions[0].value,
      location_name: "",
    },
  });

  const { register, handleSubmit, getValues } = formMethods;

  useEffect(() => {
    const start = (activePage - 1) * ROW_PER_PAGE;
    const end = start + ROW_PER_PAGE;
    setCurrentLocationList(filteredLocations.slice(start, end));
  }, [activePage, filteredLocations]);

  const handleFetchLocationList = async (
    page: number,
    value: string | null
  ) => {
    const { site_name } = getValues();
    const siteName = value ? value : site_name;

    const filtered = mockLocations.filter((location) =>
      location.location_name.toLowerCase().includes(siteName.toLowerCase())
    );
    setFilteredLocations(filtered);
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
      const { site_name } = getValues();
      setIsFetchingLocationList(true);
      setActivePage(page);
      await handleFetchLocationList(page, site_name);
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
      const { site_name, location_name } = data;
      console.log(site_name, location_name);

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
          onSubmit={handleSubmit((data) => handleFilterForms(data.site_name))}
        >
          <Group position="apart" align="center">
            <Select
              placeholder="Search by location name"
              data={mockLocationsOptions}
              value={getValues("site_name")}
              searchable
              clearable
              {...register("site_name")}
              rightSection={
                <ActionIcon size="xs" type="submit">
                  <IconLocation />
                </ActionIcon>
              }
              onChange={(value) => {
                formMethods.setValue("site_name", value || "");
                handleFilterForms(value);
              }}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={open}>
              Add New Location
            </Button>
          </Group>
        </form>

        <FormProvider {...formMethods}>
          <LocationDrawer
            site_name={getValues("site_name")}
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
          totalRecords={filteredLocations.length}
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
