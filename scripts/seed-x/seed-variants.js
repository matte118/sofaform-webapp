// scripts/seed-variants.js

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// 1) INIZIALIZZA ADMIN SDK con il tuo serviceAccountKey.json
const serviceAccountPath =  "../serviceAccountKey.json"
const serviceAccount     = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const db          = admin.database();
const variantsRef = db.ref('variants');

async function seed() {
  // 2) LEGGI IL JSON
  const jsonPath = path.resolve(__dirname, 'json/variants.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File non trovato: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Trovati ${rawData.length} varianti nel JSON.`);

  // 3) PER OGNI VARIANTE: fai push() e lascia che Firebase generi l'ID
  // Nota: Se il JSON contiene già gli ID (perché generato manualmente o altro),
  // dovresti usare .child(id).set(variant) invece di .push().
  // Ma seguendo il flusso GPT, qui stiamo creando nuove varianti.
  
  for (const variant of rawData) {
    // Se la variante ha un ID esplicito nel JSON, usalo come chiave (opzionale)
    // Altrimenti usa push()
    
    let newRef;
    if (variant.id) {
        newRef = variantsRef.child(variant.id);
        // Rimuovi l'id dall'oggetto prima di salvarlo se non vuoi duplicarlo dentro
        const { id, ...variantData } = variant; 
        await newRef.set(variantData);
    } else {
        newRef = variantsRef.push();
        await newRef.set(variant);
    }
    
    console.log(`✔️  Pubblicata variante ${variant.longName} (chiave: ${newRef.key})`);
  }

  console.log('🎉 Seeding varianti completato!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
