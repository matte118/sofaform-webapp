// scripts/check-variant-components.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Missing service account file at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

async function fetchData() {
  const [componentsSnap, variantsSnap] = await Promise.all([
    db.ref('components').once('value'),
    db.ref('variants').once('value')
  ]);

  return {
    components: componentsSnap.val() || {},
    variants: variantsSnap.val() || {}
  };
}

function buildReport(components, variants) {
  const componentIds = new Set(Object.keys(components));
  const missing = [];
  let checked = 0;

  for (const [variantId, variant] of Object.entries(variants)) {
    const items = Array.isArray(variant.components) ? variant.components : [];

    items.forEach((item, index) => {
      const id = item && item.id;

      if (!id) {
        missing.push({
          variantId,
          longName: variant.longName,
          index: index + 1,
          name: item && item.name,
          id: null,
          reason: 'component has no id'
        });
        return;
      }

      checked++;

      if (!componentIds.has(id)) {
        missing.push({
          variantId,
          longName: variant.longName,
          index: index + 1,
          name: item && item.name,
          id,
          reason: 'id not found in /components'
        });
      }
    });
  }

  return {
    missing,
    checked,
    variantCount: Object.keys(variants).length,
    componentCount: componentIds.size
  };
}

async function run() {
  console.log('Loading components and variants from Realtime Database...');

  const { components, variants } = await fetchData();
  const { missing, checked, variantCount, componentCount } = buildReport(components, variants);

  console.log(`Component records: ${componentCount}`);
  console.log(`Variants: ${variantCount}`);
  console.log(`Component entries checked: ${checked}`);

  if (missing.length === 0) {
    console.log('All component ids referenced by variants exist under /components.');
    process.exit(0);
  }

  console.error(`\nMissing references found: ${missing.length}`);
  missing.forEach((item, idx) => {
    const variantLabel = item.longName || item.variantId;
    const compLabel = item.name || 'N/A';
    const idLabel = item.id ? `id=${item.id}` : 'id missing';
    console.error(
      `${idx + 1}. Variant "${variantLabel}" (${item.variantId}) -> component #${item.index}: ${compLabel} (${idLabel}) - ${item.reason}`
    );
  });

  process.exit(1);
}

run().catch((err) => {
  console.error('Error during check:', err);
  process.exit(1);
});
