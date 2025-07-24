// scripts/seed-components.ts

import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

// 1) CARICAMENTO SERVICE ACCOUNT
// Metti il tuo serviceAccountKey.json fuori dal repo 
// (e aggiungilo a .gitignore), per es. in folder "secrets/"
const serviceAccountPath = path.resolve(__dirname, '../secrets/serviceAccountKey.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<YOUR-PROJECT>.firebaseio.com'
})

const db = admin.database()
const componentsRef = db.ref('components')

interface RawComponent {
  name: string
  price: number
  type: string
  measure: string
  // aggiungi altri campi se servono (supplier, ecc.)
}

async function seed() {
  // 2) LETTURA DEL JSON PRE-ESPORTATO
  // Salva in scripts/components.json il tuo array di RawComponent
  const jsonPath = path.resolve(__dirname, 'components.json')
  const rawData: RawComponent[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  console.log(`Trovati ${rawData.length} componenti nel JSON.`)

  // 3) PUSH SU FIREBASE (ID AUTOMATICO)
  for (const comp of rawData) {
    const newRef = componentsRef.push()
    await newRef.set(comp)
    console.log(`✔️  Pubblicato ${comp.name} con chiave ${newRef.key}`)
  }

  console.log('🎉 Seeding completato!')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err)
  process.exit(1)
})
