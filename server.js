require('dotenv').config();
const express = require('express');
const app = express();
const spreadsheetRoutes = require('./routes/spreadsheetRoutes');

// Middleware to parse JSON
app.use(express.json());

// Load routes
app.use('/api', spreadsheetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
