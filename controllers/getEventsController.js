const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getData = async (req, res) => {
    try {
        const {month, category, action} = req.query;

        const range = 'Event 2024!F2:K';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;
        if (!values) {
            return res.status(404).send('No data found');
        }

        // Filter the data based on query parameters
        const filteredData = values.filter(row => {
            const eventMonth = row[0];  // Assuming the first column is the month
            const eventCategory = row[5]; // Assuming the second column is the category
            const eventAction = row[4]; // Assuming the third column is the action
            return (!month || eventMonth === month) &&
                   (!category || eventCategory === category) &&
                   (!action || eventAction === action);
        });

        const eventCounts = filteredData.length;

        res.json(eventCounts);

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getData;
