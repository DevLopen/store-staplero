import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  /** Pełny, kanoniczny URL strony */
  url: string;
  image?: string;
  jsonLd?: object[];
}

/**
 * Ustawia title, meta description, canonical, Open Graph/Twitter i JSON-LD dla bieżącej strony
 * i przywraca poprzednie wartości po opuszczeniu strony (SPA — index.html jest wspólny).
 */
const Seo = ({ title, description, url, image, jsonLd }: SeoProps) => {
  useEffect(() => {
    const undo: Array<() => void> = [];

    const prevTitle = document.title;
    document.title = title;
    undo.push(() => { document.title = prevTitle; });

    // Tworzy lub aktualizuje tag w <head>; zwraca funkcję przywracającą stan
    const upsert = (tag: "meta" | "link", match: Record<string, string>, set: Record<string, string>) => {
      const selector = `${tag}${Object.entries(match).map(([k, v]) => `[${k}="${v}"]`).join("")}`;
      let el = document.head.querySelector<HTMLElement>(selector);
      const created = !el;
      const prev: Record<string, string | null> = {};
      if (!el) {
        el = document.createElement(tag);
        Object.entries(match).forEach(([k, v]) => el!.setAttribute(k, v));
        document.head.appendChild(el);
      }
      Object.entries(set).forEach(([k, v]) => {
        prev[k] = el!.getAttribute(k);
        el!.setAttribute(k, v);
      });
      undo.push(() => {
        if (created) el!.remove();
        else Object.entries(prev).forEach(([k, v]) => (v === null ? el!.removeAttribute(k) : el!.setAttribute(k, v)));
      });
    };

    upsert("meta", { name: "description" }, { content: description });
    upsert("link", { rel: "canonical" }, { href: url });
    upsert("meta", { property: "og:type" }, { content: "website" });
    upsert("meta", { property: "og:url" }, { content: url });
    upsert("meta", { property: "og:title" }, { content: title });
    upsert("meta", { property: "og:description" }, { content: description });
    upsert("meta", { property: "twitter:title" }, { content: title });
    upsert("meta", { property: "twitter:description" }, { content: description });
    if (image) {
      upsert("meta", { property: "og:image" }, { content: image });
    }

    (jsonLd || []).forEach((data) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-page", "true");
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      undo.push(() => script.remove());
    });

    return () => undo.reverse().forEach((fn) => fn());
  }, [title, description, url, image, jsonLd]);

  return null;
};

export default Seo;
