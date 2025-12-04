// scripts/seed-components.js

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// 1) INIZIALIZZA ADMIN SDK con il tuo serviceAccountKey.json
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
const serviceAccount     = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const db            = admin.database();
const componentsRef = db.ref('components');

async function seed() {
  // 2) LEGGI IL JSON che hai creato da Excel
  const jsonPath = path.resolve(__dirname, 'json/components.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File non trovato: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Trovati ${rawData.length} componenti nel JSON.`);

  // 3) PER OGNI COMPONENTE: fai push() e lascia che Firebase generi l'ID
  for (const comp of rawData) {
    const newRef = componentsRef.push();
    await newRef.set(comp);
    console.log(`✔️  Pubblicato ${comp.name} (chiave: ${newRef.key})`);
  }

  console.log('🎉 Seeding completato!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
