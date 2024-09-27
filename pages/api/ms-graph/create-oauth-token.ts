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

    const params = {
      grant_type: "client_credentials",
      client_id: process.env.MS_GRAPH_CLIENT_ID,
      client_secret: process.env.MS_GRAPH_CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
    };

    const response = await fetch(
      `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params),
      }
    );

    const data = await response.json();

    return res.status(200).json(data.access_token);
  } catch (e) {
    return res.status(500).json({ error: "Error creating OAuth token" });
  }
}
