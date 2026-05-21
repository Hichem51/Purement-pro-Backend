"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManagerInvitationEmail = exports.createManagerInvitationEmailText = exports.createManagerInvitationEmailHtml = exports.managerInvitationEmailSubject = void 0;
const escapeHtml = (value) => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
exports.managerInvitationEmailSubject = "Invitation au tableau de bord Purement Pro";
const createManagerInvitationEmailHtml = ({ toName, setupUrl, invitedByName }) => {
    const safeName = escapeHtml(toName);
    const safeSetupUrl = escapeHtml(setupUrl);
    const safeInvitedByName = invitedByName ? escapeHtml(invitedByName) : undefined;
    const inviterText = safeInvitedByName
        ? `${safeInvitedByName} vous a invité à rejoindre le tableau de bord Purement Pro.`
        : "Un administrateur vous a invité à rejoindre le tableau de bord Purement Pro.";
    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${exports.managerInvitationEmailSubject}</title>
  </head>
  <body style="margin:0;background:#eef4f7;color:#132935;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f7;padding:36px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d9e4ea;border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(18,41,53,0.10);">
            <tr>
              <td style="background:#103746;padding:28px 32px;">
                <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1.8px;line-height:1;">
                  PUREMENT PRO
                </div>
                <div style="margin-top:8px;color:#b9d8df;font-size:13px;line-height:1.5;">
                  Tableau de bord
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 28px;">
                <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:#103746;font-weight:800;">
                  Vous avez été invité au tableau de bord Purement Pro
                </h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#273f4a;">
                  Bonjour ${safeName},
                </p>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#273f4a;">
                  ${inviterText}
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#273f4a;">
                  Pour activer votre compte, veuillez créer votre mot de passe en cliquant sur le bouton ci-dessous.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 30px;">
                  <tr>
                    <td style="background:#0f6b7a;border-radius:10px;box-shadow:0 10px 18px rgba(15,107,122,0.22);">
                      <a href="${safeSetupUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:15px 24px;border-radius:10px;">
                        Créer mon mot de passe
                      </a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f1f7f9;border:1px solid #d7e7ec;border-radius:14px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-size:14px;line-height:1.7;color:#3d5662;">
                        Ce lien est temporaire et expirera pour des raisons de sécurité. Si vous n’avez pas demandé cet accès, aucune action n’est requise.
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafcfd;border:1px solid #e1e9ed;border-radius:14px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 8px;font-size:13px;font-weight:700;line-height:1.5;color:#103746;">
                        Le bouton ne fonctionne pas ?
                      </p>
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#5c7079;">
                        Copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;">
                        <a href="${safeSetupUrl}" style="color:#0f6b7a;text-decoration:underline;">${safeSetupUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f5f8fa;border-top:1px solid #e1e9ed;padding:22px 32px;color:#667b85;font-size:13px;line-height:1.7;">
                <p style="margin:0 0 8px;">
                  Si vous n’attendiez pas cette invitation, vous pouvez ignorer ce courriel.
                </p>
                <p style="margin:0;color:#81919a;">
                  Purement Pro · Services professionnels de nettoyage
                </p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
            <tr>
              <td align="center" style="padding:18px 16px 0;color:#7b8d96;font-size:12px;line-height:1.6;">
                Ce message concerne l’accès interne au tableau de bord Purement Pro.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
exports.createManagerInvitationEmailHtml = createManagerInvitationEmailHtml;
const createManagerInvitationEmailText = ({ toName, setupUrl, invitedByName }) => {
    const inviterLine = invitedByName
        ? `${invitedByName} vous a invité à rejoindre le tableau de bord Purement Pro.`
        : "Un administrateur vous a invité à rejoindre le tableau de bord Purement Pro.";
    return [
        "PUREMENT PRO",
        "",
        "Vous avez été invité au tableau de bord Purement Pro",
        "",
        `Bonjour ${toName},`,
        "",
        inviterLine,
        "",
        "Pour activer votre compte, ouvrez ce lien et créez votre mot de passe :",
        "",
        setupUrl,
        "",
        "Ce lien est temporaire et expirera pour des raisons de sécurité.",
        "",
        "Si vous n’attendiez pas cette invitation, vous pouvez ignorer ce courriel."
    ].join("\n");
};
exports.createManagerInvitationEmailText = createManagerInvitationEmailText;
const createManagerInvitationEmail = (input) => ({
    subject: exports.managerInvitationEmailSubject,
    htmlContent: (0, exports.createManagerInvitationEmailHtml)(input),
    textContent: (0, exports.createManagerInvitationEmailText)(input)
});
exports.createManagerInvitationEmail = createManagerInvitationEmail;
