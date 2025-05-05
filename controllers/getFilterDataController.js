const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

/**
 * Helper function to fetch, deduplicate, and sort Google Sheets data
 * @param {string} range - The range to fetch from Google Sheets
 * @param {string[]} orderArray - The array to use for custom sorting
 * @param {string} errorMessage - The error message to return if no data is found
 * @param {object} res - The response object to send the results
 */
const fetchAndSortData = async (range, orderArray, errorMessage, res) => {
    const cacheKey = range;

    // Check if the data is already in the cache
    const cachedData = getCache(cacheKey);
    if (cachedData) {
        // console.log('Data fetched from cache');
        return res.status(200).json({
            status: 'success',
            data: cachedData
        });
    }
    try {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const values = response.data.values;

        if (!values || values.length === 0) {
            return res.status(404).json({ message: errorMessage });
        }

        // Filter out null, undefined, empty string values, and "#N/A", then convert to uppercase
        const uniqueItems = [...new Set(values
            .map(row => row[0])
            .filter(item => item && item.trim() && item !== '#N/A') // Remove null, undefined, empty values, and "#N/A"
            .map(item => item.toUpperCase()) // Convert to uppercase
        )];

        // Sort based on the order array
        const sortedItems = uniqueItems.sort((a, b) => {
            return orderArray.indexOf(a) - orderArray.indexOf(b);
        });

        // Cache the sorted data
        setCache(cacheKey, sortedItems);

        res.status(200).json({
            status: 'success',
            data: sortedItems
        });
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

// Controllers
const getMonth = async (req, res) => {
    const monthOrder = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const range = `${sheetName}!V2:V`;
    const errorMessage = 'No month data found';
    await fetchAndSortData(range, monthOrder, errorMessage, res);
};

const getAction = async (req, res) => {
    const actionOrder = [
        "OPTIM SITE", "INSTALL EASYMACRO", "INSTALL MASSIVEMIMO", "INSTALL CMON", "INSTALL COMBAT", "INSTALL REPEATER", 
        "ADD SECTOR", "ADD NEW NE"
    ];
    const range = `${sheetName}!T2:T`;
    const errorMessage = 'No action data found';
    await fetchAndSortData(range, actionOrder, errorMessage, res);
};

const getCategory = async (req, res) => {
    const categoryOrder = [
        "LOCAL", "VIP EVENT", "INTERNATIONAL", "ENTERPRISE", "INTERNAL"
    ];
    const range = `${sheetName}!U2:U`;
    const errorMessage = 'No category data found';
    await fetchAndSortData(range, categoryOrder, errorMessage, res);
};

module.exports = { getMonth, getAction, getCategory };
