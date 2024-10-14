import { notifications } from "@mantine/notifications";
import moment from "moment";

export const isValidTeamName = (name: string): boolean => {
  const allowedCharsRegex = /^[a-zA-Z0-9 ,;\/?:@&=+$\-_.!]*$/;

  if (name.length < 1 || name.length > 50) {
    return false;
  }

  if (!allowedCharsRegex.test(name)) {
    return false;
  }

  return true;
};

export const requestPath = (requestId: string, teamName: string) => {
  return `http://${window.location.host}/${formatTeamNameToUrlKey(
    teamName ?? ""
  )}/requests/${requestId}`;
};

export const publicRequestPath = (requestId: string) => {
  return `http://${window.location.host}/user/requests/${requestId}`;
};

export const regExp = /\(([^)]+)\)/;

export const addCommaToNumber = (number: number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const startCase = (inputString: string) => {
  return inputString
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatTime = (time: string) => {
  const parsedTime = parseJSONIfValid(time);
  if (!parsedTime) return parsedTime;
  const timeParts = parsedTime.split(":");
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const parseJSONIfValid = (jsonString: string) => {
  try {
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
  } catch (e) {
    return jsonString;
  }
};

export const convertTimestampToDate = (input: string | Date) => {
  if (input instanceof Date) return input;
  const parsedInput = parseJSONIfValid(input);
  if (!parsedInput) return undefined;
  return new Date(parsedInput);
};

export const toTitleCase = (input: string) => {
  return input.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
    return match.toUpperCase();
  });
};

export const formatTeamNameToUrlKey = (teamName: string) => {
  return teamName.replace(/\s+/g, "-").toLowerCase();
};

export const isUUID = (str: string | string[] | undefined) => {
  if (str === undefined) return false;
  if (Array.isArray(str)) return false;
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidPattern.test(str);
};

export const getInitials = (fullname: string) => {
  const words = fullname
    .trim()
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .split(" ");
  const initials = words.map((word) => word[0].toUpperCase()).join("");
  return initials;
};

export const getMemoReferencePrefix = (teamName: string) => {
  return `MEMO-${teamName.toUpperCase().split(" ").join("")}-${moment().format(
    "YYYY"
  )}`;
};

export const addAmpersandBetweenWords = (searchString: string) => {
  const sanitizedString = searchString.replace(/[^\w\s]/gi, "");

  const words = sanitizedString.split(" ");

  if (words.length > 1) {
    const result = words.join(" & ");
    return result;
  }

  return sanitizedString;
};

export const convertDateNowToTimestampz = () => {
  const currentTimestamp = new Date(Date.now());
  const supabaseTimestampz = currentTimestamp.toISOString();
  return supabaseTimestampz;
};

export const removeMultipleSpaces = (text: string) => {
  return text.replace(/\s+/g, " ");
};

export const trimObjectProperties = (obj: { [x: string]: string }) => {
  const trimmedObject: { [x: string]: string } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === "string") {
      trimmedObject[key] = obj[key].trim();
    }
  }
  return trimmedObject;
};

export const escapeQuotes = (input: string): string => {
  const escapedString = input.replace(/'/g, "''");

  return escapedString;
};

type AnyObject = {
  [key: string]: unknown;
};

export const jsonToCsv = (jsonString: string): string => {
  try {
    const jsonArray: AnyObject[] = JSON.parse(jsonString);

    if (!jsonArray.length) {
      throw new Error("Invalid JSON array");
    }

    const keys = Object.keys(jsonArray[0]);

    const csvContent = `${keys.join(", ")}\n${jsonArray
      .map((obj) => keys.map((key) => obj[key]).join(", "))
      .join("\n")}`;

    return csvContent;
  } catch (e) {
    notifications.show({
      message: "Something went wrong. Please try again later.",
      color: "red",
    });
    return "";
  }
};

export const formatTimeString = (inputString: string): string => {
  const [hours, minutes, seconds] = inputString.split(":");
  const formattedTime = `${hours}h:${minutes}m:${Math.round(Number(seconds))}s`;
  return formattedTime;
};

export const formatCSICode = (inputString: string) => {
  let numericString = inputString.replace(/[^\d ]/g, "");
  numericString = numericString.substring(0, 8);
  return numericString.replace(/(\d{2})(?=\d)/g, "$1 ");
};

export const pesoFormatter = (value: string | undefined) =>
  !Number.isNaN(parseFloat(`${value}`))
    ? `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "₱ ";

export const capitalizeEachWord = (value: string) => {
  const words = value
    .trim()
    .replace(/\s\s+/g, " ")
    .toLocaleLowerCase()
    .split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] =
      words[i][0].toUpperCase() + words[i].substring(1, words[i].length);
  }
  return words.join(" ");
};

export const escapeQuotesForObject = (input: Record<string, string>) => {
  const escapedObj: Record<string, string> = {};
  for (const key in input) {
    if (input.hasOwnProperty(key)) {
      const value = input[key];
      escapedObj[key] = typeof value === "string" ? escapeQuotes(value) : value;
    }
  }
  return escapedObj;
};

export const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const isOneWordAllCaps = (string: string) => {
  return /^[A-Z]+$/.test(string);
};

export const getFileType = (string: string) => {
  if (isOneWordAllCaps(string)) return string.toLocaleLowerCase();

  return string
    .trim()
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .split(" ")
    .map((word) => word[0].toLowerCase())
    .join("");
};
