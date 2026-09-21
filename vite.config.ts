import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { SEO, PAGE_PATH, PAGE_URL, OG_IMAGE, buildJsonLd } from "./src/seo/firmenschulung.seo";

const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// Podmienia content istniejącego <meta name|property="key" content="..."> w index.html
const replaceMeta = (html: string, key: string, value: string) =>
  html.replace(
    new RegExp(`(<meta\\s+(?:name|property)="${key}"\\s+content=")[^"]*(")`, "i"),
    `$1${escapeAttr(value)}$2`
  );

/**
 * SPA ma jeden index.html, więc crawlery bez JavaScriptu (podglądy w social media, część botów)
 * widziałyby meta strony głównej na każdym adresie. Po buildzie generujemy dla strony
 * "Firmenschulung Berlin" osobny plik dist/<path>/index.html z jej własnym title, description,
 * canonical, Open Graph i JSON-LD. Aplikacja React nadal hydratuje się jak zwykle.
 */
const prerenderB2bMeta = (): Plugin => {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "prerender-b2b-meta",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
    },
    closeBundle() {
      const distDir = path.resolve(root, outDir);
      const indexFile = path.join(distDir, "index.html");
      if (!fs.existsSync(indexFile)) return;

      let html = fs.readFileSync(indexFile, "utf-8");
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(SEO.title)}</title>`);
      html = replaceMeta(html, "description", SEO.description);
      html = replaceMeta(html, "og:url", PAGE_URL);
      html = replaceMeta(html, "og:title", SEO.title);
      html = replaceMeta(html, "og:description", SEO.description);
      html = replaceMeta(html, "og:image", OG_IMAGE);
      html = replaceMeta(html, "twitter:title", SEO.title);
      html = replaceMeta(html, "twitter:description", SEO.description);
      html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/i, `$1${PAGE_URL}$2`);

      const jsonLd = buildJsonLd()
        .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`)
        .join("\n");
      html = html.replace("</head>", `${jsonLd}\n</head>`);

      const target = path.join(distDir, PAGE_PATH);
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, "index.html"), html);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), prerenderB2bMeta()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
