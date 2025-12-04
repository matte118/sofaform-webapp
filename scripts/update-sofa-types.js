// scripts/update-sofa-types.js
// Aggiorna i componenti nel Realtime Database sostituendo i vecchi sofaType con i nuovi.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File non trovato: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();
const componentsRef = db.ref('components');

// Mappa dei valori da sostituire.
const sofaTypeMap = {
  DIVANO_2PL: 'DIVANO_2_PL',
  DIVANO_3PL: 'DIVANO_3_PL',
  DIVANO_3PL_MAXI: 'DIVANO_3_PL_MAXI'
};

async function updateSofaTypes() {
  console.log('📥 Caricamento componenti esistenti dal database...');
  const snapshot = await componentsRef.once('value');
  const components = snapshot.val();

  if (!components) {
    console.log('Nessun componente trovato.');
    process.exit(0);
  }

  const updates = {};
  let toUpdate = 0;

  for (const [id, comp] of Object.entries(components)) {
    const current = comp?.sofaType;
    const next = sofaTypeMap[current];

    if (next && next !== current) {
      updates[`${id}/sofaType`] = next;
      toUpdate++;
      console.log(`🔄 ${comp?.name || id}: ${current} -> ${next}`);
    }
  }

  if (!toUpdate) {
    console.log('Nessun componente da aggiornare.');
    process.exit(0);
  }

  console.log(`\n📦 Aggiornamento di ${toUpdate} componenti...`);
  await componentsRef.update(updates);
  console.log('🎉 Aggiornamento completato!');
  process.exit(0);
}

updateSofaTypes().catch(err => {
  console.error('❌ Errore durante l\'aggiornamento:', err);
  process.exit(1);
});
