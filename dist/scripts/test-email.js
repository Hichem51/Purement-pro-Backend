"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../config/env");
const mail_service_1 = require("../services/mail/mail.service");
const isValidEnoughEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
const run = async () => {
    if (!env_1.env.testEmail) {
        throw new Error("TEST_EMAIL is required");
    }
    if (!isValidEnoughEmail(env_1.env.testEmail)) {
        throw new Error("TEST_EMAIL must be a valid email address");
    }
    const result = await (0, mail_service_1.sendTestEmail)(env_1.env.testEmail);
    console.log("Test email request completed", {
        toEmail: env_1.env.testEmail,
        status: result.status,
        messageId: result.messageId
    });
};
run().catch((error) => {
    console.error("Failed to send test email");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
