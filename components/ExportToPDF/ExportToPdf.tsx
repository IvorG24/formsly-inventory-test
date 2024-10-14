"use client";

import { formatDate } from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { startCase } from "@/utils/string";
import {
  ApproverDetailsType,
  DuplicateSectionType,
  RequestWithResponseType,
} from "@/utils/types";
import { Flex, Loader } from "@mantine/core";
import { Font, usePDF } from "@react-pdf/renderer";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ITAssetPdfDocumentTableVersion from "./ITAssetPdfDocumentTableVersion";
import ItemPdfDocumentTableVersion from "./ItemPdfDocumentTableVersion";
import LiquidationReimbursementTableVersion from "./LiquidationReimbursementTableVersion";
import OtherExpensesPdfDocumentTableVersion from "./OtherExpensesPdfDocumentTableVersion";
import PEDEquipmentPdfDocumentTableVersion from "./PEDEquipmentPdfDocumentTableVersion";
import PEDItemBulkPdfDocumentTableVersion from "./PEDItemBulkPdfDocumentTableVersion";
import PEDItemSinglePdfDocumentTableVersion from "./PEDItemSinglePdfDocumentTableVersion";
import PEDPartPdfDocumentTableVersion from "./PEDPartPdfDocumentTableVersion";
import PdfDocument from "./PdfDocument";
import ServicesPdfDocumentTableVersion from "./ServicesPdfDocumentTableVersion";

type Props = {
  request: RequestWithResponseType;
  sectionWithDuplicateList: DuplicateSectionType[];
  approverDetails: ApproverDetailsType[];
};

Font.register({
  family: "Open Sans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf",
      fontWeight: 600,
    },
  ],
});

const getReadableDate = (date: string) => formatDate(new Date(date));

const ExportToPdf = ({
  request,
  sectionWithDuplicateList,
  approverDetails,
}: Props) => {
  const router = useRouter();
  const requestor = request.request_team_member.team_member_user;
  const requestDateCreated = getReadableDate(request.request_date_created);

  const requestDetails = [
    {
      label: "Request ID:",
      value: request.request_id,
    },
    {
      label: "Form Name:",
      value: request.request_form.form_name,
    },
    {
      label: "Form Description:",
      value: request.request_form.form_description,
    },
    ...(request.request_form.form_type && request.request_form.form_sub_type
      ? [
          {
            label: "Type:",
            value: request.request_form.form_type,
          },
          {
            label: "Sub Type:",
            value: request.request_form.form_sub_type,
          },
        ]
      : []),
  ];

  const requestorDetails = [
    {
      label: "Requested by:",
      value: `${requestor.user_first_name} ${requestor.user_last_name}`,
      additional: requestor.user_job_title,
    },
    {
      label: "Date requested:",
      value: requestDateCreated,
    },
    {
      label: "Request status:",
      value: `${startCase(request.request_status.toLowerCase())}`,
    },
  ];

  const requestIDs = [
    ...(request.request_formsly_id
      ? [
          {
            label: "Formsly ID:",
            value: `${request.request_formsly_id}`,
          },
        ]
      : []),
    ...(request.request_jira_id
      ? [
          {
            label: "Jira ID:",
            value: `${request.request_jira_id}`,
          },
        ]
      : []),
    ...(request.request_otp_id
      ? [
          {
            label: "OTP ID:",
            value: `${request.request_otp_id}`,
          },
        ]
      : []),
  ];

  const requestItems = sectionWithDuplicateList.map((section) => {
    const title = section.section_name;

    const fields = section.section_field
      .filter((field) => field.field_response)
      .map((field) => {
        let response = "";
        if (field.field_response?.request_response) {
          response = safeParse(field.field_response?.request_response);
        }

        switch (field.field_type) {
          case "DATE":
            response = getReadableDate(response);
            break;
          case "FILE":
            response = "File";
          default:
            response;
        }

        return {
          label: field.field_name,
          value: `${response}`,
        };
      });

    const newSection = { title, fields: fields.filter((f) => f !== undefined) };

    return newSection;
  });

  const requestorFullName =
    `${requestor.user_first_name}-${requestor.user_last_name}`.replaceAll(
      ".",
      ""
    );

  const pdfFileName = `${formatDate(
    new Date(request.request_date_created)
  )}-${request.request_form.form_name
    .split(" ")
    .join("-")}-${requestorFullName}`;

  const getDocument = () => {
    switch (request.request_form.form_name) {
      case "Item":
        return (
          <ItemPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "Services":
        return (
          <ServicesPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "Other Expenses":
        return (
          <OtherExpensesPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "PED Equipment":
        return (
          <PEDEquipmentPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "PED Part":
        return (
          <PEDPartPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "PED Item":
        if (requestItems[0].fields[2].value === "Single") {
          return (
            <PEDItemSinglePdfDocumentTableVersion
              requestDetails={requestDetails}
              requestorDetails={requestorDetails}
              requestIDs={requestIDs}
              requestItems={requestItems}
              approverDetails={approverDetails}
            />
          );
        } else if (requestItems[0].fields[2].value === "Bulk") {
          return (
            <PEDItemBulkPdfDocumentTableVersion
              requestDetails={requestDetails}
              requestorDetails={requestorDetails}
              requestIDs={requestIDs}
              requestItems={requestItems}
              approverDetails={approverDetails}
            />
          );
        }
      case "IT Asset":
        return (
          <ITAssetPdfDocumentTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
      case "Liquidation Reimbursement":
        return (
          <LiquidationReimbursementTableVersion
            requestDetails={requestDetails}
            requestorDetails={requestorDetails}
            requestIDs={requestIDs}
            requestItems={requestItems}
            approverDetails={approverDetails}
          />
        );
    }
  };

  const [instance] = usePDF({
    document: (
      <PdfDocument
        requestDetails={requestDetails}
        requestorDetails={requestorDetails}
        requestIDs={requestIDs}
        requestItems={requestItems}
        approverDetails={approverDetails}
      />
    ),
  });

  const [instanceTable] = usePDF({
    document: getDocument(),
  });

  useEffect(() => {
    if (!instance.loading && instanceTable.url && pdfFileName) {
      const link = document.createElement("a");
      link.href = instanceTable.url;
      link.download = `${pdfFileName}-${router.query.type}`;
      document.body.appendChild(link);
      link.click();
      window.close();
    }
  }, [instance.loading, instanceTable.url, pdfFileName, router]);

  return (
    <Flex
      sx={{
        height: "100vh",
      }}
      align="center"
      justify="center"
    >
      <Loader />
    </Flex>
  );
};

export default ExportToPdf;
