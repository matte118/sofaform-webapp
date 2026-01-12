// scripts/update-variants-from-json.js
// Aggiorna le varianti nel Realtime Database usando i dati di un file JSON
// (formato simile a scripts/json/variants.json). Per ogni variante trovata
// nel JSON, viene cercata la variante nel DB con lo stesso sofaId e longName
// (case-insensitive) e i dati vengono sovrascritti mantenendo l'id esistente.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const jsonArgPath = process.argv[2];
const jsonPath = path.resolve(__dirname, jsonArgPath || 'json/variants.json');
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File non trovato: ${serviceAccountPath}`);
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ File JSON non trovato: ${jsonPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const fileVariants = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

if (!Array.isArray(fileVariants) || fileVariants.length === 0) {
  console.error('❌ Il file JSON non contiene varianti valide.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const variantsRef = db.ref('variants');

function normalize(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

async function run() {
  console.log(`📥 Caricamento varianti dal DB...`);
  const snapshot = await variantsRef.once('value');
  const dbVariants = snapshot.val() || {};

  const targetMap = new Map();
  fileVariants.forEach((variant) => {
    const key = `${normalize(variant.sofaId)}|${normalize(variant.longName)}`;
    targetMap.set(key, variant);
  });

  const updates = {};
  let matched = 0;
  let skipped = 0;

  for (const [id, data] of Object.entries(dbVariants)) {
    const key = `${normalize(data.sofaId)}|${normalize(data.longName)}`;
    if (!targetMap.has(key)) {
      skipped++;
      continue;
    }

    const source = targetMap.get(key);
    const payload = {
      ...source,
      id,
      sofaId: source.sofaId || data.sofaId || null
    };

    updates[id] = payload;
    matched++;
    console.log(`🔄 Variante aggiornata (id: ${id}) per sofaId "${data.sofaId}" e longName "${data.longName}"`);
  }

  if (!matched) {
    console.log('ℹ️ Nessuna variante nel DB corrisponde ai sofaId/longName presenti nel file.');
    process.exit(0);
  }

  console.log(`\n📦 Aggiorno ${matched} varianti (saltate: ${skipped})...`);
  await variantsRef.update(updates);
  console.log('🎉 Aggiornamento completato!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Errore durante l\'aggiornamento:', err);
  process.exit(1);
});
