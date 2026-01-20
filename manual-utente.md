# Manuale utente – SofaForm WebApp

## Panoramica e ruoli
- La web app gestisce catalogo, listini, componenti, fornitori, tessuti e utenti SofaForm.
- Ruoli:
  - **Fondatore**: accesso completo, può gestire utenti di ogni ruolo.
  - **Manager**: tutte le aree tranne le funzioni riservate al Fondatore sugli utenti; può creare solo Operatori.
  - **Operatore**: tutte le aree operative (catalogo, listini, prodotti, componenti, fornitori, tessuti); non vede la gestione utenti.
- Le voci di menu si adattano al ruolo. Se non si hanno permessi appare la pagina **Accesso Negato**.

## Accesso e navigazione
- **Login**: inserire email e password e premere **Accedi**. In caso di credenziali errate, troppi tentativi o campi vuoti viene mostrato un messaggio d’errore.
- **Layout**: barra laterale con logo, menu e dati utente (email e ruolo) più pulsante di **logout**.
- **Logout**: icona di uscita in basso a sinistra; conferma immediata.

## Home / Catalogo
Schermata principale con elenco dei divani già presenti.

- **Ricerca**: campo “Cerca per nome modello…” filtra in tempo reale; pulsante “x” cancella il filtro.
- **Schede prodotto**:
  - Mostrano immagine (o segnaposto), descrizione e l’elenco delle varianti.
  - Ogni variante indica nome, prezzo, posti e dimensioni; il pulsante a freccia espande i dettagli. Se la variante usa prezzo “Custom” non mostra componenti.
  - Le componenti della variante vengono raggruppate con quantità e prezzo totale.
- **Azioni prodotto**:
  - **Matita**: apre la finestra di modifica completa (vedi sotto).
  - **Cestino**: chiede conferma e, se accettata, elimina prodotto, varianti collegate ed eventuali immagini.
  - **Genera Listino**: avvia il flusso di creazione listino per il prodotto selezionato.

### Generazione listino singolo
1. **Selezione rivestimenti**: dialog iniziale.
   - Seleziona rivestimenti validi (multi-select) per tutte le varianti o scegli una variante specifica dal menu e imposta i metri necessari per ciascun rivestimento.
   - Pulsante “Applica a tutti” imposta i metri uniformemente sulla variante corrente.
   - “Continua” si attiva solo se ogni variante ha almeno un rivestimento con metri > 0. “Annulla” chiude e annulla il flusso.
2. **Extra materassi e meccanismi**: dialog successivo.
   - Aggiungi righe con nome e prezzo per materassi o meccanismi extra; ogni riga ha pulsante rimozione.
   - “Continua” prosegue, “Annulla” chiude e resetta il flusso.
3. **Configurazione listino (Markup & PDF)**:
   - Imposta **ricarico %**, **immagine di testata** (logo) e **lingua** del listino (IT/EN/FR/DE/ES/PT).
   - Opzioni:
     - **Salva senza PDF**: salva rivestimenti, extra, ricarico e chiude il flusso.
     - **Genera PDF**: salva i dati, mostra barra di avanzamento, traduce se necessario e apre l’anteprima del listino in una nuova scheda.

### Generazione Multi Listino
- Pulsante “Generazione Multi Listino” nella toolbar.
- Nella finestra:
  - Filtra con la ricerca, seleziona manualmente o usa “Seleziona tutti”.
  - Colonna **Stato** indica se un divano è disponibile (richiede ricarico salvato e rivestimenti validi).
  - Scegli **lingua** del PDF.
  - Premi **Genera PDF**: parte la barra di avanzamento e si apre una scheda con l’anteprima multi-listino (uno o più prodotti).

### Modifica prodotto (dialog a tutto schermo)
- **Immagini**: massimo 3, sostituibili o rimovibili; anteprima con pulsanti modifica/elimina; caricamento <5MB.
- **Informazioni base**: nome (obbligatorio) e descrizione.
- **Caratteristiche tecniche**: testi per seduta, schienale, meccanica, materasso.
- **Gestione varianti**:
  - Tabella varianti con prezzo e posti. Pulsanti modifica/elimina.
  - **Aggiungi componente alla variante**: apre dialog per scegliere componente e quantità; il prezzo della variante si aggiorna.
  - **Gestione componenti della variante**: chip rimovibili che eliminano in blocco tutte le occorrenze del componente.
  - **Modifica variante esistente**: compila il form e salva; “Annulla” esce dalla modifica.
  - **Aggiungi nuova variante**: pulsante “Aggiungi Variante” apre dialog per selezionare componenti obbligatori (fusto, gomma, meccanismo, materasso, piedini con quantità, imballo, ecc.) e rivestimenti; se mancano elementi obbligatori compare un errore.
- **Salvataggio**: pulsante **Salva Modifiche** memorizza prodotto, varianti, componenti e immagini; messaggi toast confermano l’esito.

## Aggiungi Prodotto (wizard a 3 step con salvataggio bozza automatico)
1. **Informazioni prodotto**:
   - Nome obbligatorio, descrizione, immagini (trascina per riordinare; max 3; possibilità di cancellare).
   - Pulsanti rapidi per compilare/rimuovere testi di seduta, schienale, meccanica, materasso.
2. **Varianti**:
   - Scegli **modalità prezzo**: “Componenti” (calcolo da componenti) o “Custom” (prezzo manuale).
   - Inserisci dati della variante (tipo divano o nome custom, posti, dimensioni, prezzo se custom).
   - Elenco varianti con pulsanti modifica e cestino.
3. **Componenti per variante** (solo varianti in modalità “Componenti”):
   - Seleziona la variante dal menu.
   - Scegli i componenti per categoria (fusto, gomma, rete, piedini con quantità, materasso, ferro schienale, imballo, scatola, ecc.) più liste multiple per ferramenta/varie.
   - Pulsante **Applica componenti** (disponibile quando almeno un componente è scelto) aggiunge i pezzi alla variante e ricalcola il prezzo. **Resetta** azzera i componenti della variante.
4. **Salva**:
   - Premendo **Salva Prodotto** vengono caricati i file, creato il prodotto e generate le varianti; una barra di stato mostra l’avanzamento. Non chiudere la pagina finché non termina.

## Gestione Componenti
- **Tab “Singolo”**: crea o modifica un componente scegliendo fornitore, tipo, tipo divano (opzionale) e prezzo. Il nome è obbligatorio; pulsante **Salva** crea o aggiorna, **Annulla** esce dalla modalità modifica.
- **Tab “Multiplo”**: crea più componenti in un’unica azione impostando dati comuni (fornitore, tipo) e più righe con tipo divano, prezzo e nome; pulsante **Salva Componenti** conferma.
- **Elenco componenti**:
  - Ricerca globale, ordinamento per colonna, selezione multipla e **Elimina Selezionati**.
  - Ogni riga ha azioni **Modifica** e **Elimina**; prima dell’eliminazione viene mostrato l’elenco di prodotti che usano il componente.
  - Pulsante **Esporta** genera un PDF della lista componenti corrente.
- **Aggiornamento prezzi per fornitore**:
  - Seleziona un fornitore e una percentuale (+/-); viene mostrato il numero di componenti interessati e l’anteprima della variazione.
  - **Aggiorna prezzi** applica la percentuale a tutti i componenti del fornitore e aggiorna automaticamente i prezzi delle varianti che li utilizzano.

## Gestione Fornitori
- Elenco con nome e contatto.
- Form per **aggiungere** o **modificare** un fornitore; nome obbligatorio.
- **Elimina**: controlla se il fornitore è usato da componenti e chiede conferma prima di procedere.

## Gestione Tessuti (Rivestimenti)
- Elenco dei rivestimenti con prezzo al metro.
- Form per creare o modificare (nome e €/mt obbligatori).
- Eliminazione con conferma; i rivestimenti sono usati nel flusso listino.

## Gestione Utenti (solo Fondatore/Manager)
- Tabella utenti con email e ruolo, ordinata per ruolo.
- **Crea utente**: pulsante “Nuovo utente” apre il dialog; inserire email, password (minimo 6 caratteri), nome visibile e ruolo.
  - Il Manager può creare solo Operatori.
- **Cambia ruolo**: menu a discesa nella tabella, con regole di sicurezza (non si può modificare Fondatore se non si è Fondatore).
- **Elimina**: consentito solo su utenti con ruolo consentito e diversi dall’account corrente; richiede conferma.

## Note operative
- Messaggi toast confermano successi o errori.
- Il filtro e le selezioni di tabelle e dialog vengono resettati quando si chiudono le finestre.
- In caso di problemi di permessi o login scaduto, tornare al login; la rotta “/access-denied” indica mancanza di autorizzazioni.
