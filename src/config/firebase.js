const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY) {
    // Inicializar desde variables de entorno directamente (Recomendado para Railway/Producción)
    serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
    console.log('ℹ️  Initializing Firebase Admin using environment variables');
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Fallback a archivo JSON (Para desarrollo local)
    const path = require('path');
    try {
        serviceAccount = require(path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
        console.log('ℹ️  Initializing Firebase Admin using JSON file');
    } catch (error) {
        console.error('❌ Could not load service account JSON:', error.message);
    }
}

if (!serviceAccount) {
    console.error('❌ No Firebase credentials found. Set FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_PATH');
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');

    module.exports = { admin, db };
} catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
}
