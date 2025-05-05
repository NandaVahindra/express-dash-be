const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

const mapCategories = (value) => {
    if (/Add New NE/i.test(value)) return 'AddNe';
    if (/CMON/i.test(value)) return 'CMON';
    if (/Combat/i.test(value)) return 'Combat';
    if (/easymacro/i.test(value)) return 'easymacro';
    if (/MassiveMIMO/i.test(value)) return 'massivemimo';
    if (/Repeater/i.test(value)) return 'repeater';
    if (/Optim Site/i.test(value)) return 'optim';
    return 'unknown';
  };

const getActionSummary = async (req, res) => {

    const range = `${sheetName}!T2:T`;
    const cacheKey = 'actionSummary';

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

        const rows = response.data.values;
        const counts = {
            AddNe: 0,
            CMON: 0,
            Combat: 0,
            easymacro: 0,
            massivemimo: 0,
            repeater: 0,
            optim: 0,
          };

          rows.forEach(([value]) => {
            const category = mapCategories(value);
            if (counts[category] !== undefined) {
              counts[category]++;
            }
          });

        // Cache the data
        setCache(cacheKey, counts);

        res.status(200).json({
            status: 'success',
            data: counts
        });

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
}

module.exports = getActionSummary;