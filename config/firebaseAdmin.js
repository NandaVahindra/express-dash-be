// Firebase Admin SDK initialization
const admin = require('firebase-admin');

// TODO: Replace with your service account key
const serviceAccount = require('./googleServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;