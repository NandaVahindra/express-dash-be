const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getSectorData = async (req, res) => {
    try {
        const range = 'Sheet1!D2:D';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values) {
            res.status(404).send('No data found');
            return;
        }

        const sectorCounts = {};

        values.forEach(row => {
            const sector = row[0];
            if (sector) {
                sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
            }
        });

        const result = Object.keys(sectorCounts).map(sector => ({
            name: sector,
            count: sectorCounts[sector],
        }));

        res.json(result);
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getSectorData;
