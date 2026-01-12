// scripts/update-depths-by-product.js
// Aggiorna closedDepth/openDepth delle varianti di un prodotto, cercandolo per nome.
// Uso:
//   node scripts/update-depths-by-product.js "Nome Prodotto" <closed1> <open1> <closed2> <open2> <closed3> <open3>
// Passa sei numeri (due per ciascuna delle tre varianti nell'ordine in cui sono salvate).

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const productName = args[0];
const depthArgs = args.slice(1);

if (!productName || depthArgs.length !== 6) {
  console.error('❌ Uso: node scripts/update-depths-by-product.js "Nome Prodotto" <closed1> <open1> <closed2> <open2> <closed3> <open3>');
  process.exit(1);
}

const numericDepths = depthArgs.map((v) => Number(v));
if (numericDepths.some((n) => Number.isNaN(n))) {
  console.error('❌ Tutti i sei valori di profondità devono essere numerici.');
  process.exit(1);
}

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File serviceAccountKey.json non trovato: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app',
});

const db = admin.database();

async function run() {
  console.log(`🔍 Cerco prodotto con nome "${productName}"...`);
  const productsSnap = await db.ref('products').once('value');
  const products = productsSnap.val() || {};

  const normalizedTarget = productName.trim().toLowerCase();
  const matches = Object.entries(products).filter(([, p]) => {
    const name = (p?.name || '').toString().trim().toLowerCase();
    return name === normalizedTarget;
  });

  if (!matches.length) {
    console.error('❌ Nessun prodotto trovato con quel nome.');
    process.exit(1);
  }

  if (matches.length > 1) {
    console.error('❌ Più prodotti trovati con quel nome, specifica meglio:');
    matches.forEach(([id, p]) => console.error(` - ${id}: ${p?.name}`));
    process.exit(1);
  }

  const [productId, product] = matches[0];
  const variantIds = Array.isArray(product.variants) ? product.variants.filter(Boolean) : [];

  if (!variantIds.length) {
    console.error('❌ Il prodotto non ha varianti collegate.');
    process.exit(1);
  }

  const pairs = [
    { closed: numericDepths[0], open: numericDepths[1] },
    { closed: numericDepths[2], open: numericDepths[3] },
    { closed: numericDepths[4], open: numericDepths[5] },
  ];

  const updates = {};
  const targets = Math.min(variantIds.length, pairs.length);
  for (let i = 0; i < targets; i++) {
    const vid = variantIds[i];
    const pair = pairs[i];
    updates[`variants/${vid}/closedDepth`] = pair.closed;
    updates[`variants/${vid}/openDepth`] = pair.open;
    updates[`variants/${vid}/depth`] = null; // rimuove eventuale campo legacy
  }

  console.log(`🔄 Aggiorno ${targets} varianti per il prodotto "${product.name}" (id: ${productId})...`);
  await db.ref().update(updates);
  console.log('✅ Aggiornamento completato.');

  if (variantIds.length > pairs.length) {
    console.log(`ℹ️ Avviso: il prodotto ha ${variantIds.length} varianti ma sono stati passati solo ${pairs.length} set di valori.`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Errore durante l\'aggiornamento:', err);
  process.exit(1);
});
