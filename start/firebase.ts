import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import { initializeFirebase } from '#service/sendOtp.js';
// Recréer __dirname pour les ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger la clé du service Firebase
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../firebase-service-account.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
