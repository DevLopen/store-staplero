const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

/** Ładuje skrypt reCAPTCHA v3 (raz). Bez skonfigurowanego klucza nic nie robi. */
export const loadRecaptcha = () => {
  if (!SITE_KEY) return;
  if (document.querySelector('script[src*="recaptcha/api.js"]')) return;
  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
  script.async = true;
  document.body.appendChild(script);
};

/** Niewidoczny token reCAPTCHA v3 tuż przed wysłaniem formularza; pusty string, gdy niedostępny. */
export const getRecaptchaToken = (action = "contact"): Promise<string> => {
  if (!SITE_KEY || !window.grecaptcha) return Promise.resolve("");
  return new Promise((resolve) => {
    window.grecaptcha!.ready(async () => {
      try {
        resolve(await window.grecaptcha!.execute(SITE_KEY, { action }));
      } catch {
        resolve("");
      }
    });
  });
};
