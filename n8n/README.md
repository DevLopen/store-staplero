# Postfach w panelu (staplero.de/admin#mails)

Maile do STAPLERO trafiają do panelu admina. AI przypisuje im kategorię, pilność i streszczenie oraz pisze szkic odpowiedzi.
W panelu poprawiasz szkic i wysyłasz. Nic nie wychodzi automatycznie.

**Wszystko działa w backendzie, n8n nie jest potrzebne.** Ten folder z workflow n8n to tylko opcja na przyszłość (sekcja na końcu).

```
formularz /api/contact ───────────► backend zapisuje wątek ─┐
skrzynka info@ (IMAP, co 2 minuty) ─► backend importuje maile ┤
                                                             ▼
                          backend pyta OpenAI (prompt: backend/src/services/inboxPrompt.ts)
                                                             ▼
                          panel: kategoria, streszczenie, szkic → „Senden”
                          backend wysyła przez SMTP info@ (All-Inkl), w wątku klienta
```

## Wdrożenie

1. `backend/scripts/backup-mongo.sh` (nowe kolekcje `inboxthreads`, `inboxsettings`, bez migracji).
2. Backend: `git pull`, w `backend/` **`npm install`** (nowe paczki: nodemailer, imapflow, mailparser), build, restart.
3. `backend/.env`:

```env
# skrzynka info@ w All-Inkl (panel KAS → E-Mail): ten sam login do odbioru (IMAP) i wysyłki (SMTP)
INBOX_SMTP_HOST=w01ec83d.kasserver.com
INBOX_SMTP_PORT=465
INBOX_SMTP_USER=
INBOX_SMTP_PASS=
INBOX_FROM=STAPLERO <info@staplero.com>

# opcjonalnie
# INBOX_IMAP_HOST / INBOX_IMAP_PORT / INBOX_IMAP_USER / INBOX_IMAP_PASS   inne dane do odbioru (domyślnie jak SMTP, port 993)
# INBOX_HISTORY_MONTHS=12         ile miesięcy skrzynki zsynchronizować przy pierwszym połączeniu
# INBOX_OPEN_DAYS=14              maile bez odpowiedzi młodsze niż N dni → „Offen” ze szkicem, starsze → „Archiv”
# INBOX_ATTACHMENT_DAYS=60        załączniki zapisujemy z maili z ostatnich N dni (starsze zostają w skrzynce)
# INBOX_HISTORY_ENABLED=false     wyłącza synchronizację i naukę z „Gesendet”
# INBOX_IMAP_ENABLED=false        wyłącza odbiór maili (formularz dalej trafia do panelu)
# INBOX_AI_MODEL=gpt-5.4-mini     model OpenAI do szkiców (klucz: OPENAI_API_KEY, już jest)
# INBOX_FILES_DIR=/var/staplero/inbox-files   załączniki (domyślnie backend/inbox-files, nie są publiczne)
# INBOX_IGNORE_FROM=rechnung@lexware.de       nadawcy pomijani przy imporcie, po przecinku
```

4. Frontend: build i wdrożenie jak zwykle.

Po restarcie backend pisze w logu `📬 Postfach: IMAP-Abruf alle 2 Minuten aktiv`, a po synchronizacji
`📚 Postfach synchronisiert: …`. Błąd logowania widać w logu jako `❌ Postfach IMAP: …` i w panelu pod wyszukiwarką
(„Abruf fehlgeschlagen: …”). Przycisk „Abrufen” w panelu pobiera nowe maile od razu.
Bez danych IMAP/SMTP w `.env` do panelu trafia tylko formularz, a odpowiedzi idą przez Resend.

## Jak to działa

- **Maile w skrzynce zostają nieprzeczytane**, panel jest kopią. Outlook czy Thunderbird dalej działają jak dotąd.
- **Wątki**: odpowiedź klienta trafia do tej samej rozmowy po nagłówkach `In-Reply-To`/`References`,
  a bez nich po adresie klienta i temacie (bez „Re:/AW:”) z ostatnich 60 dni.
- **Duplikaty**: ten sam `Message-ID` nie wpadnie dwa razy, pozycja odbioru jest zapisana w bazie.
- **Pomijane**: powiadomienie formularza z `noreply@` (zapytanie jest już w panelu z formularza), nasze własne maile,
  autoodpowiedzi, zwrotki (mailer-daemon), newslettery.
- **Szkic**: AI zna ofertę i FAQ (`backend/src/services/staplero.knowledge.ts`, tę samą wiedzę ma czat na stronie),
  wolne terminy z „Standorte & Termine” (kurs = 2 dni od startu) i ostatnie zamówienia klienta.
  Czego nie wie, oznacza jako `[BITTE ERGÄNZEN: …]`.
- **Synchronizacja przy pierwszym połączeniu**: cała skrzynka z 12 miesięcy (INBOX + „Gesendet”) trafia do panelu,
  żeby można było od razu pracować tylko w panelu. Rozmowy z odpowiedzią → „Beantwortet”, bez odpowiedzi z ostatnich
  14 dni → „Offen” ze szkicem AI, starsze bez odpowiedzi → „Archiv”. Newslettery, autoodpowiedzi i zwrotki są pomijane.
  Potem AI tworzy opis stylu z Twoich odpowiedzi (gdy jest pusty). Status i ponowna synchronizacja: „Schreibstil der KI”.
- **Odpowiedzi z panelu w „Gesendet”**: kopia każdej odpowiedzi trafia do folderu „Gesendet” w All-Inkl, więc Outlook
  i telefon widzą to samo co panel.
- **Twój styl**: opis w „Schreibstil der KI” (możesz go poprawić albo wygenerować na nowo przyciskiem „Aus gesendeten
  E-Mails erstellen”). Do każdego szkicu AI dostaje też 4 najbardziej podobne wcześniejsze rozmowy jako wzór.
  Przy wysyłce z panelu zapisujemy szkic AI (`aiDraft`), żeby później porównać „co AI napisało → co poszło do klienta”.
- **Odpowiedzi z Outlooka/telefonu**: nowe maile w „Gesendet” są pobierane co 2 minuty. Rozmowa, na którą odpowiedziałeś
  poza panelem, sama przechodzi do „Beantwortet”, a odpowiedź staje się kolejnym wzorem.
- **Ręczne zmiany wygrywają**: poprawiony szkic, kategoria i „Dringend” nie są nadpisywane przez AI.
  „Neu schreiben” (opcjonalnie z podpowiedzią, np. „kürzer”) celowo zastępuje szkic.
- **Spam**: kategoria `spam` od razu trafia do archiwum.
- **Wysyłka**: podpis i cytat ostatniej wiadomości klienta są dodawane automatycznie. Przez SMTP All-Inkl
  odpowiedź nie trafia sama do folderu „Gesendet” w skrzynce. W panelu jest zawsze.
- **RODO**: treść maili trafia do OpenAI. Potrzebne DPA z OpenAI i wpis w Datenschutzerklärung.

## Opcjonalnie: n8n zamiast wbudowanego odbioru i AI

Gdy kiedyś na serwerze będzie n8n i chcesz tam widzieć przebieg:

1. `.env`: `INBOX_IMAP_ENABLED=false`, `INBOX_HOOK_SECRET=<min. 16 znaków>`,
   `N8N_INBOX_WEBHOOK_URL=https://<n8n>/webhook/staplero-inbox-draft`.
2. W n8n credentials: IMAP `IMAP info@staplero.com`, Header Auth `Staplero Inbox Secret` (Name `x-inbox-secret`,
   Value = `INBOX_HOOK_SECRET`), OpenAI `OpenAI Staplero`.
3. Import `postfach-imap.json` i `postfach-ki-entwurf.json`, przypisz credentials, sprawdź adres API
   (węzły „An Panel senden” i „Konfiguration”, domyślnie `https://staplero.de/api`), włącz oba.

Prompt dalej buduje backend (`GET /api/inbox/hook/threads/:id` zwraca gotowe `openaiBody`), więc n8n i wersja wbudowana
piszą tak samo.
