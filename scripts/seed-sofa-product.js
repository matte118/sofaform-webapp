// scripts/seed-sofa-product.js

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

const db          = admin.database();
const productsRef = db.ref('products');
const variantsRef = db.ref('variants');

async function seed() {
  // 2) LEGGI IL JSON
  const jsonPath = path.resolve(__dirname, 'json/sofaProduct.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File non trovato: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Trovati ${rawData.length} prodotti nel JSON.`);

  for (const product of rawData) {
    // 3) Crea il prodotto
    const newProductRef = productsRef.push();
    await newProductRef.set(product);
    const productId = newProductRef.key;
    
    console.log(`✔️  Pubblicato prodotto ${product.name} (chiave: ${productId})`);

    // 4) Aggiorna le varianti collegate con il nuovo sofaId
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        console.log(`   🔄 Aggiornamento sofaId per ${product.variants.length} varianti...`);
        
        const updatePromises = product.variants.map(variantId => {
            return variantsRef.child(variantId).update({ sofaId: productId });
        });

        await Promise.all(updatePromises);
        console.log(`   ✅ Varianti aggiornate con sofaId: ${productId}`);
    }
  }

  console.log('🎉 Seeding prodotti completato!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
