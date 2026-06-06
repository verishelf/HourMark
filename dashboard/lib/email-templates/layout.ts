export type EmailBenefit = {
  title: string;
  body: string;
};

export type EmailStat = {
  value: string;
  label: string;
  gold?: boolean;
};

export type EmailCta = {
  text: string;
  href: string;
};

export type CrownlyEmailContent = {
  pageTitle: string;
  preheader: string;
  headerTagline: string;
  headline: string;
  intro: string;
  stats?: EmailStat[];
  sectionLabel?: string;
  sectionTitle?: string;
  benefits?: EmailBenefit[];
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaBody?: string;
  primaryCta: EmailCta;
  secondaryCta?: EmailCta;
  footnote?: string;
};

const FONT_SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const FONT_SERIF = "Georgia,'Times New Roman',serif";

function benefitRows(benefits: EmailBenefit[]): string {
  return benefits
    .map(
      (benefit, index) => `
          <tr>
            <td style="padding:0 0 ${index === benefits.length - 1 ? "40px" : "1px"} 0;background-color:#1a1a1a;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#000000;">
                <tr>
                  <td style="padding:24px;font-family:${FONT_SANS};">
                    <p style="margin:0 0 6px 0;font-size:15px;font-weight:600;color:#ffffff;">${benefit.title}</p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">${benefit.body}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    )
    .join("");
}

function statRow(stats: EmailStat[]): string {
  const cells = stats
    .map(
      (stat) => `
                  <td width="${Math.floor(100 / stats.length)}%" align="center" style="padding:16px 8px;font-family:${FONT_SANS};">
                    <p style="margin:0;font-size:28px;font-weight:300;color:${stat.gold ? "#C9A962" : "#ffffff"};">${stat.value}</p>
                    <p style="margin:6px 0 0 0;font-size:9px;letter-spacing:0.15em;color:#71717a;text-transform:uppercase;">${stat.label}</p>
                  </td>`
    )
    .join("");

  return `
          <tr>
            <td style="padding:0 0 40px 0;border-bottom:1px solid #1a1a1a;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>${cells}
                </tr>
              </table>
            </td>
          </tr>`;
}

function ctaButton(cta: EmailCta, variant: "primary" | "secondary"): string {
  if (variant === "primary") {
    return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td align="center" bgcolor="#C9A962" style="background-color:#C9A962;border-radius:0;">
                    <a href="${cta.href}" target="_blank" style="display:inline-block;padding:16px 32px;font-size:10px;font-weight:600;letter-spacing:0.2em;color:#000000;text-decoration:none;text-transform:uppercase;">
                      ${cta.text}
                    </a>
                  </td>
                </tr>
              </table>`;
  }

  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="border:1px solid #ffffff;">
                    <a href="${cta.href}" target="_blank" style="display:inline-block;padding:16px 32px;font-size:10px;font-weight:600;letter-spacing:0.2em;color:#ffffff;text-decoration:none;text-transform:uppercase;">
                      ${cta.text}
                    </a>
                  </td>
                </tr>
              </table>`;
}

export function buildCrownlyEmail(content: CrownlyEmailContent): string {
  const benefitsBlock =
    content.benefits && content.benefits.length > 0
      ? `
          ${
            content.sectionLabel || content.sectionTitle
              ? `
          <tr>
            <td style="padding:40px 0 24px 0;font-family:${FONT_SANS};">
              ${
                content.sectionLabel
                  ? `<p style="margin:0 0 8px 0;font-size:10px;font-weight:500;letter-spacing:0.25em;color:#C9A962;text-transform:uppercase;">${content.sectionLabel}</p>`
                  : ""
              }
              ${
                content.sectionTitle
                  ? `<h2 style="margin:0;font-family:${FONT_SERIF};font-size:24px;font-weight:400;color:#ffffff;">${content.sectionTitle}</h2>`
                  : ""
              }
            </td>
          </tr>`
              : ""
          }
          ${benefitRows(content.benefits)}`
      : "";

  const statsBlock = content.stats?.length ? statRow(content.stats) : "";

  const ctaBlock =
    content.ctaTitle || content.primaryCta
      ? `
          <tr>
            <td style="padding:40px 32px;background-color:#2a2a2a;border:1px solid #1a1a1a;text-align:center;font-family:${FONT_SANS};">
              ${
                content.ctaEyebrow
                  ? `<p style="margin:0 0 8px 0;font-size:10px;font-weight:500;letter-spacing:0.25em;color:#C9A962;text-transform:uppercase;">${content.ctaEyebrow}</p>`
                  : ""
              }
              ${
                content.ctaTitle
                  ? `<h2 style="margin:0 0 16px 0;font-family:${FONT_SERIF};font-size:28px;font-weight:400;color:#ffffff;">${content.ctaTitle}</h2>`
                  : ""
              }
              ${
                content.ctaBody
                  ? `<p style="margin:0 auto 28px auto;max-width:420px;font-size:14px;line-height:1.7;color:#d4d4d8;">${content.ctaBody}</p>`
                  : ""
              }
              ${ctaButton(content.primaryCta, "primary")}
              ${content.secondaryCta ? ctaButton(content.secondaryCta, "secondary") : ""}
              ${
                content.footnote
                  ? `<p style="margin:24px 0 0 0;font-size:11px;color:#71717a;">${content.footnote}</p>`
                  : ""
              }
            </td>
          </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${content.pageTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#000000;">
    ${content.preheader}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <tr>
            <td align="center" bgcolor="#2a2a2a" style="background-color:#2a2a2a;padding:36px 32px;border-bottom:3px solid #C9A962;">
              <p style="margin:0;font-family:${FONT_SERIF};font-size:32px;font-weight:400;letter-spacing:0.35em;color:#C9A962;text-transform:uppercase;">
                Crownly
              </p>
              <p style="margin:12px 0 0 0;font-family:${FONT_SANS};font-size:11px;font-weight:500;letter-spacing:0.28em;color:#ffffff;text-transform:uppercase;">
                Luxury Watch Marketplace
              </p>
              <p style="margin:14px 0 0 0;font-family:${FONT_SANS};font-size:10px;font-weight:400;letter-spacing:0.18em;color:#d4d4d8;text-transform:uppercase;">
                ${content.headerTagline}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:48px 0 32px 0;font-family:${FONT_SANS};color:#ffffff;">
              <h1 style="margin:0 0 20px 0;font-family:${FONT_SERIF};font-size:36px;font-weight:400;line-height:1.15;color:#ffffff;">
                ${content.headline}
              </h1>
              <p style="margin:0;font-size:16px;line-height:1.7;color:#a1a1aa;">
                ${content.intro}
              </p>
            </td>
          </tr>

          ${statsBlock}
          ${benefitsBlock}
          ${ctaBlock}

          <tr>
            <td style="padding:40px 0 0 0;text-align:center;font-family:${FONT_SANS};">
              <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#71717a;">
                Questions? Reply to this email or contact us at
                <a href="mailto:hello@crownly.art" style="color:#C9A962;text-decoration:underline;">hello@crownly.art</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.6;color:#52525b;">
                Crownly Inc. · <a href="https://crownly.art" style="color:#71717a;text-decoration:none;">crownly.art</a>
                · <a href="https://crownly.art/privacy" style="color:#71717a;text-decoration:none;">Privacy</a>
                · <a href="https://crownly.art/terms" style="color:#71717a;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
