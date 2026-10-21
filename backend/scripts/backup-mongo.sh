#!/usr/bin/env bash
# Kopia zapasowa całej bazy przed wdrożeniem (mongodump, jeden plik .archive.gz).
#
#   ./scripts/backup-mongo.sh                 # MONGO_URI z backend/.env, zapis do backend/backups/
#   MONGO_URI="mongodb+srv://..." ./scripts/backup-mongo.sh /sciezka/do/katalogu
#
# Przywracanie (najpierw obejrzyj, co jest w pliku: dodaj --dryRun):
#   cała baza, nadpisuje istniejące kolekcje:
#     mongorestore --uri "$MONGO_URI" --gzip --archive=PLIK --drop
#   tylko stary kurs (treść + postępy kursantów), reszta bez zmian:
#     mongorestore --uri "$MONGO_URI" --gzip --archive=PLIK --drop \
#       --nsInclude='staplerschein.courses' --nsInclude='staplerschein.topicprogresses' \
#       --nsInclude='staplerschein.quizresults' --nsInclude='staplerschein.usercourses'
#   (zamień "staplerschein" na nazwę bazy z MONGO_URI)
set -euo pipefail

cd "$(dirname "$0")/.."
if [ -z "${MONGO_URI:-}" ] && [ -f .env ]; then
  MONGO_URI="$(grep -E '^MONGO_URI=' .env | head -n1 | cut -d= -f2-)"
fi
: "${MONGO_URI:?Brak MONGO_URI (ustaw zmienną albo wpisz do backend/.env)}"

OUT_DIR="${1:-backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/mongo-$(date +%Y-%m-%d_%H%M).archive.gz"

mongodump --uri "$MONGO_URI" --gzip --archive="$FILE"
echo "Kopia zapisana: $FILE ($(du -h "$FILE" | cut -f1))"
# szybka kontrola: lista kolekcji i liczba dokumentów w kopii
mongorestore --gzip --archive="$FILE" --dryRun -v 2>&1 | grep -E "found collection|restoring" | sed 's/^.*\t//' | head -40 || true
