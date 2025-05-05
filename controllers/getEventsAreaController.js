const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

/**
 * Helper function to sum a specific column from filtered data
 * @param {Array} data - The filtered data
 * @param {Number} index - The index of the column to sum
 * @returns {Number} The sum of the column values
 */

const sumColumn = (data, index) => 
    data.reduce((total, row) => {
        // Check if the value exists and is a string before applying replace
        const value = row[index];
        if (value && typeof value === 'string') {
            const cleanedValue = value.replace(/,/g, ''); // Remove commas
            const parsedValue = parseFloat(cleanedValue);
            return !isNaN(parsedValue) ? total + parsedValue : total;
        }
        return total; // Skip rows where the value is not valid
    }, 0);

const getAreaData = async (req, res) => {
    const cacheKey = JSON.stringify(req.query);
    const cachedData = getCache(cacheKey);
    if (cachedData) {
        // console.log('Data fetched from cache');
        return res.status(200).json({
            status: 'success',
            data: cachedData
        });
    }

    try {
        const { month, category, action } = req.query;

        // Parse the query parameters to allow multiple filters
        const queryMonths = month ? month.toLowerCase().split(',') : null;
        const queryCategories = category ? category.toLowerCase().split(',') : null;
        const queryActions = action ? action.toLowerCase().split(',') : null;

        const range = `${sheetName}!A2:X`;
        // console.time('Google Sheets API Request');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        // console.timeEnd('Google Sheets API Request');

        const values = response.data.values;
        if (!values) {
            return res.status(404).json({ message: 'No data found' });
        }

        // Filter the data based on multiple possible values in each query parameter
        const filteredData = values.filter(row => {
            const eventMonth = row[21] ? row[21].toLowerCase() : null;   // F column
            const eventCategory = row[20] ? row[20].toLowerCase() : null; // K column
            const eventAction = row[19] ? row[19].toLowerCase() : null;   // J column

            const monthMatch = !queryMonths || queryMonths.includes(eventMonth);
            const categoryMatch = !queryCategories || queryCategories.includes(eventCategory);
            const actionMatch = !queryActions || queryActions.includes(eventAction);

            return monthMatch && categoryMatch && actionMatch;
        });

        // if (filteredData.length === 0) {
        //     return res.status(404).json({ message: 'No matching data found' });
        // }

        // Sum columns: F2:P assumes indices 6, 7, 9, 10, 12, 16 for the relevant columns
        const eventCounts = new Set(filteredData.map(row => row[0])).size;
        const opex = sumColumn(filteredData, 22);          // L column
        const profitability = sumColumn(filteredData, 23); // O column

        const revenue = sumColumn(filteredData, 10);       // M column
        const revenueBaseline = sumColumn(filteredData, 9); // M column
        const deltaRevenue = sumColumn(filteredData, 11);
        const revenueGrowth = deltaRevenue / revenueBaseline * 100;

        const user = sumColumn(filteredData, 13);         // L column
        const deltaUser = sumColumn(filteredData, 14);    // L column
        const userBaseline = sumColumn(filteredData, 12); // L column
        const userGrowth = deltaUser / userBaseline * 100;

        const payload = sumColumn(filteredData, 7);      // K column
        const deltaPayload = sumColumn(filteredData, 8); // K column
        const payloadBaseline = sumColumn(filteredData, 6); // K column
        const payloadGrowth = deltaPayload / payloadBaseline * 100;

        const data = {
            eventCounts,
            totals: {
                opex,
                revenue,
                revenueGrowth,
                profitability,
                payload,
                payloadGrowth,
                user,
                userGrowth
            }
        };
        // Cache the data
        setCache(cacheKey, data);
        // console.log('Data fetched from Google Sheets');
        return res.status(200).json({
            status: 'success',
            data: data
        });

    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        res.status(500).json({ message: 'Error fetching data from Google Sheets' });
    }
};

module.exports = getAreaData;
