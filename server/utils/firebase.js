const admin = require('firebase-admin');

// We initialize Firebase Admin here if the environment variables are present.
// The user should set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Alternatively, they can provide a service account JSON path in GOOGLE_APPLICATION_CREDENTIALS

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Replace literal \n with actual newlines if necessary
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin initialized via env variables.');
        } else {
            // Try default initialization (requires GOOGLE_APPLICATION_CREDENTIALS)
            admin.initializeApp();
            console.log('Firebase Admin initialized via default credentials.');
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error.message);
    }
}

module.exports = admin;
