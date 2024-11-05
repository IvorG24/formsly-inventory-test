import { getDynamicReportView } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";

import { useEventList } from "@/stores/useEventStore";
import { formatDate } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  CategoryTableRow,
  Column,
  InventoryCustomerRow,
  InventoryListType,
  SecurityGroupData,
  SiteTableRow,
} from "@/utils/types";
import {
  Anchor,
  Box,
  Container,
  Flex,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Department } from "../DepartmentSetupPage/DepartmentSetupPage";
import EventReportListFilter from "./EventReportListFilter";
import EventReportListTable from "./EventReportListTable";

type Props = {
  siteList: SiteTableRow[];
  departmentList: Department[];
  categoryList: CategoryTableRow[];
  customerTableList: InventoryCustomerRow[];
  securityGroupData: SecurityGroupData;
};

type FilterSelectedValuesType = {
  search?: string;
  sites?: string[];
  locations?: string;
  category?: string[];
  department?: string[];
  limit?: string;
  status?: string;
  isAscendingSort?: boolean;
  event?: string;
  appointedTo?: string;
};

const EventReportListpage = ({
  siteList,
  customerTableList,
  departmentList,
  categoryList,
  securityGroupData,
}: Props) => {
  const activeTeam = useActiveTeam();
  const supabaseClient = useSupabaseClient();
  const eventList = useEventList();

  const [activePage, setActivePage] = useState(1);
  const [isFetchingRequestList, setIsFetchingRequestList] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryListType[]>([]);
  const [inventoryListCount, setInventoryListCount] = useState(0);
  const [columns, setColumns] = useState<Column[]>([]);

  const [showTableColumnFilter, setShowTableColumnFilter] = useState(false);

  const filterFormMethods = useForm<FilterSelectedValuesType>({
    defaultValues: {
      search: "",
      sites: [],
      locations: "",
      department: [],
      category: [],
      limit: "",
      status: "",
      event: "Check Out",
      appointedTo: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, getValues, setValue, watch } = filterFormMethods;

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "inventory_request_created",
    direction: "desc",
  });

  const eventName = watch("event");

  const columnDefaultValue = columns.map((col) => ({
    value: col.accessor,
    label: col.title,
  }));

  const [listTableColumnFilter, setListTableColumnFilter] = useLocalStorage<
    string[]
  >({
    key: `inventory-${eventName?.replace(" ", "_").toLowerCase()}-report-list-table-column-filter`,
    defaultValue: columnDefaultValue
      .filter((column) => !column.label.includes(eventName || ""))
      .map((column) => column.value),
  });

  const checkIfColumnIsHidden = (column: string) => {
    const isHidden = listTableColumnFilter.includes(column);
    return isHidden;
  };

  const handleFetchRequestList = async (page: number) => {
    try {
      setIsFetchingRequestList(true);
      if (!activeTeam.team_id) {
        console.warn(
          "RequestListPage handleFilterFormsError: active team_id not found"
        );
        return;
      }
      const {
        search,
        locations,
        status,
        department,
        sites,
        category,
        limit,
        isAscendingSort,
        appointedTo,
      } = getValues();

      const { data, count } = await getDynamicReportView(supabaseClient, {
        page: page,
        limit: Number(limit) ? Number(limit) : 10,
        sort: isAscendingSort,
        columnAccessor: sortStatus.columnAccessor,
        search,
        status,
        department: department,
        locations,
        sites: sites,
        category: category,
        teamId: activeTeam.team_id,
        eventName: eventName ?? "",
        appointedTo,
      });

      if (data.length > 0) {
        const tagId = "inventory_request_tag_id";
        const name = "inventory_request_name";
        const formattedEventName = eventName
          ?.replace(/ /g, "_")
          .toLocaleLowerCase();
        const generatedColumns = [
          {
            accessor: tagId,
            title: "Asset Tag ID",
            sortable: true,
            width: "10%",
            hidden: checkIfColumnIsHidden(tagId),
            footer: (
              <Text weight="bold" size="sm">
                Total Assets : {data.length}
              </Text>
            ),
            render: (record: Record<string, unknown>) => (
              <Text>
                <Anchor
                  href={`/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/inventory/${record[tagId]}`}
                  target="_blank"
                >
                  {String(record[tagId])}
                </Anchor>
              </Text>
            ),
          },
          {
            accessor: name,
            title: "Asset Name",
            sortable: true,
            width: "10%",
            hidden: checkIfColumnIsHidden(name),
            render: (record: Record<string, unknown>) => (
              <Text>
                <Anchor
                  href={`/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/inventory/${record[tagId]}`}
                  target="_blank"
                >
                  {String(record[name])}
                </Anchor>
              </Text>
            ),
          },
          ...Object.keys(data[0] ?? {})
            .filter(
              (key) =>
                key !== "inventory_request_id" &&
                key !== `event_${formattedEventName}_signature` &&
                key !== `event_${formattedEventName}_id` &&
                key !== `event_${formattedEventName}_request_id` &&
                key !== tagId &&
                key !== name
            )
            .map((key) => {
              const isNumericColumn = data.every(
                (row) => typeof row[key] === "number"
              );
              const isBooleanColumn = data.every(
                (row) => typeof row[key] === "boolean"
              );
              const totalValue = isNumericColumn
                ? data.reduce(
                    (sum, row) => sum + ((row[key] as unknown as number) || 0),
                    0
                  )
                : null;

              return {
                accessor: key,
                title: key
                  .replace(/_/g, " ")
                  .replace(
                    new RegExp(`\\b(${eventName}\\s*){2,}`, "gi"),
                    `${eventName} `
                  )
                  .replace(/inventory|request|event/gi, " ")
                  .replace(/\s+/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())
                  .trim(),
                sortable: true,
                hidden: checkIfColumnIsHidden(key),
                footer: isNumericColumn ? (
                  <Text weight="bold" size="sm">
                    Total:{" "}
                    {new Intl.NumberFormat("en-PH").format(
                      totalValue as number
                    )}
                  </Text>
                ) : null,
                render: (record: Record<string, unknown>) => {
                  const value = record[key];
                  if (isBooleanColumn) {
                    return <Text size="sm">{value ? "Yes" : "No"}</Text>;
                  }
                  if (key.includes("date") || key.includes("created")) {
                    const isDate =
                      typeof value === "string" && !isNaN(Date.parse(value));
                    if (isDate) {
                      return (
                        <Text size="sm">
                          {formatDate(new Date(value as string))}
                        </Text>
                      );
                    }
                  }

                  if (typeof value === "number" || key.includes("cost")) {
                    return (
                      <Text size="sm">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(value as number)}
                      </Text>
                    );
                  }

                  return <Text>{value ? String(value) : ""}</Text>;
                },
              };
            }),
        ];

        setColumns(generatedColumns);
      }
      setInventoryList(data);
      setInventoryListCount(count);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch request list.",
        color: "red",
      });
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handleFilterForms = async () => {
    try {
      setActivePage(1);
      await handleFetchRequestList(1);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  const handlePagination = async (page: number) => {
    try {
      setActivePage(page);
      await handleFetchRequestList(page);
    } catch (e) {
    } finally {
      setIsFetchingRequestList(false);
    }
  };

  useEffect(() => {
    handlePagination(activePage);
  }, [activeTeam]);

  return (
    <Container maw={3840} h="100%">
      <Flex align="center" gap="xl" wrap="wrap" pb="sm">
        <Box>
          <Title order={3}>Event Report List Page</Title>
          <Text>Manage your event assets reports here.</Text>
        </Box>
      </Flex>
      <Paper p="md">
        <FormProvider {...filterFormMethods}>
          <form onSubmit={handleSubmit(handleFilterForms)}>
            <EventReportListFilter
              columns={columns}
              setSortStatus={setSortStatus}
              eventList={eventList}
              customerList={customerTableList}
              securityGroupData={securityGroupData}
              siteList={siteList}
              categoryList={categoryList}
              departmentList={departmentList}
              handleFilterForms={handleFilterForms}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
            />
          </form>
        </FormProvider>
        <Box h="fit-content">
          {columns.length !== 0 && (
            <EventReportListTable
              requestList={inventoryList}
              requestListCount={inventoryListCount}
              activePage={activePage}
              eventname={eventName || ""}
              isFetchingRequestList={isFetchingRequestList}
              handlePagination={handlePagination}
              sortStatus={sortStatus}
              setSortStatus={setSortStatus}
              setValue={setValue}
              columns={columns}
              getValues={getValues}
              checkIfColumnIsHidden={checkIfColumnIsHidden}
              showTableColumnFilter={showTableColumnFilter}
              setShowTableColumnFilter={setShowTableColumnFilter}
              listTableColumnFilter={listTableColumnFilter}
              setListTableColumnFilter={setListTableColumnFilter}
              tableColumnList={columnDefaultValue}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default EventReportListpage;
