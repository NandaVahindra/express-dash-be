require('dotenv').config();
const express = require('express');
const cors = require('cors');  // Import the CORS middleware
const app = express();
const spreadsheetRoutes = require('./routes/spreadsheetRoutes');

// Enable CORS only for the React app running on http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',  // Replace with the URL of your frontend
}));

// Middleware to parse JSON
app.use(express.json());

// Load routes
app.use('/api', spreadsheetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
