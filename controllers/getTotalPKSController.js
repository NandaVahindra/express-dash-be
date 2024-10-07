const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getTotalPKS = async (req, res) => {
    try {
        const range = 'Sheet1!O2:O';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values) {
            res.status(404).send('No data found');
            return;
        }

        let sum = 0;

        values.forEach(row => {
            const formattedNumber = row[0];
            if (formattedNumber) {
                const cleanedNumber = formattedNumber.replace(/,/g, '');
                const number = parseFloat(cleanedNumber);
                if (!isNaN(number)) {
                    sum += number;
                }
            }
        });

        const result = { totalPKS: sum };
        res.json(result);
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getTotalPKS;
