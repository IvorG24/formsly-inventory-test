import { formatStringToNumber } from "@/utils/functions";
import { startCase } from "@/utils/string";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const jiraConfig = {
      user: process.env.JIRA_USER,
      api_token: process.env.JIRA_API_TOKEN,
      api_url: process.env.JIRA_API_URL,
    };

    if (!jiraConfig.user || !jiraConfig.api_token || !jiraConfig.api_url) {
      return res.status(405).json({ error: "Jira env variables undefined" });
    }

    let jiraTicketId = "";
    let jiraTicketLink = "";

    const {
      applicantName,
      applicantPosition,
      positionType,
      sssID,
      contactNumber,
      emailAddress,
      candidateSource,
      employmentStatus,
      isExperienced,
    } = req.body;

    const parsedPositionType =
      positionType === "MANAGERIAL" ? "Manager" : startCase(positionType);

    const ticketPayload = {
      fields: {
        project: {
          key: "REC",
        },
        issuetype: {
          id: "10050",
        },
        summary: applicantName,
        customfield_10070: applicantPosition,
        customfield_11481: {
          value: parsedPositionType,
        },
        customfield_10442: formatStringToNumber(sssID),
        customfield_10120: formatStringToNumber(contactNumber),
        customfield_10121: emailAddress,
        customfield_11519: {
          value: candidateSource,
        },
        // candidate priority
        customfield_11521: {
          value: employmentStatus,
          child: {
            value: isExperienced ? "Experienced" : "Inexperienced",
          },
        },
      },
    };

    const createTicketResponse = await fetch(`${jiraConfig.api_url}/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${jiraConfig.user}:${jiraConfig.api_token}`
        ).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketPayload),
    });

    const createTicketData = await createTicketResponse.json();
    jiraTicketId = createTicketData.key;
    jiraTicketLink = `https://scic.atlassian.net/jira/core/projects/REC/board?selectedIssue=${createTicketData.key}`; // link is hardcoded because the issue does not return a user facing web link unlike the other form tickets

    return res.status(200).json({ jiraTicketId, jiraTicketLink });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
}
