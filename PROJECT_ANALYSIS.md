# Analisi Progetto SofaForm WebApp

Questo documento fornisce un riassunto strutturato del progetto Angular **sofaform-webapp**.

## 1. Panoramica Tecnologica
- **Framework**: Angular 18
- **UI Library**: PrimeNG (con PrimeFlex e PrimeIcons)
- **Backend / Database**: Firebase (Authentication + Realtime Database)
- **Librerie Utility**: `jspdf`, `pdfmake` (generazione PDF), `html2canvas`

## 2. Entità Principali
Le entità di dominio si trovano in `src/models` e riflettono la struttura del database.

### **SofaProduct**
Rappresenta un modello di divano.
*   `id` (string): Identificativo univoco.
*   `name` (string): Nome del modello.
*   `description` (string, opzionale): Descrizione testuale.
*   `variants` (string[]): Lista di ID delle varianti associate.
*   `photoUrl` (string[]): Array di URL delle immagini del prodotto.
*   `seduta`, `schienale`, `meccanica`, `materasso` (string, opzionali): Specifiche tecniche descrittive.
*   `materassiExtra` (ExtraMattress[], opzionale): Lista di opzioni extra per i materassi.
*   `deliveryPrice` (number, opzionale): Costo di consegna specifico.
*   `ricarico` (number, opzionale): Percentuale di ricarico da applicare al prezzo finale.

### **Variant**
Rappresenta una specifica configurazione (es. "3 posti", "Laterale dx").
*   `id` (string): Identificativo univoco.
*   `sofaId` (string): ID del prodotto padre.
*   `longName` (SofaType): Nome completo della variante.
*   `price` (number): Prezzo base calcolato o manuale.
*   `components` (Component[]): Lista dei componenti che costituiscono la variante.
*   `seatsCount` (number, opzionale): Numero di sedute.
*   `mattressWidth` (number, opzionale): Larghezza del materasso (se presente).
*   `rivestimenti` ({ rivestimento: Rivestimento; metri: number }[], opzionale): Metraggio richiesto per ogni tipo di rivestimento.
*   `pricingMode` ('components' | 'custom'): Modalità di calcolo del prezzo (somma componenti o manuale).
*   `customPrice` (number, opzionale): Prezzo manuale se `pricingMode` è 'custom'.

### **Component**
Rappresenta un singolo pezzo o lavorazione (es. "Meccanica 140", "Gomma seduta").
*   `id` (string): Identificativo univoco.
*   `name` (string): Nome del componente.
*   `price` (number): Costo unitario.
*   `supplier` (Supplier, opzionale): Fornitore associato.
*   `type` (ComponentType): tipo di componente.
*   `sofaType` (SofaType): tipologia del divano (3 posti maxi, 3 posti, 2 posti)

### **Supplier**
Rappresenta un fornitore.
*   `id` (string): Identificativo univoco.
*   `name` (string): Ragione sociale o nome.
*   `contact` (string, opzionale): Informazioni di contatto.

### **Rivestimento**
Rappresenta una categoria di tessuto o pelle.
*   `id` (string): Identificativo univoco.
*   `name` (string): Nome (es. "Cat. A", "Pelle").
*   `mtPrice` (number): Prezzo al metro lineare/quadro.

### **User**
Rappresenta un utente del sistema.
*   `id` (string): UID di Firebase Authentication.
*   `email` (string): Indirizzo email.
*   `displayName` (string, opzionale): Nome visualizzato.
*   `role` (UserRole): Ruolo (`FOUNDER`, `MANAGER`, `OPERATOR`).
*   `creationDate` (string): Data creazione (ISO string).
*   `lastLoginDate` (string, opzionale): Data ultimo accesso.
*   `disabled` (boolean): Flag per disabilitare l'accesso.

### **Altre Entità di Supporto**
*   **ExtraMattress**: `{ name: string, price: number }` - Opzioni aggiuntive per materassi.
*   **ComponentType** (Enum): Categorie fisse per i componenti (FUSTO, GOMMA, RETE, MATERASSO, TAPPEZZERIA, PIEDINI, FERRAMENTA, VARIE, IMBALLO, SCATOLA, TELA_MARCHIATA, TRASPORTO).
*   **SofaType** (Enum): Tipologia del divano (DIVANO_3PL_MAXI, DIVANO_3PL, DIVANO_2PL).

## 3. Comunicazione con il Database
La gestione dei dati è centralizzata nel servizio **`RealtimeDbService`** (`src/services/realtime-db.service.ts`).

*   **Firebase Realtime Database**: Viene utilizzato il DB Realtime (non Firestore).
*   **Pattern di Accesso**:
    *   Utilizza l'SDK modulare di AngularFire (`@angular/fire/database`).
    *   **Sanitizzazione**: Il metodo `sanitizeData` è cruciale per rimuovere valori `undefined` prima del salvataggio, poiché Firebase non li supporta.
    *   **Integrità Referenziale Manuale**:
        *   Quando si elimina una `Variant`, il servizio si occupa di rimuovere il riferimento dall'array `variants` del `SofaProduct` padre.
        *   Se un prodotto rimane senza varianti, viene eliminato (logica a cascata).
        *   La cancellazione di un fornitore o componente innesca pulizie correlate.
*   **CRUD**: Sono presenti metodi specifici per ogni entità (`addSofaProduct`, `getSofaProducts`, `updateSofaProduct`, ecc.).

## 4. Logiche Importanti di Funzionamento

### Autenticazione e Ruoli (`AuthService`)
*   **Doppio Livello di Auth**: Utilizza Firebase Authentication per l'identità, ma i ruoli e i profili utente estesi sono memorizzati nel Realtime Database sotto il nodo `users/`.
*   **Creazione Utenti "Delegata"**: Esiste una logica complessa (`createUserLocally`) che permette a un Manager di creare nuovi utenti senza perdere la propria sessione:
    1.  Il Manager è loggato.
    2.  Viene creato il nuovo utente su Firebase Auth.
    3.  Viene salvato il profilo su DB.
    4.  Il sistema effettua il logout del nuovo utente e ri-logga automaticamente il Manager.
*   **Guards**:
    *   `AuthGuard`: Protegge le rotte per utenti loggati.
    *   `ManagerGuard`: Restringe l'accesso alla gestione utenti solo a Manager e Founder.

### Generazione Listini PDF (`PdfGenerationService`)
*   Funzionalità avanzata per creare cataloghi/listini in PDF.
*   Utilizza **pdfmake** per definire layout complessi (immagini, tabelle prezzi a matrice Varianti x Rivestimenti).
*   Supporta il **multilingua** (`TranslationService`, `I18nService`) traducendo dinamicamente i nomi dei prodotti e le specifiche nel PDF generato.
*   Gestisce la conversione delle immagini da URL a Base64 per l'embedding nel PDF.

### Gestione Prezzi
*   Il prezzo delle varianti è calcolato dinamicamente sommando i prezzi dei componenti.
*   Il sistema gestisce un "ricarico" (`markup`) applicabile al prezzo finale nel listino.

## 5. Altre Caratteristiche Importanti
*   **Routing**: Struttura chiara con Lazy Loading dei componenti (standalone components).
*   **Gestione Errori**: I servizi gestiscono i casi limite (es. immagini mancanti nel PDF, dati nulli dal DB).
*   **Internazionalizzazione**: Predisposizione per traduzioni dinamiche dei contenuti.