"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendManagerInvitationEmail = exports.sendBrevoTransactionalEmail = void 0;
const env_1 = require("../../config/env");
const api_error_1 = require("../../utils/api-error");
const manager_invitation_email_1 = require("./templates/manager-invitation-email");
const brevoSendEmailEndpoint = "https://api.brevo.com/v3/smtp/email";
const getMailConfig = () => {
    if (!env_1.env.brevoApiKey || !env_1.env.mailFromEmail) {
        throw new api_error_1.ApiError(500, "Email service is not configured");
    }
    return {
        apiKey: env_1.env.brevoApiKey,
        fromEmail: env_1.env.mailFromEmail,
        fromName: env_1.env.mailFromName
    };
};
const parseBrevoResponse = async (response) => {
    const responseText = await response.text();
    if (!responseText) {
        return {};
    }
    try {
        const parsed = JSON.parse(responseText);
        return {
            bodySummary: JSON.stringify({
                code: parsed.code,
                message: parsed.message
            })
        };
    }
    catch {
        return {
            bodySummary: responseText.slice(0, 500)
        };
    }
};
const sendBrevoTransactionalEmail = async (payload, context) => {
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
        throw new api_error_1.ApiError(500, "Email could not be sent");
    }
};
exports.sendBrevoTransactionalEmail = sendBrevoTransactionalEmail;
const sendManagerInvitationEmail = async ({ toEmail, toName, setupUrl, invitedByName }, context = { action: "invite" }) => {
    const { fromEmail, fromName } = getMailConfig();
    const email = (0, manager_invitation_email_1.createManagerInvitationEmail)({ toName, setupUrl, invitedByName });
    return (0, exports.sendBrevoTransactionalEmail)({
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
    }, context);
};
exports.sendManagerInvitationEmail = sendManagerInvitationEmail;
