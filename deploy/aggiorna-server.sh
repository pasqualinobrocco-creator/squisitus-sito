#!/usr/bin/env bash
# Installa (o aggiorna) il sito Squisitus sul server nginx di www.squisitus.it.
# Uso, dalla console del server:
#   curl -fsSL https://raw.githubusercontent.com/pasqualinobrocco-creator/squisitus-sito/main/deploy/aggiorna-server.sh | sudo bash
#
# Cosa fa: trova la cartella del sito configurata in nginx, ne fa un backup in /var/backups/squisitus,
# scarica l'ultima build dal ramo "server" del repository, la mette al posto dei file attuali,
# controlla la configurazione di nginx e lo ricarica. Non modifica la configurazione di nginx né HTTPS.
set -euo pipefail

REPO="pasqualinobrocco-creator/squisitus-sito"
PACCHETTO="https://codeload.github.com/${REPO}/tar.gz/refs/heads/server"
BACKUP_DIR="/var/backups/squisitus"

[ "$(id -u)" -eq 0 ] || { echo "Va eseguito come root (con sudo)."; exit 1; }
command -v nginx >/dev/null || { echo "nginx non trovato su questo server."; exit 1; }

# cartella del sito: il "root" del blocco server di squisitus.it (altrimenti quello di default)
ROOT="$(nginx -T 2>/dev/null | awk '
  /^[ \t]*server[ \t]*\{/ && depth==0 { insrv=1; root=""; match_=0 }
  { line=$0; o=gsub(/\{/,"{",line); c=gsub(/\}/,"}",line) }
  insrv && $1=="root" { r=$2; gsub(";","",r); root=r }
  insrv && $1=="server_name" && /squisitus\.it/ { match_=1 }
  { depth+=o-c; if (insrv && depth==0) { if (match_ && root!="") { print root; exit } insrv=0 } }')"
[ -n "$ROOT" ] || ROOT="$(nginx -T 2>/dev/null | awk '$1=="root" { gsub(";","",$2); print $2; exit }')"
[ -n "$ROOT" ] || ROOT="/var/www/html"
case "$ROOT" in /|/etc*|/usr*|/bin*|/root*|"") echo "Cartella del sito non sicura: '$ROOT'. Mi fermo."; exit 1;; esac
echo "→ Cartella del sito: $ROOT"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
echo "→ Scarico l'ultima versione del sito…"
curl -fsSL "$PACCHETTO" -o "$TMP/sito.tar.gz"
mkdir -p "$TMP/sito"
tar -xzf "$TMP/sito.tar.gz" -C "$TMP/sito" --strip-components=1
[ -f "$TMP/sito/index.html" ] && [ -f "$TMP/sito/sitemap.xml" ] || { echo "Pacchetto non valido. Nessuna modifica fatta."; exit 1; }

mkdir -p "$BACKUP_DIR" "$ROOT"
STAMP="$(date +%Y%m%d-%H%M%S)"
tar -czf "$BACKUP_DIR/sito-$STAMP.tar.gz" -C "$ROOT" . 2>/dev/null || true
echo "→ Backup della versione precedente: $BACKUP_DIR/sito-$STAMP.tar.gz"

# sostituisce i file del sito (i backup restano, vengono tenuti gli ultimi 10)
find "$ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "$TMP/sito/." "$ROOT/"
chown -R www-data:www-data "$ROOT" 2>/dev/null || true
find "$ROOT" -type d -exec chmod 755 {} + ; find "$ROOT" -type f -exec chmod 644 {} +
ls -1t "$BACKUP_DIR"/sito-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

nginx -t && systemctl reload nginx
echo "✓ Sito aggiornato. Apri https://www.squisitus.it"
echo "  Per tornare alla versione precedente: rm -rf $ROOT/* && tar -xzf $BACKUP_DIR/sito-$STAMP.tar.gz -C $ROOT"
