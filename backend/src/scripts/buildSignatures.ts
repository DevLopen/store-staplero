/**
 * Generuje podpisy e-mail do programów pocztowych (Gmail, Outlook, Apple Mail) w brand-assets/podpis-email/.
 * Wygląd jest ten sam co stopka automatycznych maili (footerInner w emailTemplates.ts).
 *
 * Uruchomienie: npx tsx src/scripts/buildSignatures.ts [--local]
 *   --local  obrazki z dysku (public/), do podglądu przed wdrożeniem GIF-a na serwer
 */
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { footerInner, FOOTER_TD_STYLE } from "../services/emailTemplates";

const ROOT = path.resolve(__dirname, "../../..");
const OUT = path.join(ROOT, "brand-assets/podpis-email");
const local = process.argv.includes("--local");
const assetsUrl = local ? `file://${path.join(ROOT, "public")}` : "https://staplero.de";

const signatures = [
    { file: "podpis-bohdan", title: "Bohdan Kutko", person: { name: "Bohdan Kutko", role: "Inhaber", email: "bohdan.kutko@staplero.de" } },
    { file: "podpis-info", title: "info@staplero.de", email: "info@staplero.de" },
];

const page = (title: string, inner: string) => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Podpis STAPLERO: ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:40px 20px; background:#ececec; font-family:Arial,Helvetica,sans-serif; color:#39393b; }
  .hint { max-width:600px; margin:0 auto 24px; font-size:14px; line-height:1.6; }
</style>
</head>
<body>
<div class="hint">Zaznacz cały podpis poniżej myszką (od pomarańczowej linii do linków Datenschutz/Impressum), skopiuj Ctrl+C i wklej w ustawieniach podpisu w programie pocztowym.</div>
<!-- PODPIS: od tego miejsca -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;margin:0 auto;border-collapse:collapse;">
  <tr>
    <td style="padding:24px 28px 20px;${FOOTER_TD_STYLE}">
      ${inner}
    </td>
  </tr>
</table>
<!-- PODPIS: do tego miejsca -->
</body>
</html>
`;

mkdirSync(OUT, { recursive: true });
for (const s of signatures) {
    const inner = footerInner({ baseUrl: "https://staplero.de", assetsUrl, person: s.person, email: s.email });
    const file = path.join(OUT, `${s.file}${local ? "-podglad" : ""}.html`);
    writeFileSync(file, page(s.title, inner));
    console.log(file);
}
