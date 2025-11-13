
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure to set your service account key in your environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}

const db = admin.firestore();

module.exports = { db };