/**
 * Wspólny layout i klocki HTML dla wszystkich maili STAPLERO.
 *
 * Styl jest spójny ze stroną: biały nagłówek z logo, czarny pas z nagłówkiem wersalikami
 * (Barlow Condensed, z bezpiecznym fallbackiem), pomarańczowy akcent (#F97706), prostokątne przyciski
 * i czarna stopka z pomarańczową linią. Layout jest oparty na tabelach z inline CSS,
 * bo Outlook i Gmail nie obsługują flexboxa ani SVG. Maksymalna szerokość to 720 px
 * (wcześniej 600 px), a na telefonach wszystko zwęża się do 100%.
 */

export const escapeHtml = (value: string): string =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const C = {
    orange: "#F97706",
    ink: "#111111",
    body: "#39393b",
    muted: "#707072",
    hairline: "#e5e5e5",
    cloud: "#f5f5f5",
    white: "#ffffff",
    cream: "#fff7ed",
};

const DISPLAY_FONT = "'Barlow Condensed','Arial Narrow','Helvetica Neue Condensed',Arial,sans-serif";
const BODY_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export const MAX_WIDTH = 720;

// ─── Klocki ────────────────────────────────────────────────────────────────────

export const p = (html: string, opts: { muted?: boolean; small?: boolean } = {}): string =>
    `<p style="margin:0 0 16px;font-family:${BODY_FONT};font-size:${opts.small ? 14 : 16}px;line-height:1.7;color:${opts.muted ? C.muted : C.body};">${html}</p>`;

export const strong = (html: string): string => `<strong style="color:${C.ink};">${html}</strong>`;

export const h2 = (text: string): string =>
    `<h2 style="margin:32px 0 12px;font-family:${DISPLAY_FONT};font-size:28px;line-height:1.05;font-weight:800;letter-spacing:.3px;text-transform:uppercase;color:${C.ink};">${text}</h2>`;

/** Mała etykieta sekcji z pomarańczową kreską i linią */
export const sectionLabel = (text: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 20px;">
  <tr>
    <td style="white-space:nowrap;padding-right:14px;font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.orange};">${text}</td>
    <td width="100%" style="border-bottom:1px solid ${C.hairline};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;

/** Prostokątny przycisk (bulletproof: działa w Outlooku) */
export const button = (href: string, label: string, kind: "primary" | "dark" | "outline" = "primary", fullWidth = false): string => {
    const styles = {
        primary: { bg: C.orange, color: C.ink, border: C.orange },
        dark: { bg: C.ink, color: C.white, border: C.ink },
        outline: { bg: C.white, color: C.ink, border: C.ink },
    }[kind];
    return `
<table role="presentation" cellpadding="0" cellspacing="0" ${fullWidth ? 'width="100%"' : ""} style="margin:8px 0 8px;">
  <tr>
    <td align="center" bgcolor="${styles.bg}" style="background:${styles.bg};border:2px solid ${styles.border};border-radius:4px;">
      <a href="${href}" target="_blank" style="display:block;padding:15px 34px;font-family:${BODY_FONT};font-size:16px;font-weight:700;line-height:1.2;color:${styles.color};text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
};

/** Tabela "etykieta / wartość" z cienkimi liniami */
export const infoTable = (rows: Array<[string, string]>, labelWidth = 190): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-top:1px solid ${C.hairline};">
  ${rows.map(([label, value]) => `
  <tr>
    <td width="${labelWidth}" valign="top" style="padding:14px 16px 14px 0;border-bottom:1px solid ${C.hairline};font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">${label}</td>
    <td valign="top" style="padding:14px 0;border-bottom:1px solid ${C.hairline};font-family:${BODY_FONT};font-size:16px;font-weight:600;color:${C.ink};">${value}</td>
  </tr>`).join("")}
</table>`;

/** Wyróżniony blok (lewa pomarańczowa krawędź) */
export const callout = (html: string, tone: "orange" | "gray" | "dark" = "orange"): string => {
    const t = {
        orange: { bg: C.cream, border: C.orange, color: C.body },
        gray: { bg: C.cloud, border: C.ink, color: C.body },
        dark: { bg: C.ink, border: C.orange, color: "#e5e5e5" },
    }[tone];
    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
  <tr>
    <td style="background:${t.bg};border-left:4px solid ${t.border};padding:18px 22px;font-family:${BODY_FONT};font-size:15px;line-height:1.7;color:${t.color};">${html}</td>
  </tr>
</table>`;
};

/** Lista z małymi pomarańczowymi kwadratami */
export const bullets = (items: string[]): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
  ${items.map((item) => `
  <tr>
    <td width="24" valign="top" style="padding:9px 0;border-bottom:1px solid ${C.cloud};font-size:10px;line-height:24px;color:${C.orange};">&#9632;</td>
    <td valign="top" style="padding:9px 0;border-bottom:1px solid ${C.cloud};font-family:${BODY_FONT};font-size:15px;line-height:1.55;color:${C.body};">${item}</td>
  </tr>`).join("")}
</table>`;

/** Dwie równe kolumny, na telefonie jedna pod drugą */
export const twoColumns = (left: string, right: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td class="stack" width="50%" valign="top" style="padding-right:8px;">${left}</td>
    <td class="stack" width="50%" valign="top" style="padding-left:8px;">${right}</td>
  </tr>
</table>`;

/** Kafel z etykietą, tytułem i wartością (np. dzień szkolenia) */
export const tile = (opts: { label: string; title: string; value: string; note?: string; accent?: "orange" | "ink" }): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.hairline};border-top:4px solid ${opts.accent === "ink" ? C.ink : C.orange};margin-bottom:8px;">
  <tr>
    <td style="padding:20px 22px;">
      <div style="font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:8px;">${opts.label}</div>
      <div style="font-family:${DISPLAY_FONT};font-size:26px;line-height:1.05;font-weight:800;text-transform:uppercase;color:${C.ink};margin-bottom:10px;">${opts.title}</div>
      <div style="font-family:${BODY_FONT};font-size:16px;font-weight:600;color:${C.ink};line-height:1.4;">${opts.value}</div>
      ${opts.note ? `<div style="font-family:${BODY_FONT};font-size:13px;color:${C.muted};margin-top:8px;">${opts.note}</div>` : ""}
    </td>
  </tr>
</table>`;

// ─── Layout ────────────────────────────────────────────────────────────────────

export interface LayoutOptions {
    baseUrl: string; // FRONTEND_URL
    title: string; // <title>
    preheader: string; // tekst podglądu w skrzynce
    eyebrow?: string; // mała pomarańczowa etykieta nad nagłówkiem
    headline: string; // duży nagłówek (wersaliki)
    bodyHtml: string;
}

export const renderEmail = (o: LayoutOptions): string => `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(o.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap" rel="stylesheet">
  <style>
    body { margin:0; padding:0; background:${C.cloud}; }
    img { border:0; outline:none; text-decoration:none; }
    a { color:${C.ink}; }
    @media only screen and (max-width:620px) {
      .px { padding-left:20px !important; padding-right:20px !important; }
      .h1 { font-size:36px !important; }
      .hide-sm { display:none !important; }
      .stack { display:block !important; width:100% !important; padding:0 0 8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.cloud};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cloud};font-size:1px;line-height:1px;">${escapeHtml(o.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cloud};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="${MAX_WIDTH}" cellpadding="0" cellspacing="0" style="width:100%;max-width:${MAX_WIDTH}px;background:${C.white};">

          <!-- Nagłówek z logo -->
          <tr>
            <td class="px" style="padding:20px 40px;background:${C.white};border-bottom:1px solid ${C.hairline};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <a href="${o.baseUrl}" target="_blank"><img src="${o.baseUrl}/staplero-email-logo.png" alt="STAPLERO" width="132" height="47" style="display:block;width:132px;height:auto;"></a>
                  </td>
                  <td class="hide-sm" align="right" style="font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Ausbildungszentrum &middot; DGUV V68</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Czarny pas z nagłówkiem -->
          <tr>
            <td class="px" style="padding:44px 40px 40px;background:${C.ink};">
              ${o.eyebrow ? `<div style="font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.orange};margin-bottom:14px;">${o.eyebrow}</div>` : ""}
              <div class="h1" style="font-family:${DISPLAY_FONT};font-size:48px;line-height:.98;font-weight:800;letter-spacing:.3px;text-transform:uppercase;color:${C.white};">${o.headline}</div>
            </td>
          </tr>

          <!-- Treść -->
          <tr>
            <td class="px" style="padding:40px 40px 44px;background:${C.white};">
              ${o.bodyHtml}
            </td>
          </tr>

          <!-- Stopka -->
          <tr>
            <td class="px" style="padding:30px 40px;background:${C.ink};border-top:4px solid ${C.orange};font-family:${BODY_FONT};font-size:13px;line-height:1.8;color:#a1a1a1;">
              <strong style="color:${C.white};">STAPLERO Ausbildungszentrum</strong><br>
              Jakobstr. 13, 02826 G&ouml;rlitz<br>
              <a href="mailto:info@staplero.com" style="color:#d4d4d4;text-decoration:none;">info@staplero.com</a> &middot; +49 176 22067783 &middot; +49 160 92490070<br>
              <a href="${o.baseUrl}/datenschutz" style="color:#d4d4d4;">Datenschutz</a> &middot; <a href="${o.baseUrl}/impressum" style="color:#d4d4d4;">Impressum</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
