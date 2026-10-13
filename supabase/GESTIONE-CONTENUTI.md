# Gestire rassegna stampa e partner

Il modo più semplice è il **pannello di gestione** del sito: `admin.html` (es. https://pasqualinobrocco-creator.github.io/squisitus-sito/admin.html), con moduli guidati per articoli, partner e richieste.

In alternativa si può lavorare dal pannello Supabase, progetto **Squisitus**: https://supabase.com/dashboard/project/bwdulyngojvbttztqyks, come descritto qui sotto.
Le modifiche compaiono sul sito al primo caricamento della pagina, senza ripubblicare nulla.

## Articoli (Table Editor → `articoli`)
| Campo | Cosa scrivere |
|---|---|
| `tipo` | `articolo` (uscita su una testata) oppure `comunicato` (comunicato Squisitus) |
| `testata` | Nome della testata, es. *Corriere della Sera* |
| `titolo` | Titolo come pubblicato |
| `link` | Indirizzo dell'articolo. **Lascia vuoto** se non è ancora uscito |
| `data` | Data di uscita |
| `in_evidenza` | Spunta per mostrarlo anche in "Ne parlano" (pagina Dicono di noi) |
| `occhiello`, `testo` | Solo per i comunicati. Nel testo separa i paragrafi con una riga vuota |
| `ordine` | A parità di data, i numeri più bassi vengono prima |
| `pubblicato` | Togli la spunta per nasconderlo senza cancellarlo |

Dove compaiono:
- **Con link** → "Ne hanno parlato" (pagina Salotto On The Road); se `in_evidenza`, anche in "Ne parlano" (Dicono di noi)
- **Senza link** → "Articoli in pubblicazione" (Dicono di noi). Quando esce, aggiungi il link: si sposta da solo
- **Comunicato** → articolo di apertura in Dicono di noi (il più recente)

## Partner (Table Editor → `partner`)
1. **Storage → `media`** → cartella `loghi` → carica il logo (PNG trasparente o SVG, max 5 MB)
2. **Table Editor → `partner`** → *Insert row*:
   - `nome`, `livello` (`Platinum`, `Main`, `Official`, `Technical`), `logo` = `loghi/nome-file.png`, `link` (facoltativo), `ordine`

Finché non c'è nessun partner, in homepage restano i riquadri segnaposto. Dal primo partner pubblicato compaiono solo i livelli che hanno loghi.

## Press kit (pannello → Press kit)
Materiali scaricabili nella pagina Press, raggruppati per **cartella** (Comunicati stampa, Immagini, Loghi… o una nuova).
- **Carica file**: uno o più file insieme (max 50 MB ciascuno); ognuno diventa una voce con il pulsante "Scarica"
- **Aggiungi link**: per cartelle Drive/Dropbox/WeTransfer o file più grandi; sul sito si apre in una nuova finestra
Senza materiali visibili la pagina mostra "Il press kit sarà disponibile a breve".

## Richieste dai moduli
Table Editor → `richieste` (espositori e sponsor), `newsletter`, `accrediti_press`. Dal sito nessuno può leggerle: le vedete solo voi dal pannello.
