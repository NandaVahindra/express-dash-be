const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;

const getData = async (req, res) => {
    try {
        const {month, category, action} = req.query;

        const range = 'Event 2024!F2:P';
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

        // Sum the required columns safely, checking for valid numbers
        const sumColumn = (data, index) => 
            data.reduce((total, row) => {
                const value = Number(row[index]);
                return !isNaN(value) ? total + value : total;
            }, 0);

        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 6);
        const revenue = sumColumn(filteredData, 7);
        const profitability = sumColumn(filteredData, 9);
        const payload = sumColumn(filteredData, 10);

        const result = {
            eventCounts,
            opex,
            profitability,
            revenue,
            payload
        };
        // Return the result in a structured response
        return res.status(200).json({
            status: 'success',
            data: {
                eventCounts,
                totals: {
                    opex,
                    revenue,
                    profitability,
                    payload
                }
            }
        });

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getData;
