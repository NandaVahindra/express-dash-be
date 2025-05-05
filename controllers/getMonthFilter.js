const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');


// Controllers
const getMonth = async (req, res) => {
    const monthOrder = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", 
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];
    const range = `RAW!A2:A`;
    const errorMessage = 'No month data found';
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

        const slicedValues = values.map(item => item[0].substring(5, 7));
        const uniqueItems = [...new Set(slicedValues.flat())];

        const monthInWords = uniqueItems.map(item => {
            const monthIndex = parseInt(item, 10) - 1;
            return monthOrder[monthIndex];
        });

        // Cache the sorted data
        setCache(cacheKey, monthInWords);

        res.status(200).json({
            status: 'success',
            data: monthInWords
        });
    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = getMonth;