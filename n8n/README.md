# Postfach w panelu (staplero.de/admin#mails)

Maile do STAPLERO trafiają do panelu admina. n8n przypisuje im kategorię i pisze szkic odpowiedzi.
W panelu poprawiasz szkic i wysyłasz. Nic nie wychodzi automatycznie.

```
formularz /api/contact ─────────────► backend zapisuje wątek ─┐
skrzynka info@ (IMAP) ─► n8n „E-Mails ins Panel” ─► /api/inbox/hook/ingest ─┤
                                                               ▼
                         backend woła webhook n8n „KI-Entwurf” (N8N_INBOX_WEBHOOK_URL)
                         n8n: GET /api/inbox/hook/threads/:id → OpenAI → POST …/:id/ai
                                                               ▼
                         panel: kategoria, streszczenie, szkic → „Senden”
                         backend wysyła przez SMTP info@ (All-Inkl), w wątku klienta
```

## 1. Backend (`backend/.env`)

```env
# wspólny sekret backend ↔ n8n, min. 16 znaków (np. openssl rand -hex 24)
INBOX_HOOK_SECRET=

# adres webhooka z workflow „Staplero Postfach: KI-Entwurf” (Production URL)
N8N_INBOX_WEBHOOK_URL=https://<n8n>/webhook/staplero-inbox-draft

# nadawca odpowiedzi
INBOX_FROM=STAPLERO <info@staplero.com>

# SMTP skrzynki info@ w All-Inkl (panel KAS → E-Mail). Bez tego odpowiedzi idą przez Resend.
INBOX_SMTP_HOST=w01ec83d.kasserver.com
INBOX_SMTP_PORT=465
INBOX_SMTP_USER=
INBOX_SMTP_PASS=

# opcjonalnie
# INBOX_FILES_DIR=/var/staplero/inbox-files   (załączniki; domyślnie backend/inbox-files, nie są publiczne)
# INBOX_IGNORE_FROM=rechnung@lexware.de,...   (nadawcy pomijani przy imporcie, po przecinku)
```

Po zmianie `.env` zrestartuj backend.

## 2. n8n

1. **Credentials** (Settings → Credentials):
   - **IMAP**, nazwa `IMAP info@staplero.com`: host `w01ec83d.kasserver.com`, port 993, SSL/TLS, login i hasło skrzynki.
   - **Header Auth**, nazwa `Staplero Inbox Secret`: Name `x-inbox-secret`, Value = `INBOX_HOOK_SECRET`.
   - **OpenAI**, nazwa `OpenAI Staplero`: klucz API.
2. **Import** obu plików (Workflows → Import from File):
   - `postfach-imap.json`: odbiera nowe maile i wysyła je do panelu.
   - `postfach-ki-entwurf.json`: kategoria i szkic odpowiedzi.
3. W każdym zaimportowanym workflow kliknij węzły z credentials i wybierz właściwe (import nie przenosi ID).
4. Adres backendu: domyślnie `https://staplero.de/api`. Jeśli API stoi pod innym adresem, zmień go w węźle
   „An Panel senden” (IMAP) oraz w węźle „Konfiguration” (KI-Entwurf).
5. Włącz oba workflow (Active). Production URL webhooka wpisz do `N8N_INBOX_WEBHOOK_URL`.

n8n musi być dostępne dla backendu (webhook) i musi widzieć backend. Jeśli n8n jest publiczne,
zmień domyślne hasło `admin/admin123` w `~/Workspace/n8n/docker-compose.yml` i postaw je za HTTPS.

## 3. Jak to działa w szczegółach

- **Wątki**: odpowiedź klienta trafia do tej samej rozmowy po nagłówkach `In-Reply-To`/`References`,
  a bez nich po adresie klienta i temacie (bez „Re:/AW:”) z ostatnich 60 dni.
- **Duplikaty**: ten sam `Message-ID` nie wpadnie dwa razy.
- **Pomijane**: powiadomienie formularza z `noreply@` (zapytanie jest już w panelu z formularza), nasze własne maile,
  autoodpowiedzi (`Auto-Submitted`), mailer-daemon.
- **Szkic**: AI zna ofertę i FAQ (`backend/src/services/staplero.knowledge.ts`, tę samą wiedzę ma czat na stronie),
  wolne terminy z „Standorte & Termine” i ostatnie zamówienia klienta. Czego nie wie, oznacza jako `[BITTE ERGÄNZEN: …]`.
- **Ręczne zmiany wygrywają**: poprawiony szkic, kategoria i „Dringend” nie są nadpisywane przez AI.
  „Neu schreiben” (opcjonalnie z podpowiedzią, np. „kürzer”) celowo zastępuje szkic.
- **Twój styl**: w panelu „Schreibstil der KI” (nad kategoriami) opisujesz, jak mają brzmieć odpowiedzi. Dodatkowo AI dostaje
  4 ostatnie odpowiedzi wysłane z panelu (najpierw z tej samej kategorii) jako wzór, więc każda wysłana odpowiedź uczy kolejne szkice.
  Przy wysyłce zapisujemy też szkic AI (`aiDraft`), żeby później porównać „co AI napisało → co poszło do klienta”.
- **Spam**: kategoria `spam` od razu trafia do archiwum.
- **Wysyłka**: podpis i cytat ostatniej wiadomości klienta są dodawane automatycznie. Przez SMTP All-Inkl
  odpowiedź nie trafia sama do folderu „Gesendet” w skrzynce. W panelu jest zawsze.
- **RODO**: treść maili trafia do OpenAI. Potrzebne DPA z OpenAI i wpis w Datenschutzerklärung.
