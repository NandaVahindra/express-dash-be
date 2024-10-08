const { google } = require('googleapis');
const fs = require('fs');

// Load credentials from the service account JSON file
const credentials = JSON.parse(fs.readFileSync('config/credentials.json'));

// Authorize a client with credentials
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create a Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

module.exports = sheets;
