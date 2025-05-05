const { auth, db } = require('../config/firebase'); // Client SDK for creating users
const admin = require('firebase-admin'); // Admin SDK for token verification/revocation
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { doc, setDoc, getDoc } = require("firebase/firestore");
require('dotenv').config();

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      username,
      email
    });

    const token = await user.getIdToken();
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User data not found in Firestore.' });
    }

    const token = await user.getIdToken(); // ID token valid for 1 hour
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decoded.uid); // This invalidates the session

    res.status(200).json({ message: 'User logged out and refresh tokens revoked' });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({ error: error.message });
  }
};
