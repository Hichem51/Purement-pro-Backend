import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import {
  createManagerInvitationEmail
} from "./templates/manager-invitation-email";

export interface BrevoSendSmtpEmailPayload {
  sender: {
    email: string;
    name: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface BrevoSendContext {
  action: "invite" | "resend";
}

export interface SendManagerInvitationEmailInput {
  toEmail: string;
  toName: string;
  setupUrl: string;
  invitedByName?: string;
}

interface BrevoResponseSummary {
  bodySummary?: string;
}

const brevoSendEmailEndpoint = "https://api.brevo.com/v3/smtp/email";

const getMailConfig = (): { apiKey: string; fromEmail: string; fromName: string } => {
  if (!env.brevoApiKey || !env.mailFromEmail) {
    throw new ApiError(500, "Email service is not configured");
  }

  return {
    apiKey: env.brevoApiKey,
    fromEmail: env.mailFromEmail,
    fromName: env.mailFromName
  };
};

const parseBrevoResponse = async (response: Response): Promise<BrevoResponseSummary> => {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    const parsed = JSON.parse(responseText) as {
      message?: string;
      code?: string;
    };

    return {
      bodySummary: JSON.stringify({
        code: parsed.code,
        message: parsed.message
      })
    };
  } catch {
    return {
      bodySummary: responseText.slice(0, 500)
    };
  }
};

export const sendBrevoTransactionalEmail = async (
  payload: BrevoSendSmtpEmailPayload,
  context: BrevoSendContext
): Promise<void> => {
  const { apiKey } = getMailConfig();

  const response = await fetch(brevoSendEmailEndpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const summary = await parseBrevoResponse(response);

    console.error("Brevo email send failed", {
      action: context.action,
      toEmail: payload.to[0]?.email,
      fromEmail: payload.sender.email,
      status: response.status,
      statusText: response.statusText,
      response: summary.bodySummary
    });

    throw new ApiError(500, "Email could not be sent");
  }
};

export const sendManagerInvitationEmail = async (
  {
    toEmail,
    toName,
    setupUrl,
    invitedByName
  }: SendManagerInvitationEmailInput,
  context: BrevoSendContext = { action: "invite" }
): Promise<void> => {
  const { fromEmail, fromName } = getMailConfig();
  const email = createManagerInvitationEmail({ toName, setupUrl, invitedByName });

  return sendBrevoTransactionalEmail(
    {
      sender: {
        email: fromEmail,
        name: fromName
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent
    },
    context
  );
};
