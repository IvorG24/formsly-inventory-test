import { formatDate, formatTime } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { LRFSpreadsheetData } from "@/utils/types";
import { Button } from "@mantine/core";
import { CSVLink } from "react-csv";

type CSVData = {
  request_id: string;
  request_jira_id: string | undefined;
  request_date_created: string;
  request_boq_id: string;
  supplier_name_payee: string;
  type_of_request: string;
  invoice_amount: string;
  vat: string;
  cost: string;
  equipment_code: string;
  cost_code: string;
  boq_code: string;
};

const ExportCSVButton = ({ data }: { data: LRFSpreadsheetData[] }) => {
  const headers = [
    { label: "Request ID", key: "request_id" },
    { label: "Project Code", key: "request_project_code" },
    { label: "Department Code", key: "request_department_code" },
    { label: "Jira ID", key: "request_jira_id" },
    { label: "Date Created", key: "request_date_created" },
    { label: "BOQ Request", key: "request_boq_id" },
    { label: "Supplier Name/Payee", key: "supplier_name_payee" },
    { label: "Type of Request", key: "type_of_request" },
    { label: "Invoice Amount", key: "invoice_amount" },
    { label: "VAT", key: "vat" },
    { label: "Cost", key: "cost" },
    { label: "Equipment Code", key: "equipment_code" },
    { label: "Cost Code", key: "cost_code" },
    { label: "BOQ Code", key: "boq_code" },
  ];

  const formatDataForCSV = (data: LRFSpreadsheetData[]) => {
    const csvData: CSVData[] = [];

    data.forEach((item) => {
      const groupedResponses = item.request_response_list.reduce(
        (acc, curr) => {
          const matchIndex = acc.findIndex(
            (response) =>
              response.duplicatable_id ===
              curr.request_response_duplicatable_section_id
          );

          if (matchIndex >= 0) {
            acc[matchIndex].response_list = [
              ...acc[matchIndex].response_list,
              curr,
            ];
          } else {
            acc.push({
              duplicatable_id: curr.request_response_duplicatable_section_id,
              response_list: [curr],
            });
          }

          return acc;
        },
        [] as unknown as ({ duplicatable_id: string | null } & {
          response_list: LRFSpreadsheetData["request_response_list"];
        })[]
      );
      groupedResponses.forEach((response) => {
        const newCsvData = {
          request_id: `${item.request_formsly_id_prefix}-${item.request_formsly_id_serial}`,
          request_project_code: item.jira_project_jira_label,
          request_department_code: item.request_department_code,
          request_jira_id: item.request_jira_id,
          request_date_created: `${formatDate(
            new Date(item.request_date_created)
          )} ${formatTime(new Date(item.request_date_created))}`,
          request_boq_id: item.request_boq_data
            ? item.request_boq_data.request_formsly_id
            : "N/A",
          supplier_name_payee: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Supplier Name/Payee"
              )?.request_response ?? ""
            }`
          ),
          type_of_request: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Type of Request"
              )?.request_response ?? ""
            }`
          ),
          invoice_amount: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Invoice Amount"
              )?.request_response ?? ""
            }`
          ),
          vat: safeParse(
            `${
              response.response_list.find((field) => field.field_name === "VAT")
                ?.request_response ?? ""
            }`
          ),
          cost: `${
            response.response_list.find((field) => field.field_name === "Cost")
              ?.request_response ?? ""
          }`,
          equipment_code: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Equipment Code"
              )?.request_response ?? ""
            }`
          ),
          cost_code: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Cost Code"
              )?.request_response ?? ""
            }`
          ),
          boq_code: safeParse(
            `${
              response.response_list.find(
                (field) => field.field_name === "Bill of Quantity Code"
              )?.request_response ?? ""
            }`
          ),
        };

        csvData.push(newCsvData);
      });
    });

    return csvData;
  };

  const csvData = formatDataForCSV(data);

  return (
    <Button>
      <CSVLink
        style={{ textDecoration: "none", color: "white" }}
        data={csvData}
        headers={headers}
        filename={"lrf_data.csv"}
        target="_blank"
      >
        Export to CSV
      </CSVLink>
    </Button>
  );
};

export default ExportCSVButton;
