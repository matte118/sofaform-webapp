// scripts/migrate-depth-to-open-closed.js
// Copia il valore di depth in closedDepth, imposta openDepth a 0 e rimuove depth
// per tutte le varianti nel Realtime Database.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath =  "../serviceAccountKey.json"

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File serviceAccountKey.json non trovato in ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const variantsRef = admin.database().ref('variants');

async function run() {
  console.log('📥 Recupero varianti dal DB...');
  const snapshot = await variantsRef.once('value');
  const variants = snapshot.val() || {};

  const updates = {};
  let total = 0;
  let migrated = 0;

  for (const [id, data] of Object.entries(variants)) {
    total++;

    const depthValue = typeof data.depth === 'number' ? data.depth : null;
    const existingClosed = typeof data.closedDepth === 'number' ? data.closedDepth : null;
    const closedDepth = depthValue != null ? depthValue : existingClosed;

    updates[`${id}/closedDepth`] = closedDepth;
    updates[`${id}/openDepth`] = 0;
    updates[`${id}/depth`] = null; // rimuove il campo depth

    if (depthValue != null || existingClosed != null) {
      migrated++;
    }
  }

  if (total === 0) {
    console.log('ℹ️ Nessuna variante trovata, nulla da migrare.');
    process.exit(0);
  }

  console.log(`🔄 Aggiorno ${total} varianti (depth → closedDepth, openDepth=0, depth rimosso)...`);
  await variantsRef.update(updates);
  console.log(`🎉 Migrazione completata. Varianti toccate: ${migrated}/${total}.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Errore durante la migrazione:', err);
  process.exit(1);
});
