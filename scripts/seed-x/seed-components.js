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

  // 3) LEGGI TUTTI I COMPONENTI ESISTENTI DAL DATABASE
  console.log('📥 Caricamento componenti esistenti dal database...');
  const snapshot = await componentsRef.once('value');
  const existingComponents = snapshot.val() || {};
  
  // Crea una mappa: nome -> { id, data }
  const componentsByName = new Map();
  for (const [id, data] of Object.entries(existingComponents)) {
    componentsByName.set(data.name, { id, data });
  }
  
  console.log(`📊 Trovati ${componentsByName.size} componenti esistenti nel database.\n`);

  let updated = 0;
  let created = 0;

  // 4) PER OGNI COMPONENTE: aggiorna se esiste, altrimenti crea nuovo
  for (const comp of rawData) {
    const existing = componentsByName.get(comp.name);
    
    if (existing) {
      // Componente esiste già -> AGGIORNA
      await componentsRef.child(existing.id).set(comp);
      console.log(`🔄 Aggiornato ${comp.name} (chiave: ${existing.id})`);
      updated++;
    } else {
      // Componente nuovo -> CREA
      const newRef = componentsRef.push();
      await newRef.set(comp);
      console.log(`✨ Creato ${comp.name} (chiave: ${newRef.key})`);
      created++;
    }
  }

  console.log(`\n🎉 Seeding completato!`);
  console.log(`   ✨ Creati: ${created}`);
  console.log(`   🔄 Aggiornati: ${updated}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
