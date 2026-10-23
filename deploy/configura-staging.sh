#!/usr/bin/env bash
# Una volta sola, dal Mac: crea staging.squisitus.it sul server (crea-staging.sh) e ci pubblica
# la versione attuale del sito. Chiede la password del server una volta, poi nome utente e password
# da usare per entrare nello staging.   Uso:  bash deploy/configura-staging.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SERVER="${SERVER:-root@89.46.196.83}"
CM="$HOME/.ssh/cm-squisitus-%r@%h"

ssh -o ControlMaster=auto -o ControlPath="$CM" -o ControlPersist=300 "$SERVER" 'cat > /tmp/crea-staging.sh' < deploy/crea-staging.sh
ssh -t -o ControlPath="$CM" "$SERVER" 'bash /tmp/crea-staging.sh; rm -f /tmp/crea-staging.sh'
bash deploy/pubblica.sh staging
