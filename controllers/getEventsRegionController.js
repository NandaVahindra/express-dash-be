const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;

const getEJRegionData = async (req, res) => {
    try {
        const {month, category, action} = req.query;
        const region = 'Jawa Timur';

        const range = `${sheetName}!D2:P`;
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
            const eventRegion = row[0] ? row[0].toLowerCase() : null;
            const eventMonth = row[2] ? row[2].toLowerCase() : null;  
            const eventCategory = row[7] ? row[7].toLowerCase() : null; 
            const eventAction = row[6] ? row[6].toLowerCase() : null; 
            return (!region || eventRegion === region.toLowerCase()) &&
                   (!month || eventMonth === month.toLowerCase()) &&
                   (!category || eventCategory === category.toLowerCase()) &&
                   (!action || eventAction === action.toLowerCase());
        });

        // Sum the required columns safely, checking for valid numbers
        const sumColumn = (data, index) => 
            data.reduce((total, row) => {
                const value = Number(row[index]);
                return !isNaN(value) ? total + value : total;
            }, 0);

        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 8);
        const revenue = sumColumn(filteredData, 9);
        const profitability = sumColumn(filteredData, 11);
        const payload = sumColumn(filteredData, 12);

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

const getCJRegionData = async (req, res) => {
    try {
        const {month, category, action} = req.query;
        const region = 'Jawa Tengah';

        const range = `${sheetName}!D2:P`;
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
            const eventRegion = row[0] ? row[0].toLowerCase() : null;
            const eventMonth = row[2] ? row[2].toLowerCase() : null;  
            const eventCategory = row[7] ? row[7].toLowerCase() : null; 
            const eventAction = row[6] ? row[6].toLowerCase() : null; 
            return (!region || eventRegion === region.toLowerCase()) &&
                   (!month || eventMonth === month.toLowerCase()) &&
                   (!category || eventCategory === category.toLowerCase()) &&
                   (!action || eventAction === action.toLowerCase());
        });

        // Sum the required columns safely, checking for valid numbers
        const sumColumn = (data, index) => 
            data.reduce((total, row) => {
                const value = Number(row[index]);
                return !isNaN(value) ? total + value : total;
            }, 0);

        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 8);
        const revenue = sumColumn(filteredData, 9);
        const profitability = sumColumn(filteredData, 11);
        const payload = sumColumn(filteredData, 12);

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

const getBNRegionData = async (req, res) => {
    try {
        const {month, category, action} = req.query;
        const region = 'Bali Nusra';

        const range = `${sheetName}!D2:P`;
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
            const eventRegion = row[0] ? row[0].toLowerCase() : null;
            const eventMonth = row[2] ? row[2].toLowerCase() : null;  
            const eventCategory = row[7] ? row[7].toLowerCase() : null; 
            const eventAction = row[6] ? row[6].toLowerCase() : null; 
            return (!region || eventRegion === region.toLowerCase()) &&
                   (!month || eventMonth === month.toLowerCase()) &&
                   (!category || eventCategory === category.toLowerCase()) &&
                   (!action || eventAction === action.toLowerCase());
        });

        // Sum the required columns safely, checking for valid numbers
        const sumColumn = (data, index) => 
            data.reduce((total, row) => {
                const value = Number(row[index]);
                return !isNaN(value) ? total + value : total;
            }, 0);

        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 8);
        const revenue = sumColumn(filteredData, 9);
        const profitability = sumColumn(filteredData, 11);
        const payload = sumColumn(filteredData, 12);

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

module.exports = { getEJRegionData, getCJRegionData, getBNRegionData };
