import { insertError } from "@/backend/api/post";
import { isError } from "@/utils/functions";
import { createJiraCommentRequestBody } from "@/utils/jira/functions";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseClient = createPagesServerClient({ req, res });

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

    // Check for duplicate ticket
    const duplicateResponse = await fetch(
      `${jiraConfig.api_url}/search?maxResults=1&jql=cf[10010]["requestType"]="${req.body.requestType}"+and+cf[10297]~"${req.body.formslyId}"`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${jiraConfig.user}:${jiraConfig.api_token}`
          ).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const duplicateData = await duplicateResponse.json();

    let jiraTicketId = "";
    let jiraTicketLink = "";

    if (duplicateData.total > 0) {
      const duplicateTicket = duplicateData.issues[0];
      jiraTicketId = duplicateTicket.key;
      jiraTicketLink = duplicateTicket.fields["customfield_10010"]._links.web;
    } else {
      const createTicketResponse = await fetch(
        `https://scic.atlassian.net/rest/servicedeskapi/request`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${jiraConfig.user}:${jiraConfig.api_token}`
            ).toString("base64")}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body.ticketPayload),
        }
      );

      const createTicketData = await createTicketResponse.json();
      jiraTicketId = createTicketData.issueKey;
      jiraTicketLink = createTicketData._links.web;
    }

    if (!jiraTicketId) {
      return res.status(500).json({ error: "Failed to create jira ticket" });
    }

    // Prepare promises for organization, transition, and comments
    const promises = [];

    if (req.body.organizationId) {
      promises.push(
        fetch(`${jiraConfig.api_url}/issue/${jiraTicketId}`, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${jiraConfig.user}:${jiraConfig.api_token}`
            ).toString("base64")}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              customfield_10002: [req.body.organizationId],
            },
          }),
        })
      );
    }

    if (req.body.transitionId) {
      promises.push(
        fetch(
          `https://scic.atlassian.net/rest/api/3/issue/${jiraTicketId}/transitions`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${jiraConfig.user}:${jiraConfig.api_token}`
              ).toString("base64")}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transition: { id: req.body.transitionId },
            }),
          }
        )
      );
    }

    if (req.body.requestCommentList && req.body.requestCommentList.length > 0) {
      const requestBody = await createJiraCommentRequestBody(
        supabaseClient,
        req.body.requestCommentList
      );

      promises.push(
        fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/jira/add-comment?jiraTicketKey=${jiraTicketId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        )
      );
    }

    // Execute all promises concurrently
    await Promise.all(promises);

    return res.status(200).json({ jiraTicketId, jiraTicketLink });
  } catch (e) {
    if (isError(e)) {
      await insertError(supabaseClient, {
        errorTableRow: {
          error_message: e.message,
          error_url: "/api/jira/create-ticket",
          error_function: "onCreateJiraTicket",
        },
      });
    }
    return res.status(500).json({ error: e });
  }
}
