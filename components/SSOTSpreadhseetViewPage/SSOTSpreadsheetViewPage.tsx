import { useActiveTeam } from "@/stores/useTeamStore";
import {
  DEFAULT_NUMBER_SSOT_ROWS,
  REQUISITION_FIELDS_ORDER,
  UUID_EXP,
} from "@/utils/constant";
import { Database } from "@/utils/database";
import { addCommaToNumber, regExp } from "@/utils/string";
import { SSOTResponseType, SSOTType } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  List,
  Loader,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Space,
  Table,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import { useElementSize, useViewportSize } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconFile } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SSOTSpreadsheetViewFilter from "./SSOTSpreadsheetViewFilter";
import SSOTSpreadsheetViewTableFilter from "./SSOTSpreadsheetViewTableFilter";

// TODO: Refactor
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
  short: {
    width: 80,
    minWidth: 80,
    maxWidth: 80,
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
    width: 300,
    minWidth: 300,
    maxWidth: 300,
  },
  requisitionTable: {
    "& th": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.red[6]
          : theme.colors.red[3],
    },
    "& tbody": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.red[9]
          : theme.colors.red[0],
    },
  },
  quotationTable: {
    "& th": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.grape[6]
          : theme.colors.grape[3],
    },
    "& tbody": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.grape[9]
          : theme.colors.grape[0],
    },
  },
  rirTable: {
    "& th": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.orange[6]
          : theme.colors.orange[3],
    },
    "& tbody": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.orange[9]
          : theme.colors.orange[0],
    },
  },
  roTable: {
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
  chequeReferenceTable: {
    "& th": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.green[6]
          : theme.colors.green[3],
    },
    "& tbody": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.green[9]
          : theme.colors.green[0],
    },
  },
}));

export type SSOTFilterFormValues = {
  search: string;
  projectNameList: string[];
  itemNameList: string[];
  supplierList: string[];
};

type Props = {
  data: SSOTType[];
  projectNameList: string[];
  itemNameList: string[];
};

export type ShowColumnList = { [key: string]: boolean };

const requisitionTableColumnList = [
  "Requisition ID",
  "Date Created",
  "Warehouse Processor",
  "Parent Requisition ID",
  "Project Name",
  "Type",
  "Date Needed",
  "Item Name",
  "Parent Quantity",
  "Quantity",
  "Unit of Measurement",
  "Description",
  "Cost Code",
  "GL Account",
];

const quotationTableColumnList = [
  "Quotation ID",
  "Date Created",
  "Accounting Processor",
  "Supplier",
  "Supplier Quotation",
  "Send Method",
  "Proof of Sending",
  "Item",
  "Price Per Unit",
  "Quantity",
  "Unit of Measurement",
];

const rirTableColumnList = [
  "RIR ID",
  "Date Created",
  "Warehouse Receiver",
  "DR",
  "SI",
  "Item",
  "Quantity",
  "Unit of Measurement",
  "Receiving Status",
];

const releaseOrderTableColumnList = [
  "Release Order ID",
  "Date Created",
  "Warehouse Receiver",
  "DR",
  "SI",
  "Item",
  "Quantity",
  "Unit of Measurement",
  "Receiving Status",
];

const chequeReferenceTableColumnList = [
  "Cheque Reference ID",
  "Date Created",
  "Treasury Processor",
  "Treasury Status",
  "Cheque Cancelled",
  "Cheque Printed Date",
  "Cheque Clearing Date",
  "Cheque First Signatory Name",
  "Cheque First Date Signed",
  "Cheque Second Signatory Name",
  "Cheque Second Date Signed",
];

const convertColumnListArrayToObject = (array: string[]) => {
  const obj = array.reduce((obj, item) => {
    obj[item.toLowerCase().replace(/\s+/g, "_")] = true;
    return obj;
  }, {} as ShowColumnList);

  return obj;
};

const SSOTSpreadsheetView = ({
  data,
  projectNameList,
  itemNameList,
}: Props) => {
  const { classes } = useStyles();
  const { height } = useViewportSize();
  const { ref: topElementRef, height: topElementHeight } = useElementSize();
  const supabaseClient = createPagesBrowserClient<Database>();
  const containerRef = useRef<HTMLTableElement>(null);
  const team = useActiveTeam();
  const viewport = useRef<HTMLDivElement>(null);

  const [requisitionList, setRequisitionList] = useState(data);
  const [offset, setOffset] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollBarType, setScrollBarType] = useState<"always" | "never">(
    "always"
  );
  const [isFetchable, setIsFetchable] = useState(
    requisitionList.length === DEFAULT_NUMBER_SSOT_ROWS
  );

  const [showRequisitionTable, setShowRequisitionTable] = useState(true);
  const [showQuotationTable, setShowQuotationTable] = useState(true);
  const [showRIRTable, setShowRIRTable] = useState(true);
  const [showReleaseOrderTable, setShowReleaseOrderTable] = useState(true);
  const [showChequeReferenceTable, setShowChequeReferenceTable] =
    useState(true);

  const [showRequisitionColumnList, setShowRequisitionColumnList] =
    useState<ShowColumnList>(
      convertColumnListArrayToObject(requisitionTableColumnList)
    );

  const [showQuotationColumnList, setShowQuotationColumnList] =
    useState<ShowColumnList>(
      convertColumnListArrayToObject(quotationTableColumnList)
    );

  const [showRIRColumnList, setShowRIRColumnList] = useState<ShowColumnList>(
    convertColumnListArrayToObject(rirTableColumnList)
  );

  const [showReleaseOrderColumnList, setShowReleaseOrderColumnList] =
    useState<ShowColumnList>(
      convertColumnListArrayToObject(releaseOrderTableColumnList)
    );

  const [showChequeReferenceColumnList, setShowChequeReferenceColumnList] =
    useState<ShowColumnList>(
      convertColumnListArrayToObject(chequeReferenceTableColumnList)
    );

  const filterSSOTMethods = useForm<SSOTFilterFormValues>({
    defaultValues: {
      search: "",
      itemNameList: [],
      projectNameList: [],
      supplierList: [],
    },
    mode: "onChange",
  });

  const { handleSubmit, getValues } = filterSSOTMethods;

  const handleFilterSSOT = async (
    {
      search,
      projectNameList,
      itemNameList,
      supplierList,
    }: SSOTFilterFormValues = getValues()
  ) => {
    try {
      setIsLoading(true);
      setScrollBarType("never");
      setOffset(1);

      const trimmedSearch = search.trim();

      let requisitionFilterCount = 0;
      projectNameList.length !== 0 && requisitionFilterCount++;
      itemNameList.length !== 0 && requisitionFilterCount++;
      trimmedSearch.length !== 0 && requisitionFilterCount++;

      const { data, error } = await supabaseClient.rpc("get_ssot", {
        input_data: {
          activeTeam: team.team_id,
          pageNumber: 1,
          rowLimit: DEFAULT_NUMBER_SSOT_ROWS,
          search: UUID_EXP.test(trimmedSearch) ? trimmedSearch : "",
          requisitionFilter: [
            ...projectNameList,
            ...itemNameList,
            ...(trimmedSearch ? [`${trimmedSearch}`] : []),
          ],
          requisitionFilterCount,
          supplierList,
        },
      });

      if (error) throw error;
      const formattedData = data as SSOTType[];
      if (formattedData.length === DEFAULT_NUMBER_SSOT_ROWS) {
        setIsFetchable(true);
      } else {
        setIsFetchable(false);
      }
      setRequisitionList(formattedData);
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
    {
      search,
      projectNameList,
      itemNameList,
      supplierList,
    }: SSOTFilterFormValues = getValues()
  ) => {
    try {
      setIsLoading(true);
      setScrollBarType("never");

      const trimmedSearch = search.trim();

      let requisitionFilterCount = 0;
      projectNameList.length !== 0 && requisitionFilterCount++;
      itemNameList.length !== 0 && requisitionFilterCount++;
      trimmedSearch.length !== 0 && requisitionFilterCount++;

      const { data, error } = await supabaseClient.rpc("get_ssot", {
        input_data: {
          activeTeam: team.team_id,
          pageNumber: offset,
          rowLimit: DEFAULT_NUMBER_SSOT_ROWS,
          search: UUID_EXP.test(trimmedSearch) ? trimmedSearch : "",
          requisitionFilter: [
            ...projectNameList,
            ...itemNameList,
            ...(trimmedSearch ? [`${trimmedSearch}`] : []),
          ],
          requisitionFilterCount,
          supplierList: supplierList,
        },
      });

      if (error) throw error;
      if (data) {
        const formattedData = data as SSOTType[];
        if (formattedData.length < DEFAULT_NUMBER_SSOT_ROWS) {
          setIsFetchable(false);
          setRequisitionList((prev) => [...prev, ...formattedData]);
        } else {
          setIsFetchable(true);
          setRequisitionList((prev) => [...prev, ...formattedData]);
        }
      }
    } catch (e) {
      console.error(e);
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

  const renderChequeReference = (
    request: SSOTType["requisition_cheque_reference_request"]
  ) => {
    return request.map((request) => {
      return (
        <tr
          key={request.cheque_reference_request_id}
          className={classes.cell}
          style={{ borderTop: "solid 1px #DEE2E6" }}
        >
          {showChequeReferenceColumnList["cheque_reference_id"] && (
            <td>{request.cheque_reference_request_id}</td>
          )}
          {showChequeReferenceColumnList["date_created"] && (
            <td>
              {new Date(
                request.cheque_reference_request_date_created
              ).toLocaleDateString()}
            </td>
          )}
          {showChequeReferenceColumnList["treasury_processor"] && (
            <td>{`${request.cheque_reference_request_owner.user_first_name} ${request.cheque_reference_request_owner.user_last_name}`}</td>
          )}

          {request.cheque_reference_request_response
            .slice(1)
            .map((response, index) => {
              const fieldName =
                response.request_response_field_name.toLowerCase();
              const columnPropName = fieldName.replace(/\s+/g, "_");
              const showColumn = showChequeReferenceColumnList[columnPropName];

              return (
                showColumn && (
                  <td key={index}>
                    {response.request_response_field_type === "DATE" ? (
                      new Date(
                        JSON.parse(response.request_response)
                      ).toLocaleDateString()
                    ) : response.request_response_field_type === "FILE" ? (
                      <ActionIcon
                        w="100%"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `${JSON.parse(response.request_response)}`,
                            "_blank"
                          )
                        }
                      >
                        <Flex align="center" justify="center" gap={2}>
                          <Text size={14}>File</Text> <IconFile size={14} />
                        </Flex>
                      </ActionIcon>
                    ) : (
                      `${JSON.parse(response.request_response)}`
                    )}
                  </td>
                )
              );
            })}
        </tr>
      );
    });
  };

  const renderRir = (
    request: SSOTType["requisition_quotation_request"][0]["quotation_rir_request"],
    showColumnList: ShowColumnList,
    isRIR: boolean
  ) => {
    return request.map((request) => {
      const itemName: string[] = [];
      const itemQuantity: string[] = [];
      const itemUnit: string[] = [];
      const itemStatus: string[] = [];
      const items = request.rir_request_response;
      let dr = "";
      let si = "";

      const idColumnName = isRIR ? "rir_id" : "release_order_id";

      items.forEach((item) => {
        if (item.request_response_field_name === "Item") {
          const quantityMatch = item.request_response.match(/(\d+)/);
          if (!quantityMatch) return;
          itemName.push(
            JSON.parse(
              item.request_response.replace(
                quantityMatch[1],
                addCommaToNumber(Number(quantityMatch[1]))
              )
            )
          );
        } else if (item.request_response_field_name === "Quantity") {
          const matches = regExp.exec(itemName[itemQuantity.length]);
          const unit = matches && matches[1].replace(/[0-9,]/g, "").trim();

          itemQuantity.push(JSON.parse(item.request_response));
          itemUnit.push(`${unit}`);
        } else if (item.request_response_field_name === "Receiving Status") {
          itemStatus.push(JSON.parse(item.request_response));
        } else if (item.request_response_field_name === "DR") {
          dr = item.request_response;
        } else if (item.request_response_field_name === "SI") {
          si = item.request_response;
        }
      });

      return (
        <tr
          key={request.rir_request_id}
          className={classes.cell}
          style={{ borderTop: "solid 1px #DEE2E6" }}
        >
          {showColumnList[idColumnName] && <td>{request.rir_request_id}</td>}
          {showColumnList["date_created"] && (
            <td>
              {new Date(request.rir_request_date_created).toLocaleDateString()}
            </td>
          )}
          {showColumnList["warehouse_receiver"] && (
            <td>{`${request.rir_request_owner.user_first_name} ${request.rir_request_owner.user_last_name}`}</td>
          )}
          {showColumnList["dr"] && (
            <td>
              {dr && (
                <ActionIcon
                  w="100%"
                  variant="outline"
                  onClick={() => window.open(`${JSON.parse(dr)}`, "_blank")}
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Text size={14}>File</Text> <IconFile size={14} />
                  </Flex>
                </ActionIcon>
              )}
            </td>
          )}
          {showColumnList["si"] && (
            <td>
              {si && (
                <ActionIcon
                  w="100%"
                  variant="outline"
                  onClick={() => window.open(`${JSON.parse(si)}`, "_blank")}
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Text size={14}>File</Text> <IconFile size={14} />
                  </Flex>
                </ActionIcon>
              )}
            </td>
          )}
          {showColumnList["item"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemName.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showColumnList["quantity"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemQuantity.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{addCommaToNumber(Number(item))}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showColumnList["unit_of_measurement"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemUnit.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showColumnList["receiving_status"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemStatus.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
        </tr>
      );
    });
  };

  const renderQuotation = (
    request: SSOTType["requisition_quotation_request"]
  ) => {
    return request.map((request) => {
      const itemName: string[] = [];
      const itemPrice: string[] = [];
      const itemQuantity: string[] = [];
      const itemUnit: string[] = [];

      const items = request.quotation_request_response.slice(
        3,
        request.quotation_request_response.length
      );
      items.forEach((item) => {
        if (item.request_response_field_name === "Item") {
          const quantityMatch = item.request_response.match(/(\d+)/);
          if (!quantityMatch) return;
          itemName.push(
            JSON.parse(
              item.request_response.replace(
                quantityMatch[1],
                addCommaToNumber(Number(quantityMatch[1]))
              )
            )
          );
        } else if (item.request_response_field_name === "Price per Unit") {
          itemPrice.push(JSON.parse(item.request_response));
        } else if (item.request_response_field_name === "Quantity") {
          const matches = regExp.exec(itemName[itemQuantity.length]);
          const unit = matches && matches[1].replace(/[0-9,]/g, "").trim();

          itemQuantity.push(JSON.parse(item.request_response));
          itemUnit.push(`${unit}`);
        }
      });

      return (
        <tr
          key={request.quotation_request_id}
          className={classes.cell}
          style={{ borderTop: "solid 1px #DEE2E6" }}
        >
          {showQuotationColumnList["quotation_id"] && (
            <td>{request.quotation_request_id}</td>
          )}
          {showQuotationColumnList["date_created"] && (
            <td>
              {new Date(
                request.quotation_request_date_created
              ).toLocaleDateString()}
            </td>
          )}
          {showQuotationColumnList["accounting_processor"] && (
            <td>{`${request.quotation_request_owner.user_first_name} ${request.quotation_request_owner.user_last_name}`}</td>
          )}
          {request.quotation_request_response
            .slice(1, 3)
            .map((response, index) => {
              const fieldName =
                response.request_response_field_name.toLowerCase();
              const columnPropName = fieldName.replace(/\s+/g, "_");
              const showColumn = showQuotationColumnList[columnPropName];

              return (
                showColumn && (
                  <td key={index}>
                    {response.request_response_field_type === "DATE" ? (
                      new Date(
                        JSON.parse(response.request_response)
                      ).toLocaleDateString()
                    ) : response.request_response_field_type === "FILE" ? (
                      <ActionIcon
                        w="100%"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `${JSON.parse(response.request_response)}`,
                            "_blank"
                          )
                        }
                      >
                        <Flex align="center" justify="center" gap={2}>
                          <Text size={14}>File</Text> <IconFile size={14} />
                        </Flex>
                      </ActionIcon>
                    ) : (
                      JSON.parse(response.request_response)
                    )}
                  </td>
                )
              );
            })}
          {showQuotationColumnList["send_method"] && (
            <td>
              {request.quotation_request_response[3]
                .request_response_field_name === "Request Send Method" &&
                JSON.parse(
                  request.quotation_request_response[3].request_response
                )}
            </td>
          )}
          {showQuotationColumnList["proof_of_sending"] && (
            <td>
              {request.quotation_request_response[4]
                .request_response_field_name === "Proof of Sending" && (
                <ActionIcon
                  w="100%"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `${JSON.parse(
                        request.quotation_request_response[4].request_response
                      )}`,
                      "_blank"
                    )
                  }
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Text size={14}>File</Text> <IconFile size={14} />
                  </Flex>
                </ActionIcon>
              )}
            </td>
          )}
          {showQuotationColumnList["item"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemName.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showQuotationColumnList["price_per_unit"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemPrice.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>₱ {addCommaToNumber(Number(item))}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showQuotationColumnList["quantity"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemQuantity.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{addCommaToNumber(Number(item))}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showQuotationColumnList["unit_of_measurement"] && (
            <td>
              <List sx={{ listStyle: "none" }} spacing="xs">
                {itemUnit.map((item, index) => (
                  <List.Item key={index}>
                    <Text size={14}>{item}</Text>
                  </List.Item>
                ))}
              </List>
            </td>
          )}
          {showQuotationTable &&
            (showRIRTable && request.quotation_rir_request.length !== 0 ? (
              <td style={{ padding: 0 }}>
                <Table
                  withBorder
                  withColumnBorders
                  h="100%"
                  className={classes.rirTable}
                >
                  <thead>
                    <tr>
                      {rirTableColumnList.map((column, index) => {
                        const propName = column
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        return (
                          showRIRColumnList[propName] && (
                            <th key={index} className={classes.long}>
                              {column}
                            </th>
                          )
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {renderRir(
                      request.quotation_rir_request,
                      showRIRColumnList,
                      true
                    )}
                  </tbody>
                </Table>
              </td>
            ) : null)}
        </tr>
      );
    });
  };

  const renderRequisition = () => {
    return requisitionList.map((request) => {
      const itemName: string[] = [];
      const itemUnit: string[] = [];
      const itemQuantity: string[] = [];
      const itemDescription: string[] = [];
      const itemCostCode: string[] = [];
      const itemGlAccount: string[] = [];

      const parentItemName: string[] = [];
      const parentItemQuantity: string[] = [];
      const parentItemDescription: string[] = [];

      const parentQuantityList: string[] = [];

      const fields = request.requisition_request_response.sort(
        (a: SSOTResponseType, b: SSOTResponseType) => {
          return (
            REQUISITION_FIELDS_ORDER.indexOf(a.request_response_field_name) -
            REQUISITION_FIELDS_ORDER.indexOf(b.request_response_field_name)
          );
        }
      );

      const items = fields.slice(0, -REQUISITION_FIELDS_ORDER.length);
      const sortedAndGroupedItems = sortAndGroupItems(items);
      sortedAndGroupedItems.forEach((group, groupIndex) => {
        itemDescription[groupIndex] = "";
        group.forEach((item) => {
          if (item.request_response_field_name === "General Name") {
            itemName[groupIndex] = JSON.parse(item.request_response);
          } else if (
            item.request_response_field_name === "Unit of Measurement"
          ) {
            itemUnit[groupIndex] = JSON.parse(item.request_response);
          } else if (item.request_response_field_name === "Quantity") {
            itemQuantity[groupIndex] = JSON.parse(item.request_response);
          } else if (item.request_response_field_name === "Cost Code") {
            itemCostCode[groupIndex] = JSON.parse(item.request_response);
          } else if (item.request_response_field_name === "GL Account") {
            itemGlAccount[groupIndex] = JSON.parse(item.request_response);
          } else {
            itemDescription[groupIndex] += `${
              item.request_response_field_name
            }: ${JSON.parse(item.request_response)}, `;
          }
        });
        itemDescription[groupIndex] = itemDescription[groupIndex].slice(0, -2);
      });

      if (request.requisition_parent_requisition_response_fields) {
        const parentFields =
          request.requisition_parent_requisition_response_fields.sort(
            (a: SSOTResponseType, b: SSOTResponseType) => {
              return (
                REQUISITION_FIELDS_ORDER.indexOf(
                  a.request_response_field_name
                ) -
                REQUISITION_FIELDS_ORDER.indexOf(b.request_response_field_name)
              );
            }
          );

        const parentItems = parentFields.slice(
          0,
          -REQUISITION_FIELDS_ORDER.length
        );

        const parentSortedAndGroupedItems = sortAndGroupItems(parentItems);
        parentSortedAndGroupedItems.forEach((group, groupIndex) => {
          parentItemDescription[groupIndex] = "";
          group.forEach((item) => {
            if (item.request_response_field_name === "General Name") {
              parentItemName[groupIndex] = JSON.parse(item.request_response);
            } else if (item.request_response_field_name === "Quantity") {
              parentItemQuantity[groupIndex] = JSON.parse(
                item.request_response
              );
            } else if (
              ["Cost Code", "GL Account", "Unit of Measurement"].includes(
                item.request_response_field_name
              )
            ) {
            } else {
              parentItemDescription[groupIndex] += `${
                item.request_response_field_name
              }: ${JSON.parse(item.request_response)}, `;
            }
          });
          parentItemDescription[groupIndex] = parentItemDescription[
            groupIndex
          ].slice(0, -2);
        });
      }

      itemName.forEach((name, nameIndex) => {
        for (const [parentNameIndex, parentName] of parentItemName.entries()) {
          if (
            name === parentName &&
            itemDescription[nameIndex] ===
              parentItemDescription[parentNameIndex]
          ) {
            parentQuantityList[nameIndex] = parentItemQuantity[parentNameIndex];
          }
        }
      });

      return (
        <tr key={request.requisition_request_id} className={classes.cell}>
          {showRequisitionTable && (
            <>
              {showRequisitionColumnList["requisition_id"] && (
                <td>{request.requisition_request_id}</td>
              )}
              {showRequisitionColumnList["date_created"] && (
                <td>
                  {new Date(
                    request.requisition_request_date_created
                  ).toLocaleDateString()}
                </td>
              )}

              {showRequisitionColumnList["warehouse_processor"] && (
                <td>{`${request.requisition_request_owner.user_first_name} ${request.requisition_request_owner.user_last_name}`}</td>
              )}
              {fields
                .slice(-REQUISITION_FIELDS_ORDER.length)
                .map((response, index) => {
                  const fieldName =
                    response.request_response_field_name.toLowerCase();
                  const columnPropName = fieldName.replace(/\s+/g, "_");
                  const showColumn = showRequisitionColumnList[columnPropName];

                  return (
                    showColumn && (
                      <td key={index}>
                        {response.request_response_field_type === "DATE"
                          ? new Date(
                              JSON.parse(response.request_response)
                            ).toLocaleDateString()
                          : JSON.parse(response.request_response) !== "null"
                          ? JSON.parse(response.request_response)
                          : ""}
                      </td>
                    )
                  );
                })}
              {showRequisitionColumnList["item_name"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemName.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["parent_quantity"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {parentQuantityList.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["quantity"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemQuantity.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{addCommaToNumber(Number(item))}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["unit_of_measurement"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemUnit.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["description"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemDescription.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["cost_code"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemCostCode.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
              {showRequisitionColumnList["gl_account"] && (
                <td>
                  <List sx={{ listStyle: "none" }} spacing="xs">
                    {itemGlAccount.map((item, index) => (
                      <List.Item key={index}>
                        <Text size={14}>{item}</Text>
                      </List.Item>
                    ))}
                  </List>
                </td>
              )}
            </>
          )}
          {showQuotationTable && (
            <td style={{ padding: 0 }}>
              {request.requisition_quotation_request.length !== 0 ? (
                <Table
                  withBorder
                  withColumnBorders
                  h="100%"
                  className={classes.quotationTable}
                >
                  <thead>
                    <tr>
                      {showQuotationColumnList["quotation_id"] && (
                        <th className={classes.long}>Quotation ID</th>
                      )}
                      {showQuotationColumnList["date_created"] && (
                        <th className={classes.date}>Date Created</th>
                      )}
                      {showQuotationColumnList["accounting_processor"] && (
                        <th className={classes.processor}>
                          Accounting Processor
                        </th>
                      )}
                      {showQuotationColumnList["supplier"] && (
                        <th className={classes.long}>Supplier</th>
                      )}
                      {showQuotationColumnList["supplier_quotation"] && (
                        <th className={classes.normal}>Supplier Quotation</th>
                      )}
                      {showQuotationColumnList["send_method"] && (
                        <th className={classes.short}>Send Method</th>
                      )}
                      {showQuotationColumnList["proof_of_sending"] && (
                        <th className={classes.normal}>Proof of Sending</th>
                      )}
                      {showQuotationColumnList["item"] && (
                        <th className={classes.description}>Item</th>
                      )}
                      {showQuotationColumnList["price_per_unit"] && (
                        <th className={classes.normal}>Price per Unit</th>
                      )}
                      {showQuotationColumnList["quantity"] && (
                        <th className={classes.normal}>Quantity</th>
                      )}
                      {showQuotationColumnList["unit_of_measurement"] && (
                        <th className={classes.date}>Unit of Measurement</th>
                      )}
                      {showQuotationTable && showRIRTable && (
                        <th>Receiving Inspecting Report</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {renderQuotation(request.requisition_quotation_request)}
                  </tbody>
                </Table>
              ) : null}
            </td>
          )}
          {showReleaseOrderTable && (
            <td style={{ padding: 0 }}>
              {request.requisition_rir_request.length !== 0 ? (
                <Table
                  withBorder
                  withColumnBorders
                  h="100%"
                  className={classes.roTable}
                >
                  <thead>
                    <tr>
                      {showReleaseOrderColumnList["release_order_id"] && (
                        <th className={classes.long}>Release Order ID</th>
                      )}
                      {showReleaseOrderColumnList["date_created"] && (
                        <th className={classes.date}>Date Created</th>
                      )}
                      {showReleaseOrderColumnList["warehouse_receiver"] && (
                        <th className={classes.processor}>
                          Warehouse Receiver
                        </th>
                      )}
                      {showReleaseOrderColumnList["dr"] && (
                        <th className={classes.short}>DR</th>
                      )}
                      {showReleaseOrderColumnList["si"] && (
                        <th className={classes.short}>SI</th>
                      )}
                      {showReleaseOrderColumnList["item"] && (
                        <th className={classes.description}>Item</th>
                      )}
                      {showReleaseOrderColumnList["quantity"] && (
                        <th className={classes.normal}>Quantity</th>
                      )}
                      {showReleaseOrderColumnList["unit_of_measurement"] && (
                        <th className={classes.date}>Unit of Measurement</th>
                      )}
                      {showReleaseOrderColumnList["receiving_status"] && (
                        <th className={classes.long}>Receiving Status</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {renderRir(
                      request.requisition_rir_request,
                      showReleaseOrderColumnList,
                      false
                    )}
                  </tbody>
                </Table>
              ) : null}
            </td>
          )}
          {showChequeReferenceTable && (
            <td style={{ padding: 0 }}>
              {request.requisition_cheque_reference_request.length !== 0 ? (
                <Table
                  withBorder
                  withColumnBorders
                  h="100%"
                  className={classes.chequeReferenceTable}
                >
                  <thead>
                    <tr>
                      {showChequeReferenceColumnList["cheque_reference_id"] && (
                        <th className={classes.long}>Cheque Reference ID</th>
                      )}
                      {showChequeReferenceColumnList["date_created"] && (
                        <th className={classes.date}>Date Created</th>
                      )}
                      {showChequeReferenceColumnList["treasury_processor"] && (
                        <th className={classes.processor}>
                          Treasury Processor
                        </th>
                      )}
                      {showChequeReferenceColumnList["treasury_status"] && (
                        <th className={classes.normal}>Treasury Status</th>
                      )}
                      {showChequeReferenceColumnList["cheque_cancelled"] && (
                        <th className={classes.short}>Cheque Cancelled</th>
                      )}
                      {showChequeReferenceColumnList["cheque_printed_date"] && (
                        <th className={classes.date}>Cheque Printed Date</th>
                      )}
                      {showChequeReferenceColumnList[
                        "cheque_clearing_date"
                      ] && (
                        <th className={classes.date}>Cheque Clearing Date</th>
                      )}
                      {showChequeReferenceColumnList[
                        "cheque_first_signatory_name"
                      ] && (
                        <th className={classes.processor}>
                          Cheque First Signatory Name
                        </th>
                      )}
                      {showChequeReferenceColumnList[
                        "cheque_first_date_signed"
                      ] && (
                        <th className={classes.date}>
                          Cheque First Date Signed
                        </th>
                      )}
                      {showChequeReferenceColumnList[
                        "cheque_second_signatory_name"
                      ] && (
                        <th className={classes.processor}>
                          Cheque Second Signatory Name
                        </th>
                      )}
                      {showChequeReferenceColumnList[
                        "cheque_second_date_signed"
                      ] && (
                        <th className={classes.date}>
                          Cheque Second Date Signed
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {renderChequeReference(
                      request.requisition_cheque_reference_request
                    )}
                  </tbody>
                </Table>
              ) : null}
            </td>
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

  return (
    <Flex direction="column" p="0">
      <Box ref={topElementRef}>
        <Title order={2} color="dimmed">
          SSOT Spreadsheet View
        </Title>

        <Space h="sm" />
        <Group>
          <FormProvider {...filterSSOTMethods}>
            <form onSubmit={handleSubmit(handleFilterSSOT)}>
              <SSOTSpreadsheetViewFilter
                handleFilterSSOT={handleFilterSSOT}
                projectNameList={projectNameList}
                itemNameList={itemNameList}
              />
            </form>
          </FormProvider>
          <SSOTSpreadsheetViewTableFilter
            // column list
            requisitionTableColumnList={requisitionTableColumnList}
            quotationTableColumnList={quotationTableColumnList}
            rirTableColumnList={rirTableColumnList}
            releaseOrderTableColumnList={releaseOrderTableColumnList}
            chequeReferenceTableColumnList={chequeReferenceTableColumnList}
            // table list state
            showRequisitionTable={showRequisitionTable}
            setShowRequisitionTable={setShowRequisitionTable}
            showQuotationTable={showQuotationTable}
            setShowQuotationTable={setShowQuotationTable}
            showRIRTable={showRIRTable}
            setShowRIRTable={setShowRIRTable}
            showReleaseOrderTable={showReleaseOrderTable}
            setShowReleaseOrderTable={setShowReleaseOrderTable}
            showChequeReferenceTable={showChequeReferenceTable}
            setShowChequeReferenceTable={setShowChequeReferenceTable}
            // column list state
            showRequisitionColumnList={showRequisitionColumnList}
            setShowRequisitionColumnList={setShowRequisitionColumnList}
            showQuotationColumnList={showQuotationColumnList}
            setShowQuotationColumnList={setShowQuotationColumnList}
            showRIRColumnList={showRIRColumnList}
            setShowRIRColumnList={setShowRIRColumnList}
            showReleaseOrderColumnList={showReleaseOrderColumnList}
            setShowReleaseOrderColumnList={setShowReleaseOrderColumnList}
            showChequeReferenceColumnList={showChequeReferenceColumnList}
            setShowChequeReferenceColumnList={setShowChequeReferenceColumnList}
          />
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
              className={classes.requisitionTable}
              ref={containerRef}
            >
              <thead>
                <tr>
                  {showRequisitionTable && (
                    <>
                      {showRequisitionColumnList["requisition_id"] && (
                        <th className={classes.long}>Requisition ID</th>
                      )}
                      {showRequisitionColumnList["date_created"] && (
                        <th className={classes.date}>Date Created</th>
                      )}
                      {showRequisitionColumnList["warehouse_processor"] && (
                        <th className={classes.processor}>
                          Warehouse Processor
                        </th>
                      )}
                      {showRequisitionColumnList["parent_requisition_id"] && (
                        <th className={classes.long}>Parent Requisition ID</th>
                      )}

                      {showRequisitionColumnList["project_name"] && (
                        <th className={classes.long}>Project Name</th>
                      )}
                      {showRequisitionColumnList["type"] && (
                        <th className={classes.normal}>Type</th>
                      )}
                      {showRequisitionColumnList["type"] && (
                        <th className={classes.normal}>Date Needed</th>
                      )}
                      {showRequisitionColumnList["item_name"] && (
                        <th className={classes.description}>Item Name</th>
                      )}
                      {showRequisitionColumnList["parent_quantity"] && (
                        <th className={classes.normal}>Parent Quantity</th>
                      )}
                      {showRequisitionColumnList["quantity"] && (
                        <th className={classes.normal}>Quantity</th>
                      )}
                      {showRequisitionColumnList["unit_of_measurement"] && (
                        <th className={classes.date}>Unit of Measurement</th>
                      )}
                      {showRequisitionColumnList["description"] && (
                        <th className={classes.description}>Description</th>
                      )}
                      {showRequisitionColumnList["cost_code"] && (
                        <th className={classes.short}>Cost Code</th>
                      )}
                      {showRequisitionColumnList["gl_account"] && (
                        <th className={classes.short}>GL Account</th>
                      )}
                    </>
                  )}
                  {showQuotationTable && <th>Quotation</th>}
                  {showReleaseOrderTable && <th>Release Order</th>}
                  {showChequeReferenceTable && <th>Cheque Reference</th>}
                </tr>
              </thead>
              <tbody>{renderRequisition()}</tbody>
            </Table>
          </Box>
        </ScrollArea>
      </Paper>
    </Flex>
  );
};

export default SSOTSpreadsheetView;
