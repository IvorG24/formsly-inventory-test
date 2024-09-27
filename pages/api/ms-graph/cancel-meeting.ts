import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (
      !process.env.MS_GRAPH_CLIENT_ID ||
      !process.env.MS_GRAPH_CLIENT_SECRET ||
      !process.env.MS_GRAPH_TENANT_ID
    ) {
      return res.status(405).json({ error: "Missing required credentials" });
    }

    const access_token_response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/ms-graph/create-oauth-token`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const access_token = await access_token_response.json();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/dev@staclara.com.ph/events/${req.body.meetingId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: "Applicant cancelled the meeting." }),
      }
    );

    if (response.ok) {
      return res.status(202).json({ message: "Meeting cancelled." });
    } else {
      throw new Error();
    }
  } catch (e) {
    return res.status(500).json({ error: "Error cancelling meeting" });
  }
}
