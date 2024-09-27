import EmailNotificationTemplate, {
  EmailNotificationTemplateProps,
} from "@/components/Resend/EmailNotificationTemplate";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(405).json({ error: "Jwt secret key is undefined" });
    }

    const supabaseClient = createPagesServerClient({ req, res });
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session)
      return res.status(401).json({
        error: "not_authenticated",
        description:
          "The user does not have an active session or is not authenticated",
      });

    const { to, subject, message, greetingPhrase, closingPhrase, signature } =
      req.body;

    const emailProps: EmailNotificationTemplateProps = {
      message,
      greetingPhrase,
      closingPhrase,
      signature,
    };

    const domain =
      process.env.NODE_ENV === "production"
        ? "<help@formsly.io>"
        : "<help@jctest.shop>";

    const { data, error } = await resend.emails.send({
      from: `Formsly Team ${domain}`,
      to: to,
      subject: subject,
      react: EmailNotificationTemplate(emailProps),
    });
    if (error) {
      console.error(error);
      return res.status(400).json(error);
    }

    return res.status(200).json({ message: "Email sent successfully", data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error sending email" });
  }
}
