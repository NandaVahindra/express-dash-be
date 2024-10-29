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
        const value = parseFloat(row[index]);
        return !isNaN(value) ? total + value : total;
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

        const range = `${sheetName}!F2:V`;
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
            const eventMonth = row[0] ? row[0].toLowerCase() : null;   // F column
            const eventCategory = row[5] ? row[5].toLowerCase() : null; // K column
            const eventAction = row[4] ? row[4].toLowerCase() : null;   // J column

            const monthMatch = !queryMonths || queryMonths.includes(eventMonth);
            const categoryMatch = !queryCategories || queryCategories.includes(eventCategory);
            const actionMatch = !queryActions || queryActions.includes(eventAction);

            return monthMatch && categoryMatch && actionMatch;
        });

        // if (filteredData.length === 0) {
        //     return res.status(404).json({ message: 'No matching data found' });
        // }

        // Sum columns: F2:P assumes indices 6, 7, 9, 10, 12, 16 for the relevant columns
        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 6);          // L column
        const revenue = sumColumn(filteredData, 7);       // M column
        const profitability = sumColumn(filteredData, 9); // O column
        const payload = sumColumn(filteredData, 12);      // K column
        const user = sumColumn(filteredData, 16);         // L column

        const data = {
            eventCounts,
            totals: {
                opex,
                revenue,
                profitability,
                payload,
                user
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
