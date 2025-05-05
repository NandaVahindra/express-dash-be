require('dotenv').config();
const express = require('express');
const cors = require('cors');  // Import the CORS middleware
const app = express();
const spreadsheetRoutes = require('./routes/spreadsheetRoutes');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const authenticateJWT = require('./middleware/authMiddleware'); // Import JWT auth middleware

// Enable CORS only for the React app running on http://localhost:3000
app.use(cors({
  origin: 'http://localhost:5173',  // Replace with the URL of your frontend
}));

// app.use(bodyParser.json()); // Redundant, express.json() below is sufficient

// Middleware to parse JSON
app.use(express.json());

// Load routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticateJWT.verifyToken, spreadsheetRoutes); // Protect spreadsheet routes with JWT auth

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
