const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'src', 'environments', 'environments.ts');

const requiredVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length) {
  if (fs.existsSync(outputPath)) {
    console.warn(`[generate-env] Missing env vars: ${missing.join(', ')}. Keeping existing ${outputPath}.`);
    process.exit(0);
  }

  console.error(`[generate-env] Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

const contents = `export const environment = {
` +
  `  production: ${isProd},
` +
  `  firebase: {
` +
  `    apiKey: "${process.env.FIREBASE_API_KEY}",
` +
  `    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
` +
  `    databaseURL: "${process.env.FIREBASE_DATABASE_URL}",
` +
  `    projectId: "${process.env.FIREBASE_PROJECT_ID}",
` +
  `    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
` +
  `    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
` +
  `    appId: "${process.env.FIREBASE_APP_ID}"
` +
  `  }
` +
  `};
`;

fs.writeFileSync(outputPath, contents, 'utf8');
console.log(`[generate-env] Wrote ${outputPath}.`);
