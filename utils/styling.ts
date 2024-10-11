import { createStyles } from "@mantine/core";
import {
  documentExtensions,
  imageExtensions,
  mediaExtensions,
  pdfExtensions,
} from "./constant";

export const defaultMantineColorList = [
  "dark",
  "gray",
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "green",
  "lime",
  "yellow",
  "orange",
  "teal",
];

export const defaultMantineColorHexList = [
  "#25262B",
  "#868E96",
  "#FA5252",
  "#E64980",
  "#BE4BDB",
  "#7950F2",
  "#4C6EF5",
  "#228BE6",
  "#15AABF",
  "#12B886",
  "#40C057",
  "#82C91E",
  "#FAB005",
  "#FD7E14",
];

export const getAvatarColor = (number: number) => {
  const randomColor =
    defaultMantineColorList[number % defaultMantineColorList.length];
  return randomColor;
};

export const getStatusToColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "blue";
    case "approved":
    case "qualified":
    case "accepted":
      return "green";
    case "rejected":
    case "not qualified":
      return "red";
    case "canceled":
      return "gray";
    case "waiting for schedule":
    case "waiting for offer":
      return "orange";
    case "unresponsive":
      return "gray";
    case "cancelled":
      return "dark";
    case "missed":
      return "grape";
    case "not responsive":
      return "gray";
    case "for pooling":
      return "yellow";
    default:
      return "";
  }
};
export const mobileNumberFormatter = (value: string | undefined) => {
  const cleanedNumber = value ? value.replace(/\D/g, "") : "";

  if (cleanedNumber.length === 10) {
    const formattedNumber = cleanedNumber.replace(
      /(\d{3})(\d{3})(\d{4})/,
      "$1 $2 $3"
    );
    return formattedNumber;
  } else if (cleanedNumber.length === 0) {
    return "";
  } else {
    return "Invalid phone number";
  }
};

export const getStatusToColorForCharts = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "#228BE6";
    case "approved":
      return "#40C057";
    case "rejected":
      return "#FA5252";
    case "cancelled":
      return "#868E96";
    case "under review":
      return "#228BE6";
    case "closed":
      return "#40C057";
    case "qualified":
      return "#40C057";
    case "not qualified":
      return "#fa5252";
    case "not responsive":
      return "gray";
    case "pending":
      return "blue";
    case "waiting for schedule":
      return "#fd7e14";
    case "waiting for offer":
      return "#fd7e14";
    case "rejected":
      return "red";
    case "cancelled":
      return "dark";
    case "incorrect":
      return "#FA5252";
    case "for pooling":
      return "#fab005";
    case "accepted":
      return "#40C057";
  }
};

export const shortenFileName = (fileName: string, maxLength: number) => {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  const extension = fileName.split(".").pop();
  const fileNameWithoutExtension = fileName.substring(
    0,
    fileName.length - Number(extension?.length || 0) - 1
  );

  const maxCharsForFileName = maxLength - Number(extension?.length || 0) - 2; // Account for the ".." and extension
  const shortenedFileName = fileNameWithoutExtension.substring(
    0,
    maxCharsForFileName
  );

  return shortenedFileName + ".." + extension;
};

export const getFileType = (filename: string) => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  if (imageExtensions.includes(extension)) {
    return "IMG";
  } else if (pdfExtensions.includes(extension)) {
    return "PDF";
  } else if (documentExtensions.includes(extension)) {
    return "DOC";
  } else if (mediaExtensions.includes(extension)) {
    return "MED";
  } else {
    return "N/A";
  }
};

export const getFileTypeColor = (filename: string) => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  if (imageExtensions.includes(extension)) {
    return "red";
  } else if (pdfExtensions.includes(extension)) {
    return "cyan";
  } else if (documentExtensions.includes(extension)) {
    return "grey";
  } else if (mediaExtensions.includes(extension)) {
    return "yellow"; // All media files are categorized as 'MED'
  } else {
    return "dark";
  }
};

export const getJiraTicketStatusColor = (status: string) => {
  if (status.includes("waiting for")) {
    return "blue";
  }
  switch (status.toLowerCase()) {
    case "in progress":
      return "cyan";
    case "done":
      return "green";
    case "declined":
      return "red";
    case "canceled":
      return "gray";
    default:
      return "dark";
  }
};

export const getPaymayaStatusColor = (status: string) => {
  switch (status) {
    case "PENDING_TOKEN":
      return "blue";
    case "PENDING_PAYMENT":
      return "blue";
    case "PAYMENT_SUCCESS":
      return "green";
    case "PAYMENT_FAILED":
      return "red";
    case "PAYMENT_EXPIRED":
      return "red";
    case "PAYMENT_CANCELLED":
      return "gray";
  }
};

export const sssIdNumberFormatter = (value: string | undefined) => {
  const cleanedNumber = value ? value.replace(/\D/g, "") : "";

  if (cleanedNumber.length === 10) {
    const formattedNumber = cleanedNumber.replace(
      /(\d{2})(\d{7})(\d{1})/,
      "$1-$2-$3"
    );
    return formattedNumber;
  } else if (cleanedNumber.length === 0) {
    return "";
  } else {
    return "Invalid number";
  }
};

export const philHealthIdNumberFormatter = (value: string | undefined) => {
  const cleanedNumber = value ? value.replace(/\D/g, "") : "";

  if (cleanedNumber.length === 12) {
    const formattedNumber = cleanedNumber.replace(
      /(\d{2})(\d{9})(\d{1})/,
      "$1-$2-$3"
    );
    return formattedNumber;
  } else if (cleanedNumber.length === 0) {
    return "";
  } else {
    return "Invalid number";
  }
};

export const pagIbigNumberFormatter = (value: string | undefined) => {
  const cleanedNumber = value ? value.replace(/\D/g, "") : "";

  if (cleanedNumber.length === 12) {
    const formattedNumber = cleanedNumber.replace(
      /(\d{4})(\d{4})(\d{4})/,
      "$1-$2-$3"
    );
    return formattedNumber;
  } else if (cleanedNumber.length === 0) {
    return "";
  } else {
    return "Invalid Pag IBIG number";
  }
};

export const tinNumberFormatter = (value: string | undefined) => {
  const cleanedNumber = value ? value.replace(/\D/g, "") : "";

  if (cleanedNumber.length === 9) {
    const formattedNumber = cleanedNumber.replace(
      /(\d{3})(\d{3})(\d{3})/,
      "$1-$2-$3"
    );
    return formattedNumber;
  } else if (cleanedNumber.length === 0) {
    return "";
  } else {
    return "Invalid TIN number";
  }
};

export const useStyles = createStyles((theme) => ({
  parentTable: {
    "&& th": {
      color: "white",
      fontSize: 14,
      fontWeight: 900,
      backgroundColor: theme.colors.blue[5],
      transition: "background-color 0.3s ease",
      padding: "10px",
      "& svg": {
        fill: "white",
        color: "white",
      },
      "&:hover": {
        backgroundColor: "#0042ab !important",
        color: "white !important",
        "& svg": {
          fill: "white",
          color: "white",
        },
      },
    },
    "&& td": {
      borderBottom: "1px solid #CDD1D6",
      minWidth: 150,
      width: "100%",
      padding: "10px",
    },
  },
}));

export const getHRAnalyticsStatusToColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "#339af0";
    case "approved":
    case "qualified":
    case "accepted":
      return "#51cf66";
    case "rejected":
    case "not qualified":
      return "#ff6b6b";
    case "cancelled":
      return "#2C2E33";
    case "not responsive":
      return "#adb5bd";
    case "waiting for schedule":
    case "waiting for offer":
      return "#ff922b";
    case "for pooling":
      return "#fcc419";
    case "missed":
      return "#cc5de8";
  }
};
