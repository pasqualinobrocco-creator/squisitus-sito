#!/usr/bin/env bash
# Installa (o aggiorna) il sito Squisitus sul server nginx di www.squisitus.it.
# Di solito si lancia dal Mac con deploy/pubblica.sh, che costruisce il sito (pannello incluso) e passa
# a questo script il pacchetto già caricato sul server:  bash aggiorna-server.sh /tmp/squisitus-sito.tar.gz
# Senza argomento scarica la build dal ramo "server" del repository (che però non contiene il pannello).
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
mkdir -p "$TMP/sito"
if [ -n "${1:-}" ]; then
  [ -f "$1" ] || { echo "Pacchetto $1 non trovato."; exit 1; }
  echo "→ Uso il pacchetto $1"
  tar -xzf "$1" -C "$TMP/sito"
  rm -f "$1"
else
  echo "→ Scarico l'ultima versione del sito…"
  curl -fsSL "$PACCHETTO" -o "$TMP/sito.tar.gz"
  tar -xzf "$TMP/sito.tar.gz" -C "$TMP/sito" --strip-components=1
fi
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

# nginx: ogni indirizzo deve servire la sua pagina (cartella/index.html), non sempre la home,
# e gli indirizzi inesistenti devono rispondere 404 con la pagina 404.html.
CONF="$(nginx -T 2>/dev/null | awk '
  /^# configuration file / { f=$4; sub(":$","",f) }
  /server_name/ && /squisitus\.it/ { print f; exit }')"
[ -n "$CONF" ] && CONF="$(readlink -f "$CONF")"  # sites-enabled is usually a link to sites-available
# il blocco "location / { … }" deve provare file, poi la pagina della cartella, poi 404
# (prima rimandava tutto alla home o a un'app Node, "@app", che il sito statico non usa)
if [ -n "$CONF" ] && [ -f "$CONF" ] && ! grep -q 'try_files $uri $uri/index.html' "$CONF"; then
  cp -a "$CONF" "$BACKUP_DIR/nginx-$(basename "$CONF")-$STAMP.bak"
  perl -0pi -e 's#(location\s+/\s*\{[^\}]*?)try_files[^;]*;#$1try_files \$uri \$uri/index.html \$uri/ =404;#' "$CONF"
  grep -q 'error_page 404 /404.html' "$CONF" || perl -0pi -e 's{(server_name[^;]*squisitus\.it[^;]*;)}{$1\n    error_page 404 /404.html;}' "$CONF"
  if grep -q 'try_files $uri $uri/index.html' "$CONF" && nginx -t 2>/dev/null; then
    echo "→ Configurazione nginx aggiornata: ogni pagina ha il suo indirizzo (backup in $BACKUP_DIR)"
  else
    cp -a "$BACKUP_DIR/nginx-$(basename "$CONF")-$STAMP.bak" "$CONF"
    echo "! Modifica di nginx non applicata: ripristinata la configurazione precedente"
  fi
fi

nginx -t && systemctl reload nginx
echo "✓ Sito aggiornato. Apri https://www.squisitus.it"
echo "  Per tornare alla versione precedente: rm -rf $ROOT/* && tar -xzf $BACKUP_DIR/sito-$STAMP.tar.gz -C $ROOT"
