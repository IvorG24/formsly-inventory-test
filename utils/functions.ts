/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChartData } from "chart.js";
import moment from "moment";
import dynamic from "next/dynamic";
import { startCase } from "./string";
import { JiraItemUserTableData } from "./types";

// check if a value is empty
export const isEmpty = (value: any) => {
  if (value == null) {
    return true;
  }

  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
};

// check if a valueA is equal to valueB
export const isEqual = (a: any, b: any) => {
  // Check if the types of a and b are the same
  if (typeof a !== typeof b) {
    return false;
  }

  // For primitive types and functions, use strict equality (===)
  if (typeof a !== "object" || a === null) {
    return a === b;
  }

  // For arrays, compare their lengths and elements
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // For objects, compare their keys and values
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
};

export const generateRandomId = () => {
  // Generate a random number and convert it to a hexadecimal string
  const randomId = Math.random().toString(16).slice(2);

  return randomId;
};

export const customMathCeil = (number: number, precision = 0) => {
  const multiplier = 10 ** precision;
  return Math.ceil(number * multiplier) / multiplier;
};

export const addDays = (date: Date, days: number) => {
  date.setDate(date.getDate() + days);
  return date;
};

export const isValidUrl = (urlString: string) => {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};

export const checkIfTimeIsWithinFiveMinutes = (
  timestampString: string,
  currentDateString: string
) => {
  const timestamp = moment(timestampString);
  const currentTime = moment(currentDateString);
  const differenceInMinutes = currentTime.diff(timestamp, "minutes");

  return differenceInMinutes <= 5;
};

export const isStringParsable = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export const safeParse = (str: string) => {
  if (isStringParsable(str)) {
    return JSON.parse(str);
  } else {
    return str;
  }
};

export const mostOccurringElement = (arr: string[]) => {
  const frequencyMap: Record<string, number> = {};
  let maxFrequency = 0;
  let mostOccurringElement = arr[0];

  arr.forEach((element) => {
    frequencyMap[element] = (frequencyMap[element] || 0) + 1;
    if (frequencyMap[element] > maxFrequency) {
      maxFrequency = frequencyMap[element];
      mostOccurringElement = element;
    }
  });

  return mostOccurringElement;
};

export const JoyRideNoSSR = dynamic(() => import("react-joyride"), {
  ssr: false,
});

export const getBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
};

export const fetchNumberFromString = (inputString: string) => {
  const regex = /\d+/g;
  const matches = inputString.match(regex);
  if (matches) {
    return parseInt(matches[0]);
  } else {
    return null;
  }
};

export const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const from = page ? page * limit : 0;
  const to = page ? from + size - 1 : size - 1;
  return { from, to };
};

export const formatJiraItemUserTableData = (
  data: JiraItemUserTableData | null
) => {
  if (!data) return { success: false, data: null, error: "Data not found" };

  const formattedData = {
    jira_item_user_id: data.jira_item_user_id,
    jira_item_user_item_category_id: data.jira_item_user_item_category_id,
    jira_user_account_jira_id:
      data.jira_item_user_account_id?.jira_user_account_jira_id || "",
    jira_user_account_display_name:
      data.jira_item_user_account_id?.jira_user_account_display_name || "",
    jira_user_account_id:
      data.jira_item_user_account_id?.jira_user_account_id || "",
    jira_user_role_id: data.jira_item_user_role_id?.jira_user_role_id || "",
    jira_user_role_label:
      data.jira_item_user_role_id?.jira_user_role_label || "",
  };

  return { success: true, data: formattedData, error: null };
};

export const handleRemoveFocus = () => {
  const focusedElement = document.activeElement;
  if (focusedElement instanceof HTMLElement) {
    focusedElement.blur();
  }
};

export const sendEmailTeamInvite = async ({
  emailList,
  teamName,
  teamId,
}: {
  emailList: string[];
  teamId: string;
  teamName: string;
}) => {
  const subject = `You have been invited to join ${teamName} on Formsly.`;
  try {
    await Promise.all(
      emailList.map((email) =>
        fetch("/api/team-invite/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            subject,
            teamId: teamId,
            teamName: teamName,
          }),
        })
      )
    );
  } catch (e) {}
};

export const calculateInvoiceAmountWithVAT = (amount: number) => {
  return (amount / 1.12) * 0.12;
};
export const formatTimeToLocal = (dateTime: string) => {
  return moment(dateTime).format("hh:mm A");
};

export const isError = (error: unknown): error is Error => {
  return (
    error instanceof Error ||
    (typeof error === "object" && error !== null && "message" in error)
  );
};

export const formatStringToNumber = (numericString: string) => {
  return Number(numericString.replace(/\s/g, ""));
};

export const parseDataForChart = ({
  data,
  labelPropKey,
  valuePropKey,
  datasetLabel,
  colorPalette,
}: {
  data: Array<{ [key: string]: any }>;
  labelPropKey: string;
  valuePropKey: string;
  datasetLabel?: string;
  colorPalette?: string[];
}): ChartData => {
  const aggregatedData: { [key: string]: number } = {};

  // Process each item
  data.forEach((item) => {
    const label = startCase(item[labelPropKey]);
    const value = Number(item[valuePropKey]);

    if (label && !isNaN(value)) {
      if (aggregatedData[label]) {
        aggregatedData[label] += value;
      } else {
        aggregatedData[label] = value;
      }
    }
  });

  const labels = Object.keys(aggregatedData);
  const values = Object.values(aggregatedData);

  const colors =
    colorPalette ||
    labels.map(() => {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return `rgba(${r}, ${g}, ${b}, 0.2)`;
    });

  const chartData: ChartData = {
    labels,
    datasets: [
      {
        label: datasetLabel || "Dataset",
        data: values,
        backgroundColor: colors,
        borderColor: colors.map((color) => color.replace("0.2", "1")),
        borderWidth: 1,
      },
    ],
  };

  return chartData;
};
