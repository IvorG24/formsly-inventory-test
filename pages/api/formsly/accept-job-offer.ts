import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const data = req.body;

    const requestIdListResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/accept_job_offer_fetch_request_id_list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Authorization: data.token,
        },
        body: JSON.stringify({
          input_data: {
            requestReferenceId: data.requestReferenceId,
            email: data.email,
          },
        }),
      }
    );
    if (!requestIdListResponse.ok) {
      throw new Error(await requestIdListResponse.text());
    }
    const requestIdList = await requestIdListResponse.json();

    const updateStatusResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/accept_job_offer_update_status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Authorization: data.token,
        },
        body: JSON.stringify({
          input_data: {
            requestIdList,
          },
        }),
      }
    );
    if (!updateStatusResponse.ok) {
      throw new Error(await updateStatusResponse.text());
    }

    const jobOfferListResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/accept_job_offer_fetch_job_offer_list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Authorization: data.token,
        },
        body: JSON.stringify({
          input_data: {
            requestIdList,
            requestReferenceId: data.requestReferenceId,
          },
        }),
      }
    );
    if (!jobOfferListResponse.ok) {
      throw new Error(await jobOfferListResponse.text());
    }
    const jobOfferList = await jobOfferListResponse.json();

    const updateJobOfferResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/accept_job_offer_update_job_offer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Authorization: data.token,
        },
        body: JSON.stringify({
          input_data: {
            jobOfferList,
          },
        }),
      }
    );
    if (!updateJobOfferResponse.ok) {
      throw new Error(await updateJobOfferResponse.text());
    }

    return res.status(200).send("Success");
  } catch (e) {
    return res.status(500).json({ error: e });
  }
}
