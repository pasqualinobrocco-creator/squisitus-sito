#!/usr/bin/env bash
# Pubblica il sito dal Mac: build (con il pannello all'indirizzo di ADMIN_PATH, scritto solo in .env.local),
# caricamento sul server e installazione con aggiorna-server.sh. Chiede la password del server una sola volta.
#   bash deploy/pubblica.sh            → produzione, www.squisitus.it   (dal ramo git "main")
#   bash deploy/pubblica.sh staging    → prova, staging.squisitus.it    (di solito dal ramo "staging")
set -euo pipefail
cd "$(dirname "$0")/.."
SERVER="${SERVER:-root@89.46.196.83}"
DOVE="${1:-produzione}"
case "$DOVE" in produzione|staging) ;; *) echo "Uso: bash deploy/pubblica.sh [staging]"; exit 1;; esac
grep -q '^ADMIN_PATH=..' .env.local 2>/dev/null || { echo "Manca ADMIN_PATH in .env.local: il pannello non verrebbe pubblicato."; exit 1; }

RAMO="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if [ "$DOVE" = produzione ] && [ "$RAMO" != main ]; then
  echo "Sei sul ramo \"$RAMO\": la produzione si pubblica dal ramo \"main\" (git checkout main)."; exit 1
fi
echo "→ Pubblico in $DOVE dal ramo \"$RAMO\""

rm -rf dist
if [ "$DOVE" = staging ]; then BASE_PATH=/ STAGING=true npm run build; else BASE_PATH=/ npm run build; fi
PKG="$(mktemp -d)/sito.tar.gz"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$PKG" -C dist .

CM="$HOME/.ssh/cm-squisitus-%r@%h"
ssh -o ControlMaster=auto -o ControlPath="$CM" -o ControlPersist=120 "$SERVER" 'cat > /tmp/squisitus-sito.tar.gz' < "$PKG"
ssh -o ControlPath="$CM" "$SERVER" "bash -s /tmp/squisitus-sito.tar.gz $DOVE" < deploy/aggiorna-server.sh
ssh -o ControlPath="$CM" -O exit "$SERVER" 2>/dev/null || true
rm -f "$PKG"
