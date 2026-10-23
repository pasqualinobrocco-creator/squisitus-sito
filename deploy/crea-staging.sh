#!/usr/bin/env bash
# Crea (una volta sola) l'area di prova staging.squisitus.it sul server nginx di www.squisitus.it.
# Si lancia dal Mac con:  bash deploy/configura-staging.sh   (carica questo file e lo esegue sul server)
#
# Cosa fa: cartella /var/www/squisitus/staging, accesso protetto da nome utente e password (chiesti qui,
# in modo che restino solo sul server), sito nginx "staging.squisitus.it" mai indicizzato dai motori
# di ricerca, certificato HTTPS con certbot. Non tocca la configurazione di www.squisitus.it.
set -euo pipefail

DOMINIO="staging.squisitus.it"
ROOT="/var/www/squisitus/staging"
PASSFILE="/etc/nginx/squisitus-staging.htpasswd"

[ "$(id -u)" -eq 0 ] || { echo "Va eseguito come root."; exit 1; }
command -v nginx >/dev/null || { echo "nginx non trovato su questo server."; exit 1; }
command -v openssl >/dev/null || { echo "openssl non trovato su questo server."; exit 1; }

mkdir -p "$ROOT"
[ -f "$ROOT/index.html" ] || echo '<!doctype html><meta charset="utf-8"><title>Staging Squisitus</title><p>Staging pronto: pubblica con deploy/pubblica.sh staging.</p>' > "$ROOT/index.html"
chown -R www-data:www-data "$ROOT" 2>/dev/null || true

# nome utente e password per entrare nello staging (la password non compare mentre la scrivi)
if [ ! -s "$PASSFILE" ]; then
  echo "Scegli l'accesso allo staging (servirà a chi deve vedere la versione di prova)."
  read -rp "Nome utente: " UTENTE < /dev/tty
  while :; do
    read -rsp "Password: " P1 < /dev/tty; echo
    read -rsp "Ripeti la password: " P2 < /dev/tty; echo
    [ -n "$P1" ] && [ "$P1" = "$P2" ] && break
    echo "Le password non coincidono o sono vuote, riprova."
  done
  printf '%s:%s\n' "$UTENTE" "$(printf %s "$P1" | openssl passwd -apr1 -stdin)" > "$PASSFILE"
  unset P1 P2
  chown root:www-data "$PASSFILE"; chmod 640 "$PASSFILE"
  echo "→ Accesso creato per l'utente \"$UTENTE\""
else
  echo "→ Accesso già presente in $PASSFILE (per cambiarlo, cancella il file e rilancia)"
fi

# sito nginx (in sites-available/sites-enabled se esistono, altrimenti in conf.d)
if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
  CONF="/etc/nginx/sites-available/$DOMINIO"; LINK="/etc/nginx/sites-enabled/$DOMINIO"
else
  CONF="/etc/nginx/conf.d/$DOMINIO.conf"; LINK=""
fi
if [ ! -f "$CONF" ]; then
  cat > "$CONF" <<NGINX
# Staging di Squisitus: versione di prova, protetta da password e mai indicizzata.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMINIO;
    root $ROOT;
    index index.html;

    auth_basic "Squisitus staging";
    auth_basic_user_file $PASSFILE;
    add_header X-Robots-Tag "noindex, nofollow" always;

    location / {
        try_files \$uri \$uri/index.html \$uri/ =404;
    }
    error_page 404 /404.html;
}
NGINX
  [ -n "$LINK" ] && ln -sf "$CONF" "$LINK"
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "→ Sito nginx $DOMINIO creato"
  else rm -f "$CONF" ${LINK:+"$LINK"}; nginx -t; echo "! Configurazione non valida: annullata."; exit 1; fi
else
  echo "→ Sito nginx $DOMINIO già presente"
fi

# HTTPS con certbot (lo stesso strumento dei certificati di www.squisitus.it)
if command -v certbot >/dev/null; then
  if certbot certificates 2>/dev/null | grep -q "Domains:.*$DOMINIO"; then
    echo "→ Certificato HTTPS già presente"
  else
    certbot --nginx -d "$DOMINIO" --non-interactive --redirect \
      && echo "→ Certificato HTTPS creato" \
      || echo "! Certificato HTTPS non creato: lo staging per ora risponde solo su http://$DOMINIO"
  fi
else
  echo "! certbot non trovato: lo staging per ora risponde solo su http://$DOMINIO"
fi

echo "✓ Staging pronto: https://$DOMINIO"
