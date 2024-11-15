import { getSSOT } from "@/backend/api/get";
import { useSSOTTableFilter } from "@/hooks/useSSOTTableFilter";
import { useActiveTeam } from "@/stores/useTeamStore";
import {
  DEFAULT_NUMBER_SSOT_ROWS,
  ITEM_FIELDS_ORDER,
  formatDate,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import { addCommaToNumber } from "@/utils/string";
import { SSOTResponseType, SSOTType } from "@/utils/types";
import {
  Box,
  Button,
  Flex,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Table,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import { useElementSize, useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconReload } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SSOTSpreadsheetViewFilter from "./SSOTSpreadsheetViewFilter";
import SSOTSpreadsheetViewTableFilter from "./SSOTSpreadsheetViewTableFilter";

const useStyles = createStyles((theme) => ({
  cell: {
    verticalAlign: "top",
  },
  date: {
    width: 120,
    minWidth: 120,
    maxWidth: 120,
  },
  processor: {
    width: 180,
    minWidth: 180,
    maxWidth: 180,
  },
  normal: {
    width: 100,
    minWidth: 100,
    maxWidth: 100,
  },
  long: {
    width: 200,
    minWidth: 200,
    maxWidth: 200,
  },
  description: {
    width: 500,
    minWidth: 500,
    maxWidth: 500,
  },
  itemTable: {
    "& th": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.blue[6]
          : theme.colors.blue[3],
    },
    "& tbody": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.blue[9]
          : theme.colors.blue[0],
    },
  },
}));

export type SSOTFilterFormValues = {
  search: string;
  requestingProject: string;
  itemName: string;
};

export type ShowColumnList = { [key: string]: boolean };

const itemTableColumnList = [
  "Item ID",
  "Jira ID",
  "OTP ID",
  "Date Created",
  "Operations/Engineering",
  "Requesting Project",
  "Type",
  "Date Needed",
  "Purpose",
];

const itemItemTableColumnList = [
  "General Name",
  "Quantity",
  "Base Unit of Measurement",
  "Item Description",
  "GL Account",
];

type Props = {
  requestingProjectList: string[];
  itemNameList: string[];
};

const SSOTSpreadsheetViewPage = ({
  requestingProjectList,
  itemNameList,
}: Props) => {
  const { classes } = useStyles();
  const { height } = useViewportSize();
  const { ref: topElementRef, height: topElementHeight } = useElementSize();
  const supabaseClient = createPagesBrowserClient<Database>();
  const containerRef = useRef<HTMLTableElement>(null);
  const team = useActiveTeam();
  const viewport = useRef<HTMLDivElement>(null);

  const [itemList, setItemList] = useState<SSOTType[]>([]);
  const [offset, setOffset] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollBarType, setScrollBarType] = useState<"always" | "never">(
    "always"
  );
  const [isFetchable, setIsFetchable] = useState(
    itemList.length === DEFAULT_NUMBER_SSOT_ROWS
  );

  const itemTable = useSSOTTableFilter(true, itemTableColumnList);
  const itemItemTable = useSSOTTableFilter(true, itemItemTableColumnList);

  const tables = {
    itemTable,
    itemItemTable,
  };

  const filterSSOTMethods = useForm<SSOTFilterFormValues>({
    defaultValues: {
      search: "",
      itemName: "",
      requestingProject: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, getValues } = filterSSOTMethods;
  const handleFilterSSOT = async (
    { search, requestingProject, itemName }: SSOTFilterFormValues = getValues()
  ) => {
    try {
      setIsLoading(true);
      setScrollBarType("never");
      setOffset(1);

      const formattedData = await getSSOT(supabaseClient, {
        pageNumber: 1,
        rowLimit: DEFAULT_NUMBER_SSOT_ROWS,
        search: search.trim(),
        requestingProject: requestingProject ?? "",
        itemName: itemName ?? "",
      });

      if (formattedData.length === DEFAULT_NUMBER_SSOT_ROWS) {
        setIsFetchable(true);
      } else {
        setIsFetchable(false);
      }
      setItemList(formattedData);
      viewport.current &&
        viewport.current.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setScrollBarType("always");
      setIsLoading(false);
    }
  };

  const loadMoreRequests = async (
    offset: number,
    { search, requestingProject, itemName }: SSOTFilterFormValues = getValues()
  ) => {
    try {
      setIsLoading(true);
      setScrollBarType("never");

      const trimmedSearch = search.trim();

      let itemFilterCount = 0;
      requestingProjectList.length !== 0 && itemFilterCount++;
      itemNameList.length !== 0 && itemFilterCount++;
      trimmedSearch.length !== 0 && itemFilterCount++;

      const data = await getSSOT(supabaseClient, {
        pageNumber: offset,
        rowLimit: DEFAULT_NUMBER_SSOT_ROWS,
        search: search.trim(),
        requestingProject: requestingProject ?? "",
        itemName: itemName ?? "",
      });

      if (data) {
        const formattedData = data as SSOTType[];
        if (formattedData.length < DEFAULT_NUMBER_SSOT_ROWS) {
          setIsFetchable(false);
          setItemList((prev) => [...prev, ...formattedData]);
        } else {
          setIsFetchable(true);
          setItemList((prev) => [...prev, ...formattedData]);
        }
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setScrollBarType("always");
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!isFetchable) return;
    if (containerRef.current && typeof window !== "undefined") {
      const container = containerRef.current;
      const { bottom } = container.getBoundingClientRect();
      const { innerHeight } = window;
      setIsInView(bottom <= innerHeight);
    }
  };

  useEffect(() => {
    if (isInView) {
      loadMoreRequests(offset + 1);
      setOffset((prev) => (prev += 1));
    }
  }, [isInView]);

  const renderItem = () => {
    return itemList.map((request) => {
      const itemName: string[] = [];
      const itemUnit: string[] = [];
      const itemQuantity: string[] = [];
      const itemDescription: string[] = [];
      const itemGlAccount: string[] = [];
      const itemCSICode: string[] = [];

      const fields = request.item_request_response.sort(
        (a: SSOTResponseType, b: SSOTResponseType) => {
          return (
            ITEM_FIELDS_ORDER.indexOf(a.request_response_field_name) -
            ITEM_FIELDS_ORDER.indexOf(b.request_response_field_name)
          );
        }
      );
      const items = fields.slice(0, -ITEM_FIELDS_ORDER.length);

      const sortedAndGroupedItems = sortAndGroupItems(items);
      sortedAndGroupedItems.forEach((group, groupIndex) => {
        itemDescription[groupIndex] = "";
        group.forEach((item) => {
          if (item.request_response_field_name === "General Name") {
            itemName[groupIndex] = JSON.parse(item.request_response);
          } else if (
            item.request_response_field_name === "Base Unit of Measurement"
          ) {
            itemUnit[groupIndex] = JSON.parse(item.request_response);
          } else if (item.request_response_field_name === "Quantity") {
            itemQuantity[groupIndex] = JSON.parse(item.request_response);
          } else if (item.request_response_field_name === "GL Account") {
            itemGlAccount[groupIndex] = JSON.parse(item.request_response);
          } else if (
            [
              "CSI Code",
              "Division Description",
              "Level 2 Major Group Description",
              "Level 2 Minor Group Description",
            ].includes(item.request_response_field_name)
          ) {
          } else {
            itemDescription[groupIndex] += `${
              item.request_response_field_name
            }: ${JSON.parse(item.request_response)}\n`;
          }
        });
        itemDescription[groupIndex] = itemDescription[groupIndex].slice(0, -1);
      });

      return (
        <tr key={request.item_request_id} className={classes.cell}>
          {itemTable.show && (
            <>
              {itemTable.columnList["item_id"] && (
                <td>
                  {request.item_request_formsly_id || request.item_request_id}
                </td>
              )}
              {itemTable.columnList["jira_id"] && (
                <td>{request.item_request_jira_id}</td>
              )}
              {itemTable.columnList["otp_id"] && (
                <td>{request.item_request_otp_id}</td>
              )}
              {itemTable.columnList["date_created"] && (
                <td>
                  {formatDate(new Date(request.item_request_date_created))}
                </td>
              )}

              {itemTable.columnList["operations/engineering"] && (
                <td>{`${request.item_request_owner.user_first_name} ${request.item_request_owner.user_last_name}`}</td>
              )}
              {fields
                .slice(-ITEM_FIELDS_ORDER.length)
                .map((response, index) => {
                  const fieldName =
                    response.request_response_field_name.toLowerCase();
                  const columnPropName = fieldName.replace(/\s+/g, "_");
                  const showColumn = itemTable.columnList[columnPropName];

                  return (
                    showColumn && (
                      <td key={index}>
                        {response.request_response_field_type === "DATE"
                          ? formatDate(
                              new Date(safeParse(response.request_response))
                            )
                          : JSON.parse(response.request_response) !== "null"
                          ? JSON.parse(response.request_response)
                          : ""}
                      </td>
                    )
                  );
                })}
              {itemItemTable.show && (
                <td style={{ padding: 0 }}>
                  <Table
                    withBorder
                    withColumnBorders
                    pos="relative"
                    h="100%"
                    className={classes.itemTable}
                    ref={containerRef}
                  >
                    <thead>
                      <tr>
                        {itemItemTable.columnList["general_name"] && (
                          <th className={classes.long}>General Name</th>
                        )}
                        {itemItemTable.columnList["quantity"] && (
                          <th className={classes.normal}>Quantity</th>
                        )}
                        {itemItemTable.columnList[
                          "base_unit_of_measurement"
                        ] && (
                          <th className={classes.date}>
                            Base Unit of Measurement
                          </th>
                        )}
                        {itemItemTable.columnList["item_description"] && (
                          <th className={classes.description}>Description</th>
                        )}
                        {itemItemTable.columnList["gl_account"] && (
                          <th className={classes.long}>GL Account</th>
                        )}
                        {/* {itemItemTable.columnList["csi_code"] && (
                          <th className={classes.long}>CSI Code</th>
                        )} */}
                      </tr>
                    </thead>
                    <tbody>
                      {itemName.map((item, index) => {
                        return (
                          <tr key={index} className={classes.cell}>
                            {itemItemTable.columnList["general_name"] && (
                              <td>
                                <Text size={14}>{item}</Text>
                              </td>
                            )}
                            {itemItemTable.columnList["quantity"] && (
                              <td>
                                <Text size={14}>
                                  {addCommaToNumber(
                                    Number(itemQuantity[index])
                                  )}
                                </Text>
                              </td>
                            )}
                            {itemItemTable.columnList[
                              "base_unit_of_measurement"
                            ] && (
                              <td>
                                <Text size={14}>{itemUnit[index]}</Text>
                              </td>
                            )}
                            {itemItemTable.columnList["item_description"] && (
                              <td>
                                <pre
                                  style={{
                                    margin: 0,
                                  }}
                                >
                                  <Text size={14}>
                                    {itemDescription[index]}
                                  </Text>
                                </pre>
                              </td>
                            )}
                            {itemItemTable.columnList["gl_account"] && (
                              <td>
                                <Text size={14}>{itemGlAccount[index]}</Text>
                              </td>
                            )}
                            {itemItemTable.columnList["csi_code"] && (
                              <td>
                                <Text size={14}>{itemCSICode[index]}</Text>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </td>
              )}
            </>
          )}
        </tr>
      );
    });
  };

  const sortAndGroupItems = (fieldResponse: SSOTResponseType[]) => {
    const uniqueIdList = fieldResponse.reduce((unique, item) => {
      const { request_response_duplicatable_section_id } = item;
      // Check if the item's duplicatable_section_id is already in the unique array
      const isDuplicate = unique.some((uniqueItem) =>
        uniqueItem.includes(`${request_response_duplicatable_section_id}`)
      );
      // If the item is not a duplicate, add it to the unique array
      if (!isDuplicate) {
        unique.push(`${request_response_duplicatable_section_id}`);
      }

      return unique;
    }, [] as string[]);

    const returnValue = uniqueIdList.map((id) => {
      const fields = fieldResponse.filter(
        (response) =>
          `${response.request_response_duplicatable_section_id}` === id
      );
      return fields;
    });

    return returnValue;
  };

  useEffect(() => {
    if (team.team_id) {
      handleFilterSSOT();
    }
  }, [team.team_id]);

  return (
    <Flex direction="column" p="0">
      <Box ref={topElementRef}>
        <Group>
          <Title order={2} color="dimmed">
            SSOT Spreadsheet View
          </Title>

          <Button
            leftIcon={<IconReload size={16} />}
            onClick={() => {
              handleFilterSSOT();
            }}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <FormProvider {...filterSSOTMethods}>
            <form onSubmit={handleSubmit(handleFilterSSOT)}>
              <SSOTSpreadsheetViewFilter
                handleFilterSSOT={handleFilterSSOT}
                requestingProjectList={requestingProjectList}
                itemNameList={itemNameList}
              />
            </form>
          </FormProvider>
          <SSOTSpreadsheetViewTableFilter tables={tables} />
        </Group>
      </Box>

      <Paper mt="xs" p="xs" shadow="sm">
        <ScrollArea
          scrollbarSize={10}
          offsetScrollbars
          type={scrollBarType}
          onScrollCapture={handleScroll}
          viewportRef={viewport}
        >
          <Box
            mah={{
              base: height - (topElementHeight + 130),
              xs: height - (topElementHeight + 130),
              sm: height - (topElementHeight + 130),
              md: height - (topElementHeight + 150),
              lg: height - (topElementHeight + 145),
              600: height - (topElementHeight + 130),
              1030: height - (topElementHeight + 150),
            }}
          >
            <LoadingOverlay
              visible={isLoading}
              loader={<Loader variant="dots" />}
            />
            <Table
              withBorder
              withColumnBorders
              pos="relative"
              h="100%"
              className={classes.itemTable}
              ref={containerRef}
            >
              <thead>
                <tr>
                  {itemTable.show && (
                    <>
                      {itemTable.columnList["item_id"] && (
                        <th className={classes.long}>Item ID</th>
                      )}
                      {itemTable.columnList["jira_id"] && (
                        <th className={classes.long}>Jira ID</th>
                      )}
                      {itemTable.columnList["otp_id"] && (
                        <th className={classes.long}>OTP ID</th>
                      )}
                      {itemTable.columnList["date_created"] && (
                        <th className={classes.date}>Date Created</th>
                      )}
                      {itemTable.columnList["operations/engineering"] && (
                        <th className={classes.processor}>
                          Operations / Engineering
                        </th>
                      )}
                      {itemTable.columnList["requesting_project"] && (
                        <th className={classes.long}>Requesting Project</th>
                      )}
                      {itemTable.columnList["type"] && (
                        <th className={classes.normal}>Type</th>
                      )}
                      {itemTable.columnList["date_needed"] && (
                        <th className={classes.normal}>Date Needed</th>
                      )}
                      {itemTable.columnList["purpose"] && (
                        <th className={classes.long}>Purpose</th>
                      )}
                      {itemItemTable.show && <th>Item</th>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>{renderItem()}</tbody>
            </Table>
          </Box>
        </ScrollArea>
      </Paper>
    </Flex>
  );
};

export default SSOTSpreadsheetViewPage;
