#!/usr/bin/env bash
# Pubblica il sito su www.squisitus.it dal Mac: build (con il pannello all'indirizzo di ADMIN_PATH,
# scritto solo in .env.local), caricamento sul server e installazione con aggiorna-server.sh.
# Chiede la password del server una sola volta.   Uso:  bash deploy/pubblica.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SERVER="${SERVER:-root@89.46.196.83}"
grep -q '^ADMIN_PATH=..' .env.local 2>/dev/null || { echo "Manca ADMIN_PATH in .env.local: il pannello non verrebbe pubblicato."; exit 1; }

rm -rf dist
BASE_PATH=/ npm run build
PKG="$(mktemp -d)/sito.tar.gz"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$PKG" -C dist .

CM="$HOME/.ssh/cm-squisitus-%r@%h"
ssh -o ControlMaster=auto -o ControlPath="$CM" -o ControlPersist=120 "$SERVER" 'cat > /tmp/squisitus-sito.tar.gz' < "$PKG"
ssh -o ControlPath="$CM" "$SERVER" 'bash -s /tmp/squisitus-sito.tar.gz' < deploy/aggiorna-server.sh
ssh -o ControlPath="$CM" -O exit "$SERVER" 2>/dev/null || true
rm -f "$PKG"
