const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getRegionData = async (req, res) => {
    try {
        const range = 'Sheet1!H2:H';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values) {
            res.status(404).send('No data found');
            return;
        }

        const regionCounts = {};

        values.forEach(row => {
            const region = row[0];
            if (region) {
                regionCounts[region] = (regionCounts[region] || 0) + 1;
            }
        });

        const result = Object.keys(regionCounts).map(region => ({
            name: region,
            count: regionCounts[region],
        }));

        res.json(result);
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getRegionData;
