// scripts/fix-variant-component-types.js
// Aggiusta le varianti: se un componente non ha il campo "type",
// lo imposta con la prima parola del campo "name" in maiuscolo.

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
const variantsRef = db.ref('variants');

async function fixComponentTypes() {
  console.log('📥 Recupero varianti...');
  const snapshot = await variantsRef.once('value');
  const variants = snapshot.val();

  if (!variants) {
    console.log('Nessuna variante trovata.');
    process.exit(0);
  }

  const updates = {};
  let fixedCount = 0;

  for (const [variantId, variantData] of Object.entries(variants)) {
    const components = Array.isArray(variantData.components) ? variantData.components : [];

    components.forEach((comp, index) => {
      const hasType = comp && comp.type !== undefined && comp.type !== null && comp.type !== '';
      if (hasType) return;

      const name = (comp?.name || '').trim();
      if (!name) return;

      const firstWord = name.split(/\s+/)[0];
      if (!firstWord) return;

      const typeValue = firstWord.toUpperCase();
      updates[`${variantId}/components/${index}/type`] = typeValue;
      fixedCount++;
      console.log(`🔧 Variante ${variantId}: componente "${name}" -> type="${typeValue}"`);
    });
  }

  if (!fixedCount) {
    console.log('✅ Tutti i componenti hanno già il campo type.');
    process.exit(0);
  }

  console.log(`\n📦 Aggiorno ${fixedCount} componenti...`);
  await variantsRef.update(updates);
  console.log('🎉 Aggiornamento completato!');
  process.exit(0);
}

fixComponentTypes().catch(err => {
  console.error('❌ Errore durante l\'aggiornamento:', err);
  process.exit(1);
});
