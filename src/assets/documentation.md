# Documentazione gestionale divani

## Catalogo

### Descrizione generale
La pagina `Catalogo` è la schermata principale disponibile dopo l'accesso. Viene usata per consultare i prodotti inseriti, verificare le varianti di ciascun divano, avviare la generazione del listino PDF singolo o multiplo e aprire la finestra di modifica del prodotto.

### Elementi presenti nella pagina
- Titolo pagina `Catalogo` con sottotitolo descrittivo.
- Campo di ricerca rapido dei prodotti.
- Pulsante `Generazione Multi Listino`.
- Stato vuoto con messaggio diverso a seconda che non esistano prodotti o che la ricerca non restituisca risultati.
- Griglia di card prodotto.
- Ogni card prodotto mostra nome, immagine principale o placeholder `Nessuna immagine`, descrizione se presente, elenco varianti con prezzo, pulsanti modifica/eliminazione e pulsante `Genera Listino`.
- Dettaglio espandibile per ogni variante con misure, modalità di prezzo e componenti associati.
- Dialog `Configura Rivestimenti per Varianti`.
- Dialog `Generazione Multi Listino`.
- Dialog `Extra (Materassi e Meccanismi)`.
- Dialog `Configurazione Listino`.
- Dialog `Modifica Prodotto`.
- Dialog `Aggiungi Componente alla Variante`.
- Dialog di conferma per eliminazione prodotto e conferme contestuali per immagini, componenti e varianti.

### Funzionalità disponibili
#### Ricerca nel catalogo
Il campo di ricerca in alto filtra le card in base al nome del prodotto. Quando il campo contiene testo compare il pulsante di cancellazione rapida. Se nessun prodotto corrisponde al filtro viene mostrato un messaggio dedicato con il testo cercato.

#### Consultazione dei prodotti
Ogni prodotto viene mostrato come card. Se il prodotto ha più immagini, nella card viene visualizzata solo la prima. Se l'immagine manca o non è caricabile, viene mostrato il riquadro `Nessuna immagine`.

#### Consultazione delle varianti
Ogni card elenca le varianti associate al prodotto con nome e prezzo. Il pulsante con freccia apre il dettaglio della variante e mostra:
- numero posti, se valorizzato;
- larghezza;
- profondità chiuso;
- profondità aperto;
- altezza;
- modalità di prezzo;
- componenti raggruppati con quantità, totale, fornitore, tipo e prezzo unitario se utile.

Se la variante usa un prezzo personalizzato e non ha componenti, viene mostrato un messaggio informativo dedicato.

#### Generazione del listino di un singolo prodotto
Il pulsante `Genera Listino` avvia un flusso guidato in tre passaggi:
1. configurazione rivestimenti per le varianti;
2. gestione degli extra di listino;
3. configurazione finale del listino.

Nel primo passaggio si seleziona un set comune di rivestimenti valido per tutte le varianti del prodotto. Per ogni variante è poi possibile indicare i metri associati a ciascun rivestimento e applicare lo stesso valore a tutti i rivestimenti della variante selezionata.

Nel secondo passaggio si possono aggiungere, modificare o rimuovere righe di `materassi extra` e `meccanismi extra`.

Nel terzo passaggio si imposta il ricarico percentuale, si sceglie il logo di copertina del listino e si seleziona la lingua del PDF. Da qui l'utente può:
- salvare i dati del listino senza generare il PDF;
- generare il PDF in una nuova scheda/finestra.

Il listino generato include, in base al codice disponibile:
- copertina con logo selezionato;
- pagina con condizioni commerciali;
- scheda prodotto con immagini e caratteristiche tecniche;
- matrice prezzi per variante e rivestimento;
- eventuali extra configurati;
- traduzione automatica dei contenuti dinamici nella lingua scelta.

#### Generazione multi listino
Il pulsante `Generazione Multi Listino` apre un dialog con tabella di selezione prodotti. Il dialog mostra:
- contatori `Disponibili`, `Selezionati`, `Non disponibili` e `Totale`;
- ricerca interna;
- selezione massiva dei soli prodotti attualmente visibili e selezionabili;
- tabella con checkbox, nome divano, prezzo e stato;
- scelta della lingua del PDF.

Il pulsante `Genera PDF` resta disabilitato finché non è selezionato almeno un prodotto disponibile. Il PDF multi listino viene aperto in una nuova scheda/finestra.

#### Modifica del prodotto
Il pulsante con matita della card apre una finestra di modifica con queste aree:
- immagini prodotto;
- informazioni base;
- caratteristiche tecniche;
- tabella varianti esistenti.

L'utente può modificare nome, descrizione, contenuti testuali delle caratteristiche tecniche e immagini. Il salvataggio finale aggiorna il prodotto e mostra un messaggio di conferma.

#### Gestione immagini nella modifica prodotto
Nella finestra di modifica è possibile:
- sostituire una singola immagine;
- aggiungere immagini fino a un massimo di 3;
- marcare un'immagine per la rimozione.

Sono accettati solo file immagine. Ogni file deve essere inferiore a 5 MB. La rimozione o sostituzione dell'immagine viene consolidata solo con `Salva Modifiche`.

#### Gestione varianti esistenti
Nella tabella varianti della finestra di modifica l'utente può:
- aprire la modifica di una variante esistente;
- aggiungere componenti a una variante;
- rimuovere componenti già presenti;
- rimuovere la variante dall'elenco in modifica.

La modifica di una variante consente di cambiare nome variante, nome custom quando applicabile e misure principali. Non è presente un campo di prezzo diretto in questa schermata.

L'aggiunta di componenti a una variante avviene tramite dialog dedicato con selezione del componente e quantità. Dopo l'inserimento il prezzo della variante viene ricalcolato automaticamente.

#### Eliminazione del prodotto
Il pulsante con cestino nella card apre una conferma esplicita. In caso di conferma, il prodotto viene eliminato e la pagina rimuove anche le varianti associate dal catalogo corrente. Se il prodotto aveva immagini, il messaggio di esito indica anche il numero di immagini rimosse.

### Campi, filtri e controlli
#### Catalogo e listini
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Ricerca catalogo | Testo | Filtra le card prodotto per nome prodotto. | No | Il placeholder parla di modello, ma dal codice il filtro usa il nome del prodotto. |
| Generazione Multi Listino | Pulsante | Apre il dialog per selezionare più prodotti e generare un unico PDF. | No | Sempre visibile nella toolbar. |
| Toggle dettaglio variante | Pulsante icona | Espande o comprime il dettaglio della singola variante nella card. | No | Mostra misure, modalità prezzo e componenti. |
| Genera Listino | Pulsante | Avvia il flusso guidato per il listino del singolo prodotto. | No | Parte dal dialog dei rivestimenti. |
| Rivestimenti condivisi | Multi-select | Seleziona i rivestimenti applicati a tutte le varianti del prodotto. | Sì | Ricerca interna attiva; per i nuovi rivestimenti i metri partono da `0,1`. |
| Variante da configurare | Dropdown | Seleziona la variante su cui impostare i metri dei rivestimenti. | Sì | Viene preselezionata la prima variante del prodotto. |
| Metri uniformi | Numero decimale | Imposta un valore unico di metri da applicare a tutti i rivestimenti della variante selezionata. | No | Minimo `0,1`, step `0,1`, fino a 2 decimali. |
| Applica a tutti | Pulsante | Copia il valore dei metri uniformi su tutti i rivestimenti della variante selezionata. | No | Disponibile solo se la variante ha rivestimenti selezionati. |
| Metri per rivestimento | Numero decimale | Imposta i metri del singolo rivestimento per la variante selezionata. | Sì | Minimo `0,1`, step `0,1`, fino a 2 decimali. |
| Ricerca multi listino | Testo | Filtra la tabella del multi listino. | No | Il filtro considera nome divano, descrizione/modello e stato. |
| Checkbox tabella multi listino | Checkbox | Seleziona i prodotti da includere nel PDF multi listino. | Sì, per generare il PDF | Le righe non selezionabili hanno checkbox disabilitata. |
| Seleziona tutti | Pulsante | Seleziona tutti i prodotti visibili e selezionabili nella tabella. | No | Agisce sull'elenco filtrato attualmente mostrato. |
| Deseleziona | Pulsante | Svuota la selezione corrente nel multi listino. | No | Disponibile solo se esiste almeno un elemento selezionato. |
| Lingua multi listino | Dropdown | Seleziona la lingua del PDF multi listino. | Sì, per il PDF | Lingue disponibili: Italiano, English, Français, Deutsch, Español, Português. |
| Nome materasso extra | Testo | Nome della riga di materasso extra da stampare nel listino. | Indicato come sì | Il campo è marcato con asterisco nell'interfaccia. |
| Prezzo materasso extra | Valuta | Prezzo della riga di materasso extra. | No | Minimo `0`. |
| Nome meccanismo extra | Testo | Nome della riga di meccanismo extra da stampare nel listino. | Indicato come sì | Il campo è marcato con asterisco nell'interfaccia. |
| Prezzo meccanismo extra | Valuta | Prezzo della riga di meccanismo extra. | No | Minimo `0`. |
| Percentuale di ricarico | Numero percentuale | Imposta il ricarico applicato ai prezzi del listino. | Sì | Minimo `0`, massimo `1000`. |
| Immagine listino | Dropdown | Seleziona il logo della prima pagina del listino. | Sì | Opzioni visibili nel codice: `SofaForm`, `Convertible Contemporains`. |
| Lingua del listino | Dropdown | Seleziona la lingua del PDF del singolo prodotto. | Sì | Lingue disponibili: Italiano, English, Français, Deutsch, Español, Português. |

#### Modifica prodotto
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Immagini prodotto | Upload immagini | Gestisce immagini del prodotto nella finestra di modifica. | No | Massimo 3 immagini; solo file immagine; massimo 5 MB ciascuna. |
| Nome Prodotto | Testo | Nome del prodotto. | Sì | Campo realmente validato; senza valore il salvataggio è bloccato. |
| Descrizione | Textarea | Descrizione testuale del prodotto. | No | Mostrata anche nella card del catalogo se valorizzata. |
| Seduta | Textarea | Testo tecnico relativo alla seduta. | No | Usato nel PDF del listino. |
| Schienale | Textarea | Testo tecnico relativo allo schienale. | No | Usato nel PDF del listino. |
| Meccanica | Textarea | Testo tecnico relativo alla meccanica. | No | Usato nel PDF del listino. |
| Materasso | Textarea | Testo tecnico relativo al materasso. | No | Usato nel PDF del listino. |
| Nome Variante | Dropdown | Tipo della variante in modifica. | Sì | Valori previsti: Divano 3 PL Maxi, Divano 3 PL, Divano 2 PL, Chaise Longue, Pouf 50 x 50, Pouf 60 x 60, Pouf 70 x 70, Elemento senza bracciolo, Elemento con bracciolo, Poltrona 90 cm, Poltrona 80 cm, Poltrona 70 cm, Custom. |
| Nome Custom | Testo | Nome libero della variante quando il tipo è `Custom`. | Sì, solo se tipo `Custom` | Il pulsante di salvataggio variante resta disabilitato se manca. |
| Posti | Numero intero | Numero posti della variante. | No | Minimo `1`, massimo `20`. |
| Larghezza | Numero | Larghezza della variante. | No | Minimo `1`, massimo `500`, suffisso `cm`. |
| Profondità (chiuso) | Numero | Profondità della variante da chiusa. | No | Minimo `0`, massimo `500`, suffisso `cm`. |
| Profondità (aperto) | Numero | Profondità della variante da aperta. | No | Minimo `0`, massimo `500`, suffisso `cm`. |
| Altezza | Numero | Altezza della variante. | No | Minimo `1`, massimo `500`, suffisso `cm`. |
| Componente variante | Dropdown | Seleziona un componente da aggiungere alla variante. | Sì, per confermare il dialog | Ricerca interna attiva. |
| Quantità componente | Numero intero | Numero di occorrenze del componente da aggiungere alla variante. | Sì, per confermare il dialog | Minimo `1`, massimo `50`. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Cercare un prodotto | Inserisce testo nel campo di ricerca principale. | La griglia mostra solo i prodotti il cui nome contiene il testo cercato. |
| Azzerare la ricerca | Clicca sulla `x` nel campo di ricerca. | Il filtro viene rimosso e ricompare l'elenco completo. |
| Espandere una variante | Clicca sulla freccia nella riga della variante. | Si aprono o chiudono i dettagli della variante. |
| Aprire modifica prodotto | Clicca sull'icona matita nella card. | Si apre il dialog di modifica del prodotto. |
| Eliminare prodotto | Clicca sull'icona cestino e conferma. | Il prodotto viene rimosso dal catalogo; viene mostrato un messaggio di esito. |
| Avviare listino singolo | Clicca `Genera Listino` su una card. | Si apre il dialog di configurazione rivestimenti. |
| Confermare i rivestimenti | Clicca `Continua` nel dialog rivestimenti. | Se la configurazione è valida si apre il dialog degli extra. |
| Applicare metri uguali | Imposta il valore metri uniformi e clicca `Applica a tutti`. | Tutti i rivestimenti della variante selezionata ricevono lo stesso valore metri. |
| Aggiungere extra di listino | Clicca `Aggiungi Materasso` o `Aggiungi Meccanismo`. | Viene aggiunta una nuova riga editabile nel dialog extra. |
| Rimuovere extra di listino | Clicca sul cestino della riga extra. | La riga viene eliminata dal dialog corrente. |
| Salvare dati listino senza PDF | Clicca `Salva Senza PDF`. | Rivestimenti, extra e ricarico vengono salvati senza generare il PDF. |
| Generare PDF singolo | Clicca `Genera PDF` nel dialog `Configurazione Listino`. | I dati vengono salvati e il PDF viene aperto in una nuova scheda/finestra. |
| Aprire multi listino | Clicca `Generazione Multi Listino`. | Si apre il dialog di selezione multipla prodotti. |
| Selezionare tutti i prodotti visibili | Clicca `Seleziona tutti` nel multi listino. | Vengono selezionate tutte le righe disponibili attualmente visibili. |
| Generare PDF multi listino | Clicca `Genera PDF` nel multi listino. | Viene generato un PDF unico con i prodotti selezionati e aperto in una nuova scheda/finestra. |
| Aggiungere o sostituire un'immagine | Clicca su `Aggiungi`, `Scegli File` o sull'icona matita sopra l'immagine. | Il file selezionato viene preparato per il salvataggio finale del prodotto. |
| Rimuovere un'immagine del prodotto | Clicca sull'icona cestino dell'immagine e conferma. | L'immagine viene marcata per l'eliminazione e sarà rimossa al salvataggio finale. |
| Modificare una variante esistente | Clicca sulla matita nella tabella varianti. | Si apre il form di modifica variante nella parte alta della sezione varianti. |
| Salvare la variante in modifica | Clicca `Salva Modifiche` nel form variante. | Le modifiche alla variante restano nella sessione di editing del prodotto. |
| Aggiungere componenti a una variante | Clicca sul `+` nella colonna componenti della tabella varianti. | Si apre il dialog per scegliere componente e quantità. |
| Rimuovere un componente da una variante | Clicca sulla `x` del chip componente e conferma. | Il componente viene tolto dalla variante e il prezzo viene ricalcolato. |
| Rimuovere una variante dall'elenco | Clicca sul cestino della variante e conferma. | La variante viene rimossa dall'elenco in modifica; il cambiamento richiede il salvataggio finale del prodotto. |
| Salvare il prodotto | Clicca `Salva Modifiche` nel dialog prodotto. | Vengono salvati dati del prodotto, immagini e varianti gestite in quella sessione. |

### Comportamenti e regole
- La pagina è accessibile agli utenti autenticati.
- Se non esistono prodotti e non è attivo alcun filtro compare il messaggio `Nessun prodotto aggiunto.`.
- Se la ricerca non restituisce risultati compare il messaggio `Nessun prodotto trovato per "..."`.
- Le card mostrano solo i dati effettivamente valorizzati: descrizione e misure mancanti non vengono visualizzate.
- Nel catalogo, la sezione componenti di una variante compare solo se la variante contiene almeno un componente.
- Nel flusso listino singolo il set di rivestimenti selezionato è condiviso tra tutte le varianti del prodotto; i metri vengono invece configurati variante per variante.
- Il pulsante `Continua` nel dialog rivestimenti resta disabilitato finché tutte le varianti del prodotto non hanno almeno un rivestimento selezionato.
- Se si prova a proseguire senza alcun rivestimento con metri validi, la pagina mostra l'errore `Specifica i metri per almeno un rivestimento`.
- Nel multi listino un prodotto risulta selezionabile solo se ha almeno una variante, ha un ricarico salvato e dispone di rivestimenti salvati per ogni variante.
- Nel multi listino la colonna `Stato` segnala se il prodotto è disponibile oppure il motivo per cui non è selezionabile.
- Nel multi listino la colonna `Prezzo` usa il prezzo della prima variante disponibile del prodotto.
- I dialog `Configurazione Listino` e `Configura Rivestimenti per Varianti` non si chiudono tramite click esterno; la chiusura avviene tramite i pulsanti previsti dal flusso.
- La rimozione di un componente da una variante produce un messaggio che specifica che la modifica non è ancora salvata.
- La rimozione di un'immagine non elimina subito il file definitivo: l'eliminazione viene eseguita durante il salvataggio del prodotto.
- Il salvataggio del prodotto viene disabilitato mentre è in corso l'operazione di salvataggio oppure se manca il nome prodotto.

### Note operative
- Le lingue selezionabili per i PDF sono: Italiano, English, Français, Deutsch, Español, Português.
- Per il listino singolo il logo della copertina può essere scelto tra `SofaForm` e `Convertible Contemporains`.
- Nella pagina non è presente un controllo visibile per creare una nuova variante dal dialog di modifica prodotto; qui sono documentate solo le azioni chiaramente raggiungibili dall'interfaccia.
- L'azione di eliminazione variante è visibile nella tabella varianti; dal codice della pagina il comportamento certo è la rimozione della variante dall'elenco in modifica, da confermare poi con il salvataggio del prodotto.

## Aggiungi Prodotto

### Descrizione generale
La pagina `Aggiungi Prodotto` viene usata per inserire un nuovo divano nel gestionale attraverso un flusso guidato a step. Il percorso accompagna l'utente nella compilazione dei dati anagrafici del prodotto, nella definizione delle varianti e nell'associazione dei componenti che determinano il prezzo delle varianti in modalità `Componenti`.

### Elementi presenti nella pagina
- Titolo pagina `Aggiungi Nuovo Prodotto`.
- Stepper a 3 passaggi:
- `Informazioni Prodotto`;
- `Varianti`;
- `Componenti`.
- Overlay di salvataggio con spinner e messaggio `Non chiudere la pagina`.
- Pulsanti di navigazione `Avanti` e `Indietro`.
- Pulsante finale `Salva Prodotto`.
- Dialog dedicati per i campi tecnici `Seduta`, `Schienale`, `Meccanica`, `Materasso`.
- Dialog di conferma per l'eliminazione delle varianti.
- Toast informativi e di errore.

### Funzionalità disponibili
#### Compilazione delle informazioni prodotto
Nel primo step l'utente inserisce il nome del prodotto, una descrizione generale e un set di informazioni tecniche opzionali. Il nome prodotto è obbligatorio per proseguire.

Le informazioni tecniche opzionali non sono compilate direttamente nella form principale: ogni voce viene gestita con un pulsante dedicato. Se il campo è vuoto, il pulsante apre un dialog di inserimento. Se il campo è già valorizzato, lo stesso pulsante mostra l'icona di eliminazione e cancella subito il contenuto.

#### Caricamento e ordinamento immagini
Nel primo step è possibile selezionare fino a 3 immagini. Le immagini vengono caricate subito dopo la selezione. Se il caricamento è in corso, l'utente non può avanzare allo step successivo.

Dopo il caricamento viene mostrata una griglia di anteprime. Le immagini possono essere riordinate trascinandole; la prima immagine dell'elenco diventa l'immagine principale del prodotto. In questa pagina la rimozione avviene in blocco: il pulsante disponibile elimina tutte le immagini caricate nella bozza corrente.

#### Creazione e modifica delle varianti
Nel secondo step l'utente definisce le varianti del prodotto. Ogni variante ha:
- una tipologia;
- eventuali misure;
- una modalità di prezzo.

Le modalità di prezzo disponibili sono:
- `Componenti`, in cui il prezzo verrà calcolato dai componenti associati;
- `Custom`, in cui il prezzo viene inserito manualmente.

La tipologia della variante può essere una delle tipologie predefinite oppure `Custom`. Se la tipologia è `Custom`, diventa obbligatorio compilare un nome libero per la variante. Se la modalità di prezzo è `Custom`, diventa obbligatorio inserire un prezzo maggiore di zero.

Le varianti aggiunte vengono mostrate in tabella con nome, modalità di prezzo, prezzo corrente, numero posti e azioni di modifica/eliminazione. Per le varianti in modalità `Componenti` prive di componenti compare l'indicazione `da configurare`.

#### Configurazione componenti per variante
Nel terzo step l'utente seleziona una variante e ne configura i componenti. Se la variante selezionata usa la modalità `Custom`, la pagina mostra solo un messaggio informativo e non espone i controlli di composizione.

Se la variante usa la modalità `Componenti`, la pagina mostra un pannello di selezione con i componenti disponibili per tipologia. I controlli comprendono selezioni singole, selezioni multiple e quantità per i `Piedini`.

Il pulsante `Applica componenti` non aggiunge componenti in modo incrementale: sostituisce l'insieme dei componenti della variante selezionata con la configurazione corrente dei controlli. Dopo l'applicazione, il prezzo della variante viene ricalcolato automaticamente.

Sotto ai selettori viene mostrata una tabella riepilogativa dei componenti applicati alla variante selezionata, con raggruppamento per componente e quantità. Il totale finale della variante è mostrato nel footer della tabella.

#### Rimozione dei componenti da una variante
Nella tabella dei componenti applicati l'icona cestino rimuove il componente dalla variante selezionata. La rimozione agisce sull'intero gruppo del componente, quindi elimina tutte le occorrenze di quel componente all'interno della variante e aggiorna il prezzo.

#### Salvataggio finale del prodotto
Con `Salva Prodotto` la pagina crea il prodotto, associa definitivamente le immagini caricate, crea le varianti e collega le varianti al prodotto. Durante questa fase l'interfaccia viene disabilitata da un overlay di salvataggio.

Al termine del salvataggio la bozza locale viene cancellata e l'applicazione esce dalla pagina di inserimento. Con il routing attualmente presente nel progetto, questo flusso ricade poi sulla schermata iniziale del catalogo.

#### Bozza automatica locale
Durante la compilazione la pagina salva automaticamente una bozza locale dei dati inseriti. La bozza include lo step corrente, i dati prodotto, le varianti e le selezioni componenti. In caso di riapertura della pagina, il sistema prova a ripristinare la bozza salvata. Dopo il salvataggio finale la bozza viene rimossa.

### Campi, filtri e controlli
#### Step 1 - Informazioni Prodotto
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Nome Prodotto | Testo | Nome del prodotto da creare. | Sì | Se manca, il passaggio allo step successivo viene bloccato con errore. |
| Immagini prodotto | Upload immagini | Seleziona le immagini del prodotto. | No | Accetta solo immagini, massimo 3 file, massimo 5 MB per file. |
| Descrizione | Textarea | Descrizione generale del prodotto. | No | Campo libero multilinea. |
| Seduta | Dialog con textarea | Descrizione tecnica della seduta. | No | Il contenuto viene inserito tramite dialog dedicato. |
| Schienale | Dialog con textarea | Descrizione tecnica dello schienale. | No | Il contenuto viene inserito tramite dialog dedicato. |
| Meccanica | Dialog con textarea | Descrizione tecnica della meccanica. | No | Il contenuto viene inserito tramite dialog dedicato. |
| Materasso | Dialog con textarea | Descrizione tecnica del materasso. | No | Il contenuto viene inserito tramite dialog dedicato. |

#### Step 2 - Varianti
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Modalità prezzo | Select button | Seleziona come valorizzare il prezzo della variante. | Sì | Opzioni: `Componenti`, `Custom`. |
| Nome Variante | Dropdown | Seleziona la tipologia della variante. | Sì | Valori previsti: Divano 3 PL Maxi, Divano 3 PL, Divano 2 PL, Chaise Longue, Pouf 50 x 50, Pouf 60 x 60, Pouf 70 x 70, Elemento senza bracciolo, Elemento con bracciolo, Poltrona 90 cm, Poltrona 80 cm, Poltrona 70 cm, Custom. |
| Numero Posti | Numero | Numero posti della variante. | No | Campo numerico libero; nella tabella può comparire `N/A` se non valorizzato. |
| Larghezza (cm) | Numero | Larghezza della variante. | No | Misura facoltativa. |
| Profondità chiuso (cm) | Numero | Profondità da chiuso. | No | Misura facoltativa. |
| Profondità aperto (cm) | Numero | Profondità da aperto. | No | Misura facoltativa. |
| Altezza (cm) | Numero | Altezza della variante. | No | Misura facoltativa. |
| Nome Custom | Testo | Nome libero della variante quando la tipologia è `Custom`. | Sì, solo se tipologia `Custom` | Se manca, il pulsante `Aggiungi` o `Aggiorna` resta disabilitato e viene mostrato errore. |
| Prezzo Custom | Valuta | Prezzo manuale della variante quando la modalità è `Custom`. | Sì, solo se modalità `Custom` | Minimo `0,01`. |
| Aggiungi/Aggiorna variante | Pulsante | Inserisce una nuova variante o aggiorna quella in modifica. | Sì | L'etichetta cambia in `Aggiorna` durante la modifica. |
| Tabella varianti | Tabella paginata | Elenca le varianti inserite. | No | Mostra 5 righe per pagina. |

#### Step 3 - Componenti
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Scegli una variante | Dropdown | Seleziona la variante da configurare nello step componenti. | Sì | Se la variante è in modalità `Custom`, i controlli di composizione non vengono mostrati. |
| Fusto | Dropdown con filtro | Seleziona un componente di tipo fusto. | No | Disabilitato se non esistono componenti di questo tipo. |
| Gomma | Dropdown con filtro | Seleziona un componente di tipo gomma. | No | Disabilitato se non esistono componenti di questo tipo. |
| Rete | Dropdown con filtro | Seleziona un componente di tipo rete. | No | Disabilitato se non esistono componenti di questo tipo. |
| Piedini | Dropdown con filtro | Seleziona il componente piedini. | No | La quantità viene gestita da un controllo separato. |
| Quantità Piedini | Dropdown | Imposta il numero di occorrenze del componente piedini. | No | Valori disponibili: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16. |
| Materasso | Dropdown con filtro | Seleziona un componente di tipo materasso. | No | Disabilitato se non esistono componenti di questo tipo. |
| Ferro Schienale | Dropdown con filtro | Seleziona un componente di tipo ferro schienale. | No | Disabilitato se non esistono componenti di questo tipo. |
| Tappezzeria | Multi-select con filtro | Seleziona uno o più componenti di tipo tappezzeria. | No | Selettore multiplo. |
| Imbottitura Cuscinetti | Multi-select con filtro | Seleziona uno o più componenti di tipo imbottitura cuscinetti. | No | Selettore multiplo. |
| Ferramenta | Multi-select con filtro | Seleziona uno o più componenti di tipo ferramenta. | No | Selettore multiplo. |
| Imballo | Dropdown con filtro | Seleziona un componente di tipo imballo. | No | Disabilitato se non esistono componenti di questo tipo. |
| Scatola | Dropdown con filtro | Seleziona un componente di tipo scatola. | No | Disabilitato se non esistono componenti di questo tipo. |
| Tela Marchiata | Dropdown con filtro | Seleziona un componente di tipo tela marchiata. | No | Disabilitato se non esistono componenti di questo tipo. |
| Trasporto | Dropdown con filtro | Seleziona un componente di tipo trasporto. | No | Disabilitato se non esistono componenti di questo tipo. |
| Varie | Multi-select con filtro | Seleziona uno o più componenti extra. | No | Selettore multiplo. |
| Applica componenti | Pulsante | Applica la configurazione corrente alla variante selezionata. | Sì, per registrare la configurazione | Disponibile solo se almeno un componente è selezionato nei controlli. |
| Tabella componenti applicati | Tabella | Mostra i componenti già assegnati alla variante selezionata. | No | Include nome, tipo, prezzo, quantità e totale variante. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Avanzare nello stepper | Clicca `Avanti`. | La pagina passa allo step successivo solo se i controlli minimi dello step corrente sono soddisfatti. |
| Tornare allo step precedente | Clicca `Indietro`. | La pagina torna allo step precedente mantenendo i dati già inseriti. |
| Selezionare immagini | Carica fino a 3 file immagine nel primo step. | Le immagini vengono caricate subito e mostrate in anteprima. |
| Riordinare immagini | Trascina le anteprime nella griglia immagini. | L'ordine viene aggiornato; la prima immagine diventa quella principale. |
| Rimuovere tutte le immagini | Clicca sul pulsante con `x` nell'area immagini. | Tutte le immagini caricate nella bozza corrente vengono eliminate. |
| Inserire una descrizione tecnica | Clicca su `Seduta`, `Schienale`, `Meccanica` o `Materasso` quando il campo è vuoto. | Si apre il dialog di compilazione del testo relativo a quella voce. |
| Eliminare una descrizione tecnica | Clicca sullo stesso pulsante quando il campo è già valorizzato. | Il contenuto viene cancellato immediatamente. |
| Aggiungere una variante | Compila i campi variante e clicca `Aggiungi`. | La variante viene inserita nella tabella varianti. |
| Modificare una variante | Clicca sulla matita nella tabella varianti. | I dati della variante tornano nel form e il pulsante diventa `Aggiorna`. |
| Eliminare una variante | Clicca sul cestino nella tabella varianti e conferma. | La variante viene rimossa dall'elenco. |
| Selezionare una variante per i componenti | Scegli una variante nel dropdown dello step 3. | La pagina mostra o aggiorna i controlli di composizione per quella variante. |
| Applicare componenti | Seleziona uno o più componenti e clicca `Applica componenti`. | La configurazione della variante selezionata viene sostituita con i componenti correnti e il prezzo viene ricalcolato. |
| Rimuovere un gruppo di componenti | Clicca sul cestino nella tabella componenti applicati. | Tutte le occorrenze di quel componente vengono rimosse dalla variante selezionata. |
| Salvare il prodotto | Clicca `Salva Prodotto`. | Il prodotto viene creato, le varianti vengono salvate e la pagina esce dal flusso di inserimento. |

### Comportamenti e regole
- Lo stepper è in sola lettura: non risulta cliccabile direttamente e l'avanzamento avviene tramite `Avanti` e `Indietro`.
- Nel primo step il nome prodotto è obbligatorio per proseguire.
- Nel primo step, se il caricamento immagini è ancora in corso, la pagina blocca l'avanzamento e mostra il messaggio `Attendere il completamento del caricamento dell'immagine`.
- Quando l'utente seleziona più di 3 immagini, la pagina considera solo le prime 3.
- Dopo il primo caricamento immagini non è presente un controllo per aggiungere immagini in modo incrementale: per cambiare il set occorre rimuovere quello corrente e selezionare di nuovo i file.
- I dialog `Seduta`, `Schienale`, `Meccanica` e `Materasso` hanno solo il pulsante `Salva`; non espongono un pulsante `Annulla`.
- Nel secondo step deve essere presente almeno una variante per proseguire.
- La tipologia `Custom` e la modalità di prezzo `Custom` sono due scelte distinte: una variante può avere nome standard e prezzo custom, oppure nome custom e prezzo calcolato da componenti.
- Nel secondo step, per la modalità `Custom`, il prezzo deve essere maggiore di zero.
- Nel terzo step, le varianti in modalità `Custom` non richiedono componenti.
- Nel salvataggio finale, ogni variante in modalità `Componenti` deve avere almeno un componente associato; in caso contrario il salvataggio viene bloccato.
- Se per una tipologia componente non esistono voci in archivio, il relativo controllo è disabilitato e mostra il messaggio `Nessun componente di tipo ... disponibile`.
- Il pulsante `Applica componenti` riscrive l'intera composizione della variante selezionata in base ai controlli correnti; non aggiunge soltanto i componenti mancanti.
- Durante il salvataggio viene mostrato un overlay con spinner e il resto della pagina risulta disabilitato.
- In questa vista non è presente un messaggio finale di successo dopo il salvataggio: il flusso termina con il reindirizzamento fuori dalla pagina.

### Note operative
- La pagina salva automaticamente una bozza locale durante la compilazione e prova a ripristinarla quando viene riaperta.
- La bozza viene cancellata dopo il salvataggio finale del prodotto.
- La tabella varianti mostra il prezzo corrente della variante; per le varianti in modalità `Componenti` il valore diventa affidabile solo dopo l'applicazione dei componenti.
- È presente nel componente un dialog `Aggiungi Nuovo Fornitore`, ma nel template della pagina non risulta un controllo visibile che lo apra; per questo non è documentato come funzione operativa della schermata.

## Gestione Componenti

### Descrizione generale
La pagina `Gestione Componenti` serve per creare, modificare, eliminare, consultare ed esportare i componenti usati nelle varianti dei prodotti. La stessa pagina permette anche di creare componenti in blocco e di aggiornare in massa i prezzi dei componenti di uno specifico fornitore, con propagazione del nuovo prezzo alle varianti che usano quei componenti.

### Elementi presenti nella pagina
- Titolo pagina `Gestione Componenti` con sottotitolo descrittivo.
- Tab con tre modalità operative:
- `Singolo`;
- `Multiplo`;
- `Prezzo Listino`.
- Form di creazione/modifica componente singolo.
- Form di creazione multipla componenti.
- Form di aggiornamento prezzi per fornitore.
- Tabella `Lista Componenti` con ricerca globale, selezione multipla, ordinamento, paginazione ed esportazione PDF.
- Dialog personalizzato di conferma eliminazione componente con verifica delle dipendenze.
- Dialog di conferma aggiornamento prezzi.
- Toast informativi e di errore.

### Funzionalità disponibili
#### Gestione componente singolo
Nel tab `Singolo` l'utente può creare un componente oppure modificare un componente esistente. Il form gestisce:
- fornitore;
- tipo componente;
- nome componente;
- tipo divano associato;
- eventuale nome custom del tipo divano;
- prezzo.

Durante la creazione, il nome del componente viene generato automaticamente in base a tipo componente, fornitore e tipo divano. Se l'utente modifica questi campi mentre non è in modalità modifica, il nome viene rigenerato.

Quando si entra in modifica da tabella, il form passa in modalità `Modifica Componente`, il nome non viene più rigenerato automaticamente e compare il pulsante `Annulla`.

#### Creazione multipla componenti
Nel tab `Multiplo` l'utente può creare più componenti in un'unica operazione. Il flusso è diviso in:
- `Dati Comuni`, validi per tutti i componenti da creare;
- elenco `Varianti`, dove ogni riga rappresenta un componente distinto con tipo divano, prezzo e nome.

Ogni riga può avere:
- tipo divano;
- eventuale nome custom, se il tipo divano è `Custom`;
- prezzo;
- nome componente.

Il nome di ogni riga viene generato automaticamente in base ai dati comuni e al tipo divano scelto, ma può essere modificato manualmente. Se però vengono cambiati tipo componente, fornitore o tipo divano, il nome viene aggiornato di nuovo dalla pagina.

Il pulsante `Aggiungi Variante` crea una nuova riga e scorre automaticamente l'elenco verso il fondo. La sezione `Anteprima Componenti` mostra i componenti validi che verranno creati.

#### Aggiornamento prezzi per fornitore
Nel tab `Prezzo Listino` l'utente può selezionare un fornitore e inserire una variazione percentuale. La pagina mostra subito un'anteprima con:
- numero di componenti interessati;
- prezzo attuale;
- nuovo prezzo calcolato;
- differenza per ogni componente.

La percentuale può essere positiva o negativa. Dopo la conferma finale, la pagina aggiorna:
- il prezzo dei componenti del fornitore selezionato;
- il prezzo delle varianti che contengono quei componenti, ma solo se la variante usa il calcolo a componenti.

#### Consultazione e ricerca della lista componenti
Sotto ai tab è sempre disponibile la tabella `Lista Componenti`. La tabella mostra:
- nome;
- prezzo;
- tipo componente;
- tipo divano;
- fornitore.

La ricerca globale filtra i componenti sulla base dei dati visibili in tabella, compresi nome, prezzo, tipo, tipo divano e fornitore. Il titolo della tabella mostra il numero di righe attualmente visibili dopo il filtro.

#### Modifica ed eliminazione dalla tabella
Ogni riga della tabella espone:
- pulsante modifica;
- pulsante eliminazione.

La modifica carica il componente nel form del tab `Singolo` e riporta la pagina in alto.

Per l'eliminazione singola, la pagina controlla prima in quali prodotti il componente viene usato. Se il componente è presente in varianti di prodotti esistenti, il dialog mostra l'elenco dei prodotti coinvolti e avvisa che il componente verrà rimosso da tutti quei prodotti.

#### Eliminazione multipla
La tabella consente la selezione multipla tramite checkbox. Quando almeno un componente è selezionato compare il pulsante `Elimina Selezionati`.

L'eliminazione multipla richiede una conferma unica. In base al codice del servizio utilizzato, ogni componente eliminato viene rimosso anche dalle varianti che lo utilizzano.

#### Esportazione PDF componenti
Il pulsante con icona stampa/esportazione genera un PDF dell'intera lista componenti caricata in tabella. Il documento contiene nome, tipo, fornitore, tipo divano e prezzo dei componenti ordinati per nome.

Se non ci sono componenti da esportare, la pagina mostra un messaggio di avviso e non genera alcun file.

### Campi, filtri e controlli
#### Tab Singolo
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Fornitore | Dropdown | Seleziona il fornitore del componente. | Indicato come sì | Il campo è marcato come obbligatorio nell'interfaccia; nel codice della pagina non emerge un blocco esplicito al salvataggio se lasciato vuoto. |
| Tipo Componente | Dropdown | Seleziona la tipologia del componente. | Indicato come sì | Il campo è marcato come obbligatorio nell'interfaccia; il blocco di validazione esplicito non è coerente come per il tab `Multiplo`. |
| Nome Componente | Testo | Nome del componente. | Sì | Viene auto-generato durante la creazione ma può essere modificato. |
| Tipo Divano | Dropdown | Associa il componente a uno specifico tipo divano. | No | Se vuoto, in tabella il tipo divano appare come `-`. |
| Nome Custom | Testo | Nome libero del tipo divano quando il tipo è `Custom`. | Sì, solo se tipo divano `Custom` | Se manca, il salvataggio viene bloccato. |
| Prezzo | Valuta | Prezzo unitario del componente. | Sì | Non può essere negativo. |
| Aggiungi/Aggiorna | Pulsante | Salva il componente. | Sì | L'etichetta cambia in base alla modalità. |
| Annulla | Pulsante | Esce dalla modalità modifica. | No | Visibile solo durante la modifica di un componente esistente. |

#### Tab Multiplo
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Tipo di componente | Dropdown | Tipologia comune dei componenti da creare. | Sì | Se manca, il salvataggio multiplo viene bloccato. |
| Fornitore | Dropdown | Fornitore comune dei componenti da creare. | Sì | Se manca, il salvataggio multiplo viene bloccato. |
| Tipo Divano variante | Dropdown | Tipo divano della singola riga del blocco. | Sì | Ogni riga valida deve averlo. |
| Prezzo variante | Valuta | Prezzo della singola riga del blocco. | Sì | Non può essere negativo. |
| Nome Custom variante | Testo | Nome libero del tipo divano quando la riga usa `Custom`. | Sì, solo per tipo divano `Custom` | Se manca, il salvataggio viene bloccato. |
| Nome Componente variante | Testo | Nome del componente della singola riga. | Sì | Deve essere valorizzato, univoco all'interno del blocco e non già esistente. |
| Aggiungi Variante | Pulsante | Aggiunge una nuova riga variante nel blocco multiplo. | No | La nuova riga viene creata con nome iniziale auto-generato. |
| Salva Componenti | Pulsante | Crea tutti i componenti validi del blocco. | Sì | Dopo il salvataggio riuscito la pagina torna al tab `Singolo`. |
| Reset | Pulsante | Reimposta i dati del tab `Multiplo`. | No | Svuota i dati comuni e riporta il blocco a una sola riga vuota. |

#### Tab Prezzo Listino
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Fornitore | Dropdown | Seleziona il fornitore da usare per l'aggiornamento prezzi. | Sì | Senza fornitore non è possibile confermare l'aggiornamento. |
| Variazione Percentuale | Numero percentuale | Percentuale da applicare ai prezzi dei componenti del fornitore selezionato. | Sì | Minimo `-100`, massimo `1000`. |
| Anteprima modifiche | Tabella | Mostra prezzi attuali, nuovi prezzi e differenze. | No | Compare solo quando fornitore e percentuale sono valorizzati. |
| Applica Modifiche | Pulsante | Avvia la conferma dell'aggiornamento prezzi. | Sì | Visibile solo se ci sono componenti del fornitore selezionato. |
| Reset | Pulsante | Pulisce fornitore, percentuale e anteprima. | No | Disponibile nella sezione di aggiornamento prezzi. |

#### Lista Componenti
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Ricerca componenti | Testo | Filtra globalmente la tabella componenti. | No | Il filtro considera nome, prezzo, tipo, tipo divano e fornitore. |
| Checkbox selezione riga | Checkbox | Seleziona un componente per l'eliminazione multipla. | No | Compare anche la checkbox di intestazione per la selezione massiva. |
| Elimina Selezionati | Pulsante | Elimina tutti i componenti attualmente selezionati. | No | Compare solo se esiste almeno una selezione. |
| Esporta componenti | Pulsante icona | Genera il PDF della lista componenti. | No | Usa l'intero elenco presente nella tabella caricata. |
| Colonne ordinabili | Ordinamento tabella | Riordina la lista per nome, prezzo, tipo, tipo divano e fornitore. | No | Ordinamento disponibile dalle intestazioni colonna. |
| Paginazione | Tabella | Divide la lista componenti in pagine. | No | 10 righe per pagina. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Creare un componente singolo | Compila il tab `Singolo` e clicca `Aggiungi`. | Il componente viene salvato e la lista viene ricaricata. |
| Modificare un componente | Clicca sulla matita nella tabella. | Il componente viene caricato nel form `Singolo` in modalità modifica. |
| Annullare la modifica | Clicca `Annulla` nel tab `Singolo`. | Il form viene ripristinato alla modalità di inserimento. |
| Creare più componenti insieme | Compila il tab `Multiplo` e clicca `Salva Componenti`. | Vengono creati tutti i componenti validi del blocco e la pagina torna al tab `Singolo`. |
| Aggiungere una riga nel blocco multiplo | Clicca `Aggiungi Variante`. | Viene aggiunta una nuova riga configurabile nel blocco multiplo. |
| Rimuovere una riga del blocco multiplo | Clicca il cestino della riga variante. | La riga viene eliminata, purché ne resti almeno una. |
| Simulare aggiornamento prezzi | Seleziona fornitore e percentuale nel tab `Prezzo Listino`. | La pagina mostra subito l'anteprima delle variazioni. |
| Confermare aggiornamento prezzi | Clicca `Applica Modifiche` e poi `Conferma`. | I prezzi dei componenti del fornitore vengono aggiornati e le varianti collegate vengono riallineate. |
| Cercare nella lista componenti | Inserisce testo nel campo `Cerca Componenti`. | La tabella mostra solo le righe corrispondenti al filtro globale. |
| Eliminare un componente | Clicca il cestino sulla riga e conferma nel dialog. | Il componente viene eliminato; se era usato, viene rimosso anche dalle varianti che lo contenevano. |
| Eliminare più componenti | Seleziona più righe e clicca `Elimina Selezionati`. | I componenti selezionati vengono eliminati dopo conferma. |
| Esportare la lista componenti | Clicca l'icona di esportazione PDF. | Viene scaricato un PDF con la lista componenti. |

### Comportamenti e regole
- La pagina carica componenti e fornitori all'apertura e mostra un messaggio di caricamento finché i dati non sono disponibili.
- Cambiare tab reimposta i form di `Singolo` e `Multiplo`; il tab `Prezzo Listino` non esegue un reset automatico all'apertura.
- Nel tab `Singolo`, se il tipo divano è `Custom`, il campo `Nome Custom` diventa visibile e obbligatorio.
- Nel tab `Singolo`, il prezzo non può essere negativo.
- Nel tab `Singolo`, non è possibile salvare un componente se esiste già un altro componente con lo stesso nome e lo stesso tipo divano.
- Nel tab `Multiplo`, il salvataggio viene bloccato se manca il tipo componente, manca il fornitore o non esiste almeno una riga valida.
- Nel tab `Multiplo`, non è possibile salvare due righe con lo stesso nome componente.
- Nel tab `Multiplo`, non è possibile salvare un nome componente che esiste già nell'archivio componenti.
- Nel tab `Prezzo Listino`, una percentuale positiva aumenta i prezzi; una percentuale negativa li riduce.
- Nel tab `Prezzo Listino`, l'aggiornamento può essere applicato solo se esiste almeno un componente per il fornitore selezionato.
- L'aggiornamento prezzi agisce anche sulle varianti che contengono i componenti modificati, ma solo per le varianti in modalità prezzo `Componenti`.
- L'eliminazione singola mostra l'elenco dei prodotti coinvolti se il componente è usato in varianti esistenti.
- L'eliminazione multipla usa una conferma unica e non mostra l'elenco delle dipendenze riga per riga.
- Se la lista componenti è vuota, l'esportazione PDF viene bloccata con un messaggio `Non ci sono componenti da esportare`.

### Note operative
- Il nome del componente viene proposto automaticamente, ma non è bloccato: l'utente può modificarlo manualmente.
- Nel tab `Singolo`, durante la modifica di un componente esistente il nome non viene rigenerato automaticamente quando cambiano i campi collegati.
- Nel tab `Multiplo`, i nomi delle righe possono essere sovrascritti dagli aggiornamenti automatici se l'utente cambia tipo componente, fornitore o tipo divano dopo una modifica manuale del nome.
- Nel codice della pagina esistono riferimenti a funzioni per `multiple misure`, ma nel template attuale non risultano controlli visibili che le espongano; per questo non sono documentate come funzioni operative della schermata.

## Gestione Fornitori

### Descrizione generale
La pagina `Gestione Fornitori` serve per creare, modificare, consultare e rimuovere i fornitori associati ai componenti del catalogo. Viene usata per mantenere aggiornato l'elenco dei fornitori e per verificare, prima dell'eliminazione, se un fornitore è ancora collegato a componenti esistenti.

### Elementi presenti nella pagina
- Titolo pagina `Gestione Fornitori` con sottotitolo descrittivo.
- Form di inserimento o modifica fornitore.
- Campo `Nome`.
- Campo `Contatto`.
- Pulsante principale `Aggiungi` o `Aggiorna`.
- Pulsante `Annulla` visibile solo in modifica.
- Sezione `Lista Fornitori`.
- Tabella fornitori con ricerca globale, paginazione e azioni per riga.
- Stato di caricamento con spinner e messaggio `Caricamento fornitori...`.
- Dialog `Conferma Eliminazione` con controllo dipendenze sui componenti collegati.
- Toast di conferma ed errore.

### Funzionalità disponibili
#### Inserimento di un nuovo fornitore
Nella parte alta della pagina l'utente può inserire un nuovo fornitore compilando il nome e, facoltativamente, un contatto. Il nome è obbligatorio e deve essere univoco rispetto agli altri fornitori già presenti.

#### Modifica di un fornitore esistente
Il pulsante con matita nella tabella carica il fornitore nel form superiore e attiva la modalità `Modifica Fornitore`. In questa modalità:
- il titolo del form cambia;
- il pulsante principale diventa `Aggiorna`;
- compare il pulsante `Annulla`.

Quando si avvia la modifica, la pagina scorre automaticamente verso l'alto e porta il cursore nel campo nome.

#### Consultazione e ricerca dei fornitori
La sezione `Lista Fornitori` mostra tutti i fornitori caricati con:
- nome;
- contatto;
- azioni disponibili.

Il campo `Cerca fornitore...` filtra la tabella sui campi nome e contatto. Se non esistono record corrispondenti, la tabella mostra il messaggio `Nessun fornitore trovato`.

#### Eliminazione del fornitore
Il pulsante con cestino avvia un controllo preliminare sui componenti associati al fornitore selezionato.

Se il fornitore ha componenti collegati, la pagina apre un dialog che mostra:
- l'elenco dei componenti forniti;
- un avviso che informa che, procedendo, tutti quei componenti verranno eliminati.

Se il fornitore non ha componenti collegati, il codice della pagina esegue direttamente la cancellazione dopo il controllo, senza una conferma finale aggiuntiva.

#### Effetti dell'eliminazione sui componenti collegati
Quando l'utente conferma l'eliminazione di un fornitore che ha componenti associati, la pagina elimina prima tutti i componenti di quel fornitore e poi elimina il fornitore stesso.

In base al servizio utilizzato, la rimozione dei componenti comporta anche la loro rimozione dalle varianti che li contengono, con aggiornamento del prezzo delle varianti non in modalità `Custom`.

### Campi, filtri e controlli
#### Form fornitore
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Nome | Testo | Nome del fornitore. | Sì | Deve essere univoco; il controllo usa confronto senza distinzione tra maiuscole e minuscole. |
| Contatto | Testo | Riferimento libero del fornitore. | No | Se non compilato, in tabella viene mostrato `ND`. |
| Aggiungi/Aggiorna | Pulsante | Salva il nuovo fornitore o le modifiche a quello selezionato. | Sì | L'etichetta cambia in base alla modalità del form. |
| Annulla | Pulsante | Esce dalla modifica e ripristina il form vuoto. | No | Visibile solo durante la modifica di un fornitore esistente. |

#### Lista Fornitori
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Cerca fornitore | Testo | Filtra globalmente la tabella fornitori. | No | Il filtro considera `Nome` e `Contatto`. |
| Tabella fornitori | Tabella paginata | Mostra i fornitori caricati. | No | 10 righe per pagina. |
| Modifica fornitore | Pulsante icona | Carica il record nel form superiore. | No | Riporta la pagina in alto. |
| Elimina fornitore | Pulsante icona | Avvia il controllo dipendenze e la procedura di eliminazione. | No | Può aprire il dialog di conferma se esistono componenti collegati. |

#### Dialog di eliminazione
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Elenco componenti collegati | Lista | Mostra i componenti attualmente associati al fornitore. | No | Compare solo se il fornitore ha dipendenze. |
| Pulsante `No` | Pulsante | Annulla l'eliminazione. | No | Chiude il dialog e azzera la selezione corrente. |
| Pulsante `Sì` | Pulsante | Conferma l'eliminazione del fornitore e dei suoi componenti collegati. | Sì, per procedere | Disabilitato mentre è in corso il caricamento delle dipendenze. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Creare un fornitore | Compila il form e clicca `Aggiungi`. | Il fornitore viene salvato e la tabella viene aggiornata. |
| Modificare un fornitore | Clicca sulla matita nella tabella. | Il record viene caricato nel form in modalità modifica. |
| Aggiornare un fornitore | Modifica i dati nel form e clicca `Aggiorna`. | Il fornitore viene aggiornato e il form torna in modalità inserimento. |
| Annullare la modifica | Clicca `Annulla` nel form. | La modalità modifica viene chiusa e il form viene svuotato. |
| Cercare un fornitore | Inserisce testo nel campo `Cerca fornitore...`. | La tabella mostra solo i record corrispondenti. |
| Eliminare un fornitore senza componenti collegati | Clicca il cestino sulla riga. | Dopo il controllo automatico il fornitore viene eliminato direttamente. |
| Eliminare un fornitore con componenti collegati | Clicca il cestino sulla riga e poi `Sì` nel dialog. | Vengono eliminati i componenti collegati e poi il fornitore. |
| Annullare l'eliminazione | Clicca `No` nel dialog di conferma. | La procedura viene interrotta senza modifiche. |

### Comportamenti e regole
- La pagina è accessibile agli utenti autenticati.
- All'apertura la pagina carica l'elenco dei fornitori e mostra uno stato di caricamento fino al termine dell'operazione.
- Il nome del fornitore è obbligatorio.
- Non è possibile salvare due fornitori con lo stesso nome, anche se scritto con maiuscole o minuscole diverse.
- Il contatto è facoltativo.
- Dopo il salvataggio o l'aggiornamento riuscito, il form viene azzerato.
- In modifica, se il fornitore aggiornato è collegato a componenti o varianti, il servizio aggiorna anche i riferimenti al fornitore presenti in quei dati.
- Se il controllo dipendenze non riesce, la pagina mostra un errore e interrompe la procedura di eliminazione.
- Se il fornitore ha componenti collegati, il dialog di eliminazione mostra solo i nomi dei componenti, non l'elenco dei prodotti o delle varianti coinvolte.
- Durante il caricamento delle dipendenze il pulsante di conferma nel dialog resta disabilitato.

### Note operative
- La pagina non prevede campi strutturati separati per email, telefono o indirizzo: il contatto è un campo testuale unico.
- Se il fornitore non ha componenti associati, l'eliminazione non richiede una conferma finale esplicita dopo il controllo automatico.
- L'eliminazione di un fornitore con componenti associati ha un impatto più ampio della sola anagrafica: vengono rimossi anche i componenti collegati e i riferimenti nelle varianti che li usano.

## Gestione Tessuti

### Descrizione generale
La pagina `Gestione Tessuti` serve per creare, modificare, consultare ed eliminare i tessuti o rivestimenti usati nel gestionale. Viene utilizzata per mantenere aggiornato il catalogo dei tessuti e il relativo prezzo al metro, che viene poi richiamato nei flussi di configurazione e generazione listino.

### Elementi presenti nella pagina
- Titolo pagina `Gestione Tessuti` con sottotitolo descrittivo.
- Form di inserimento o modifica tessuto.
- Campo `Nome Tessuto`.
- Campo `Prezzo al Metro`.
- Pulsante principale `Aggiungi` o `Aggiorna`.
- Pulsante `Annulla` visibile solo in modifica.
- Sezione `Lista Tessuti`.
- Tabella tessuti con ricerca globale, paginazione e azioni per riga.
- Stato di caricamento con spinner e messaggio `Caricamento tessuti...`.
- Dialog `Conferma Eliminazione`.
- Toast di conferma ed errore.

### Funzionalità disponibili
#### Inserimento di un nuovo tessuto
Nella parte alta della pagina l'utente può creare un nuovo tessuto indicando nome e prezzo al metro. Entrambi i campi sono obbligatori.

Il nome deve essere univoco rispetto agli altri tessuti già presenti. Il prezzo al metro deve essere maggiore di zero.

#### Modifica di un tessuto esistente
Il pulsante con matita nella tabella carica il tessuto nel form superiore e attiva la modalità `Modifica Tessuto`. In questa modalità:
- il titolo del form cambia;
- il pulsante principale diventa `Aggiorna`;
- compare il pulsante `Annulla`.

Quando si entra in modifica, la pagina scorre automaticamente verso l'alto e porta il cursore nel campo nome.

#### Consultazione e ricerca dei tessuti
La sezione `Lista Tessuti` mostra l'elenco dei tessuti caricati con:
- nome;
- prezzo al metro;
- azioni disponibili.

Il campo `Cerca tessuto...` filtra la tabella sui campi nome e prezzo al metro. Se non ci sono risultati, la tabella mostra il messaggio `Nessun tessuto trovato`.

#### Eliminazione del tessuto
Il pulsante con cestino apre un dialog di conferma semplice. Se l'utente conferma, il tessuto viene eliminato.

Nel codice della pagina non emerge un controllo preventivo sulle eventuali dipendenze del tessuto prima della cancellazione.

### Campi, filtri e controlli
#### Form tessuto
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Nome Tessuto | Testo | Nome del tessuto o rivestimento. | Sì | Deve essere univoco; il controllo usa confronto senza distinzione tra maiuscole e minuscole. |
| Prezzo al Metro | Valuta | Prezzo unitario al metro del tessuto. | Sì | Campo in Euro con 2 decimali; deve essere maggiore di `0`. |
| Aggiungi/Aggiorna | Pulsante | Salva il nuovo tessuto o le modifiche a quello selezionato. | Sì | L'etichetta cambia in base alla modalità del form. |
| Annulla | Pulsante | Esce dalla modifica e ripristina il form vuoto. | No | Visibile solo durante la modifica di un tessuto esistente. |

#### Lista Tessuti
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Cerca tessuto | Testo | Filtra globalmente la tabella tessuti. | No | Il filtro considera `Nome` e `Prezzo al Metro`. |
| Tabella tessuti | Tabella paginata | Mostra i tessuti caricati. | No | 10 righe per pagina. |
| Modifica tessuto | Pulsante icona | Carica il record nel form superiore. | No | Riporta la pagina in alto. |
| Elimina tessuto | Pulsante icona | Apre il dialog di conferma eliminazione. | No | Non sono mostrati controlli di dipendenze nella schermata. |

#### Dialog di eliminazione
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Pulsante `No` | Pulsante | Annulla l'eliminazione. | No | Chiude il dialog senza modifiche. |
| Pulsante `Sì` | Pulsante | Conferma l'eliminazione del tessuto. | Sì, per procedere | Esegue la cancellazione del record selezionato. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Creare un tessuto | Compila il form e clicca `Aggiungi`. | Il tessuto viene salvato e la tabella viene aggiornata. |
| Modificare un tessuto | Clicca sulla matita nella tabella. | Il record viene caricato nel form in modalità modifica. |
| Aggiornare un tessuto | Modifica i dati nel form e clicca `Aggiorna`. | Il tessuto viene aggiornato e il form torna in modalità inserimento. |
| Annullare la modifica | Clicca `Annulla` nel form. | La modalità modifica viene chiusa e il form viene svuotato. |
| Cercare un tessuto | Inserisce testo nel campo `Cerca tessuto...`. | La tabella mostra solo i record corrispondenti. |
| Eliminare un tessuto | Clicca il cestino sulla riga e poi `Sì` nel dialog. | Il tessuto viene eliminato e l'elenco viene ricaricato. |
| Annullare l'eliminazione | Clicca `No` nel dialog di conferma. | La procedura viene interrotta senza modifiche. |

### Comportamenti e regole
- La pagina è accessibile agli utenti autenticati.
- All'apertura la pagina carica l'elenco dei tessuti e mostra uno stato di caricamento fino al termine dell'operazione.
- Il nome del tessuto è obbligatorio.
- Il prezzo al metro è obbligatorio e deve essere maggiore di zero.
- Non è possibile salvare due tessuti con lo stesso nome, anche se scritto con maiuscole o minuscole diverse.
- Dopo il salvataggio o l'aggiornamento riuscito, il form viene azzerato.
- Se viene eliminato un tessuto che è attualmente aperto in modifica, il form viene ripristinato automaticamente.
- In caso di errore durante caricamento, salvataggio o eliminazione, la pagina mostra un messaggio di errore tramite toast.
- La tabella mostra il totale dei tessuti caricati nel titolo `Tessuti (...)`.

### Note operative
- La pagina gestisce solo nome e prezzo al metro del tessuto; non risultano campi per categoria, colore, composizione o disponibilità.
- L'eliminazione mostra solo una conferma generica e non espone all'utente eventuali collegamenti del tessuto con prodotti o varianti.
- Il prezzo viene inserito come importo in Euro con due decimali.

## Gestione Utenti

### Descrizione generale
La pagina `Gestione Utenti` serve per consultare gli account del sistema, creare nuovi utenti, modificare il ruolo degli account esistenti ed eliminarli. È accessibile solo agli utenti con ruolo `Manager` o `Fondatore`.

### Elementi presenti nella pagina
- Titolo pagina `Gestione Utenti` con sottotitolo descrittivo.
- Stato di caricamento con spinner e messaggio `Caricamento utenti...`.
- Card `Utenti`.
- Pulsante `Aggiungi Utente`.
- Tabella utenti con email, nome, ruolo e azioni.
- Badge ruolo con stile differenziato per `Fondatore`, `Manager` e `Operatore`.
- Evidenza grafica dell'utente attualmente connesso.
- Dropdown per cambio ruolo, visibile solo sugli utenti gestibili.
- Pulsante eliminazione account.
- Dialog `Aggiungi Nuovo Utente`.
- Dialog di conferma per cambio ruolo ed eliminazione.
- Toast di conferma ed errore.

### Funzionalità disponibili
#### Consultazione dell'elenco utenti
La tabella mostra gli utenti ordinati per ruolo e poi per email. L'ordine applicato è:
- `Fondatore`;
- `Manager`;
- `Operatore`.

Per ogni riga vengono mostrati:
- email;
- nome visualizzato;
- ruolo;
- azioni disponibili.

Se il nome non è valorizzato, la pagina mostra `N/D`.

L'utente attualmente autenticato viene evidenziato nella tabella e contrassegnato con un'icona dedicata.

#### Creazione di un nuovo utente
Il pulsante `Aggiungi Utente` apre un dialog con i campi:
- email;
- password;
- nome opzionale;
- ruolo.

La password deve avere almeno 6 caratteri. Il pulsante `Salva` resta disabilitato finché email e password minima non sono valorizzate.

Il ruolo selezionabile dipende da chi sta creando l'account:
- un `Fondatore` può creare account `Fondatore`, `Manager` o `Operatore`;
- un `Manager` può creare solo account `Operatore`.

Dal codice del servizio emerge che la creazione del nuovo utente non interrompe la sessione dell'utente che sta operando nella pagina.

#### Cambio ruolo utente
Per gli utenti gestibili compare un menu a tendina nella colonna azioni. Da qui è possibile selezionare un nuovo ruolo e confermare l'operazione.

Le regole applicate dalla pagina sono:
- l'utente corrente non può cambiare il proprio ruolo;
- un `Manager` può intervenire solo su account `Operatore`;
- un `Manager` non può assegnare ruoli superiori a `Operatore`;
- un utente diverso da `Fondatore` non può cambiare il ruolo di un `Fondatore`.

Dal codice disponibile, un `Fondatore` può modificare il ruolo di tutti gli altri account visibili in tabella.

#### Eliminazione utente
Il pulsante con cestino apre una conferma. Dopo l'accettazione, la pagina avvia l'eliminazione dell'utente selezionato.

Le regole applicate dalla pagina sono:
- l'utente corrente non può eliminare se stesso;
- un `Manager` non può eliminare `Manager` o `Fondatore`;
- un `Fondatore` può eliminare gli altri account visibili.

Nel progetto è presente anche una Cloud Function che, alla cancellazione del record utente applicativo, elimina il corrispondente account di autenticazione.

### Campi, filtri e controlli
#### Tabella utenti
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Email | Testo | Indirizzo email dell'utente. | Sì | Sempre mostrato nella tabella. |
| Nome | Testo | Nome visualizzato dell'utente. | No | Se vuoto, viene mostrato `N/D`. |
| Ruolo | Badge | Mostra il ruolo corrente dell'utente. | Sì | Valori visualizzati: `Fondatore`, `Manager`, `Operatore`. |
| Cambio ruolo | Dropdown | Permette di selezionare un nuovo ruolo per l'utente. | No | Visibile solo se l'utente corrente ha permessi sufficienti su quella riga. |
| Elimina utente | Pulsante icona | Avvia la conferma di eliminazione dell'account. | No | Disabilitato per l'utente corrente e per account non gestibili. |

#### Dialog nuovo utente
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Email | Campo email | Email del nuovo account. | Sì | Il salvataggio è bloccato se il campo è vuoto. |
| Password | Password con maschera e feedback | Password iniziale del nuovo account. | Sì | Minimo 6 caratteri; è disponibile il toggle mostra/nascondi. |
| Nome | Testo | Nome visualizzato del nuovo utente. | No | Campo facoltativo. |
| Ruolo | Dropdown | Ruolo da assegnare al nuovo account. | Sì | Per `Manager` resta bloccato su `Operatore`; per `Fondatore` sono disponibili tutti i ruoli. |
| Annulla | Pulsante | Chiude il dialog senza creare l'utente. | No | Disponibile finché non è in corso il salvataggio. |
| Salva | Pulsante | Crea il nuovo account. | Sì | Disabilitato se email assente, password troppo corta o salvataggio in corso. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Aprire la creazione utente | Clicca `Aggiungi Utente`. | Si apre il dialog per inserire i dati del nuovo account. |
| Creare un utente | Compila il dialog e clicca `Salva`. | L'utente viene creato, viene mostrata una notifica di successo e la tabella viene ricaricata. |
| Annullare la creazione | Clicca `Annulla` nel dialog nuovo utente. | Il dialog viene chiuso senza salvare. |
| Cambiare ruolo a un utente | Seleziona un nuovo valore nel dropdown ruolo e conferma. | Il ruolo dell'utente viene aggiornato e notificato. |
| Eliminare un utente | Clicca il cestino sulla riga e conferma. | L'utente viene rimosso dall'elenco e viene mostrata una notifica di conferma. |

### Comportamenti e regole
- La pagina è accessibile solo agli utenti autenticati con ruolo `Manager` o `Fondatore`.
- Se un utente senza permessi prova a raggiungere la route, viene reindirizzato alla pagina `Access Denied`.
- Il pulsante `Aggiungi Utente` è sempre visibile agli utenti che hanno accesso alla pagina.
- La tabella non espone campi di ricerca o filtri.
- La paginazione della tabella si attiva solo quando gli utenti sono più di 10.
- Il dialog di creazione viene chiuso subito all'avvio del salvataggio; l'esito arriva tramite toast di conferma o errore.
- Se la creazione fallisce, la pagina mostra il messaggio restituito dal servizio.
- L'utente corrente non può modificare né eliminare il proprio account dalla schermata.
- Per i `Manager`, la gestione operativa è limitata agli account `Operatore`.
- Nel dropdown di cambio ruolo possono essere visibili anche ruoli non assegnabili da un `Manager`, ma il tentativo viene comunque bloccato con messaggio di permesso negato.
- Il cambio ruolo e l'eliminazione richiedono una conferma esplicita.

### Note operative
- La pagina non prevede la modifica diretta di email, password o nome degli utenti già esistenti.
- Il nome dell'utente è opzionale sia in creazione sia in visualizzazione.
- Dal codice disponibile, il ruolo `Fondatore` ha il livello di gestione più alto e può intervenire su tutti gli altri account presenti.

## Login

### Descrizione generale
La pagina `Login` è la schermata di accesso al gestionale. Viene utilizzata dagli utenti già abilitati per entrare nell'applicazione con email e password e raggiungere la pagina iniziale del catalogo.

### Elementi presenti nella pagina
- Logo `Sofaform`.
- Titolo `Accesso al Gestionale`.
- Campo `Email`.
- Campo `Password`.
- Pulsante `Accedi`.
- Area messaggi di errore visibile nella pagina.
- Toast di errore in alto al centro.

### Funzionalità disponibili
#### Accesso con credenziali
L'utente inserisce email e password e conferma con `Accedi`. Se le credenziali sono corrette, l'applicazione autentica l'utente e lo reindirizza alla pagina `Catalogo`.

#### Gestione delle credenziali errate
Se l'accesso fallisce, la pagina mostra un messaggio di errore sia nell'area interna della card sia tramite toast.

I messaggi previsti dal codice sono:
- `Email o password non validi` in caso di credenziali errate;
- `Troppi tentativi falliti. Riprova più tardi` in caso di blocco temporaneo dovuto a troppi tentativi;
- `Si è verificato un errore durante l'accesso` per gli altri errori non classificati.

#### Reindirizzamento automatico degli utenti già autenticati
La route di login è protetta da una guard dedicata. Se un utente ha già una sessione attiva e prova a raggiungere la pagina `Login`, viene reindirizzato automaticamente a `Catalogo`.

Lo stesso controllo viene ripetuto anche all'apertura del componente.

### Campi, filtri e controlli
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Email | Campo email | Inserisce l'indirizzo email dell'account. | Sì | Campo disabilitato durante il tentativo di accesso. |
| Password | Password | Inserisce la password dell'account. | Sì | Campo con pulsante mostra/nascondi password; feedback robustezza disattivato. |
| Accedi | Pulsante | Avvia il login con le credenziali inserite. | Sì | Disabilitato se il form non è valido o se è già in corso un login. |
| Messaggio di errore | Messaggio inline | Mostra l'errore dell'ultimo tentativo di accesso fallito. | No | Compare solo quando esiste un errore da mostrare. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Inserire email | Compila il campo email. | Il valore viene usato per il tentativo di autenticazione. |
| Inserire password | Compila il campo password. | Il valore viene usato per il tentativo di autenticazione. |
| Mostrare o nascondere la password | Usa il controllo del campo password. | Il contenuto della password viene reso visibile o mascherato. |
| Avviare il login | Clicca `Accedi` o invia il form. | Se le credenziali sono corrette, l'utente entra nel gestionale e viene portato a `Catalogo`. |

### Comportamenti e regole
- La pagina è accessibile solo agli utenti non già autenticati; gli utenti con sessione attiva vengono reindirizzati a `Catalogo`.
- Email e password sono obbligatorie.
- Durante il tentativo di login i campi vengono disabilitati e il pulsante `Accedi` mostra lo stato di caricamento.
- Se il login fallisce, lo stato di caricamento viene rimosso e la pagina resta sulla schermata di accesso.
- In caso di credenziali valide, il reindirizzamento porta a `/home`, che nel gestionale corrisponde alla pagina `Catalogo`.
- Dal codice disponibile non risultano funzioni di recupero password, registrazione autonoma o autenticazione tramite provider esterni.

### Note operative
- Il login richiede credenziali già esistenti: la pagina non consente di creare un nuovo account.
- La password minima richiesta dal sistema non è gestita in questa schermata di accesso, ma nella creazione utenti.
- La pagina usa sia un messaggio inline sia un toast per evidenziare l'errore dell'ultimo tentativo fallito.

## Access Denied

### Descrizione generale
La pagina `Access Denied` informa l'utente che non dispone dei permessi necessari per aprire una determinata sezione del gestionale. Nel routing attuale viene usata come destinazione di fallback quando un utente autenticato non supera un controllo di autorizzazione.

### Elementi presenti nella pagina
- Icona lucchetto.
- Titolo `Accesso Negato`.
- Messaggio informativo sui permessi mancanti.
- Messaggio che invita a contattare un amministratore.
- Pulsante `Torna alla Home`.

### Funzionalità disponibili
#### Visualizzazione del blocco di accesso
La pagina mostra un messaggio fisso che comunica che l'utente non ha i permessi necessari per entrare nella sezione richiesta.

#### Rientro alla pagina principale
Il pulsante `Torna alla Home` riporta l'utente alla route `/home`, che nel gestionale corrisponde al `Catalogo`.

### Campi, filtri e controlli
| Elemento | Tipo | Descrizione | Obbligatorio | Note |
|---|---|---|---|---|
| Torna alla Home | Pulsante | Reindirizza l'utente alla pagina principale del gestionale. | No | Usa navigazione interna verso `/home`. |

### Azioni utente
| Azione | Descrizione | Risultato |
|---|---|---|
| Tornare alla Home | Clicca `Torna alla Home`. | L'utente viene reindirizzato a `Catalogo`. |

### Comportamenti e regole
- La pagina non contiene form, campi editabili o azioni amministrative.
- Nel routing attuale è raggiungibile direttamente tramite `/access-denied`.
- La pagina viene usata dai guard di autorizzazione quando l'utente non ha il ruolo richiesto per una route protetta.
- Nel progetto attuale la route `Gestione Utenti` reindirizza qui se l'utente autenticato non è `Manager` o `Fondatore`.
- Il messaggio mostrato è statico e non cambia in base alla pagina da cui proviene il reindirizzamento.

### Note operative
- La pagina non indica quale permesso specifico manca.
- Se l'utente non è autenticato e prova invece ad aprire una pagina protetta, il routing lo porta alla pagina `Login`, non a `Access Denied`.
