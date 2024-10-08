const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getData = async (req, res) => {
    try {
        const range = 'Event 2024!D2:D';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        res.json(response.data.values);
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getData;
