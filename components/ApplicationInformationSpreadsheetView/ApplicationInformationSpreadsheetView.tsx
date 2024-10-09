import {
  fetchRegion,
  getApplicationInformationPositionOptions,
  getApplicationInformationSummaryData,
} from "@/backend/api/get";
import { DEFAULT_NUMBER_SSOT_ROWS, FETCH_OPTION_LIMIT } from "@/utils/constant";
import supabaseClientAddress from "@/utils/supabase/address";
import {
  ApplicationInformationFieldOptionType,
  ApplicationInformationFilterFormValues,
  ApplicationInformationSpreadsheetData,
  OptionTableRow,
  OptionType,
  SectionWithFieldType,
} from "@/utils/types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  SupabaseClient,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { IconReload } from "@tabler/icons-react";
import { Database as OneOfficeDatabase } from "oneoffice-api";
import { useEffect, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import ApplicationInformationColumnsMenu from "./ApplicationInformationColumnsMenu";
import ApplicationInformationFilterMenu from "./ApplicationInformationFilterMenu";
import ApplicationInformationSpreadsheetTable from "./ApplicationInformationSpreadsheetTable/ApplicationInformationSpreadsheetTable";

const initialSort = {
  field: "request_date_created",
  order: "DESC",
  dataType: "DATE",
};

const formDefaultValues = {
  requestFilter: {
    requestId: "",
    dateCreatedRange: {
      start: "",
      end: "",
    },
    status: [],
    approver: [],
    requestScoreRange: {
      start: null,
      end: null,
    },
  },
  responseFilter: {
    position: [],
    firstName: "",
    middleName: "",
    lastName: "",
  },
};

type Props = {
  sectionList: SectionWithFieldType[];
  optionList: ApplicationInformationFieldOptionType[];
  approverOptionList: OptionType[];
};

const ApplicationInformationSpreadsheetView = ({
  sectionList,
  optionList: initialOptionList,
  approverOptionList,
}: Props) => {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const [data, setData] = useState<ApplicationInformationSpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [optionList, setOptionList] = useState(initialOptionList);
  const [isMax, setIsMax] = useState(false);
  const [hiddenColumnList, setHiddenColumnList] = useLocalStorage<string[]>({
    key: "ApplicationInformationColumns",
    defaultValue: [],
  });

  const filterFormMethods = useForm<ApplicationInformationFilterFormValues>({
    defaultValues:
      formDefaultValues as unknown as ApplicationInformationFilterFormValues,
  });

  const fetchData = async (data?: ApplicationInformationFilterFormValues) => {
    try {
      if (!user) return;
      setIsLoading(true);
      setIsMax(false);
      const filterData = filterFormMethods.getValues();

      const newData = await getApplicationInformationSummaryData(
        supabaseClient,
        {
          ...filterData,
          ...data,
          userId: user.id,
          limit: DEFAULT_NUMBER_SSOT_ROWS,
          page: data?.page ?? page,
          sort: data?.sort ?? sort,
        }
      );

      if (newData.length < DEFAULT_NUMBER_SSOT_ROWS) {
        setIsMax(true);
      }

      if ((data?.page ?? page) === 1) {
        setData(newData);
      } else {
        setData((prev) => [...prev, ...newData]);
      }
    } catch (e) {
      notifications.show({
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = async (currentPage: number) => {
    setPage(currentPage);
    await fetchData({
      page: currentPage,
    });
  };

  const handleReset = () => {
    filterFormMethods.reset(
      formDefaultValues as unknown as ApplicationInformationFilterFormValues
    );
    setPage(1);
    fetchData({ page: 1 });
  };

  useBeforeunload(() => {
    const filterData = filterFormMethods.getValues();
    localStorage.setItem(
      "applicationInformationSpreadsheetView",
      JSON.stringify({
        ...filterData,
        limit: DEFAULT_NUMBER_SSOT_ROWS,
        sort,
      })
    );
  });

  useEffect(() => {
    const handleSorting = async () => {
      await fetchData({ sort, page: 1 });
    };
    handleSorting();
  }, [sort]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const regionData = await fetchRegion(
        supabaseClientAddress as unknown as SupabaseClient<
          OneOfficeDatabase["address_schema"]
        >
      );
      if (regionData) {
        setOptionList((prev) => {
          const regionOption = {
            field_name: "Region willing to be assigned",
            field_option: regionData.map((region, index) => {
              return {
                option_id: uuidv4(),
                option_value: region.region,
                option_order: index + 1,
                option_field_id: "1a901f84-4f55-47aa-bfa0-42f56d1eb6c5",
              };
            }),
          };
          return [...prev, regionOption];
        });
      }

      let index = 0;
      const positionOptionList: OptionTableRow[] = [];
      while (1) {
        const positionData = await getApplicationInformationPositionOptions(
          supabaseClient,
          {
            teamId: "a5a28977-6956-45c1-a624-b9e90911502e",
            index,
            limit: FETCH_OPTION_LIMIT,
          }
        );

        const positionOptions = positionData.map((position, index) => {
          return {
            option_field_id: "0fd115df-c2fe-4375-b5cf-6f899b47ec56",
            option_id: position.position_id,
            option_order: index,
            option_value: position.position_alias,
          };
        });
        positionOptionList.push(...positionOptions);
        if (positionData.length < FETCH_OPTION_LIMIT) break;
        index += FETCH_OPTION_LIMIT;
      }

      if (positionOptionList.length) {
        const orderedOptions = positionOptionList.sort((a, b) =>
          a.option_value.localeCompare(b.option_value)
        );
        setOptionList((prev) => {
          return [
            ...prev,
            {
              field_name: "Position",
              field_option: orderedOptions,
            },
          ];
        });
      }

      const storedData = localStorage.getItem(
        "applicationInformationSpreadsheetView"
      );
      if (storedData) {
        const filterData: ApplicationInformationFilterFormValues =
          JSON.parse(storedData);
        setSort(filterData.sort ?? initialSort);
        filterFormMethods.reset(
          filterData as ApplicationInformationFilterFormValues
        );
        await fetchData({
          ...filterData,
        });
      } else {
        await fetchData({
          page: 1,
        });
      }
    };
    fetchInitialData();
  }, []);

  return (
    <Stack pos="relative">
      <Box>
        <Group>
          <Title order={2} color="dimmed">
            Application Information Spreadsheet View
          </Title>

          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <FormProvider {...filterFormMethods}>
            <ApplicationInformationFilterMenu
              fetchData={fetchData}
              optionList={optionList}
              handleReset={handleReset}
              approverOptionList={approverOptionList}
              isLoading={isLoading}
            />
          </FormProvider>
          <ApplicationInformationColumnsMenu
            sectionList={sectionList}
            hiddenColumnList={hiddenColumnList}
            setHiddenColumnList={setHiddenColumnList}
          />
        </Group>
      </Box>
      <ApplicationInformationSpreadsheetTable
        data={data}
        sectionList={sectionList}
        isLoading={isLoading}
        page={page}
        handlePagination={handlePagination}
        sort={sort}
        setSort={setSort}
        isMax={isMax}
        hiddenColumnList={hiddenColumnList}
      />
    </Stack>
  );
};

export default ApplicationInformationSpreadsheetView;
