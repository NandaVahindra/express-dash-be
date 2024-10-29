const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

/**
 * Helper function to fetch and filter region data from Google Sheets
 * @param {string} region - The region to filter (e.g., 'Jawa Timur', 'Jawa Tengah', 'Bali Nusra')
 * @param {object} query - The query parameters (month, category, action)
 * @param {object} res - The response object to send the result
 */
const fetchRegionData = async (region, query, res) => {
    const cacheKey = `${region}-${JSON.stringify(query)}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
        // console.log('Data fetched from cache');
        return res.status(200).json({
            status: 'success',
            data: cachedData
        });
    }

    try {
        const { month, category, action } = query;

        // Fetch data from Google Sheets
        const range = `${sheetName}!D2:V`;
        // console.time(`Fetching data for region: ${region}`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        // console.timeEnd(`Fetching data for region: ${region}`);

        const values = response.data.values;
        if (!values) {
            return res.status(404).send('No data found');
        }

        // Process query parameters into arrays for multiple filters
        const queryMonths = month ? month.toLowerCase().split(',') : null;
        const queryCategories = category ? category.toLowerCase().split(',') : null;
        const queryActions = action ? action.toLowerCase().split(',') : null;

        // Filter the data based on query parameters and region
        const filteredData = values.filter(row => {
            const eventRegion = row[0] ? row[0].toLowerCase() : null;
            const eventMonth = row[2] ? row[2].toLowerCase() : null;
            const eventCategory = row[7] ? row[7].toLowerCase() : null;
            const eventAction = row[6] ? row[6].toLowerCase() : null;

            const monthMatch = !queryMonths || queryMonths.includes(eventMonth);
            const categoryMatch = !queryCategories || queryCategories.includes(eventCategory);
            const actionMatch = !queryActions || queryActions.includes(eventAction);
            const regionMatch = !region || eventRegion === region.toLowerCase();

            return regionMatch && monthMatch && categoryMatch && actionMatch;
        });

        // // Early return if no data matches the filters
        // if (filteredData.length === 0) {
        //     return res.status(404).json({ message: 'No matching data found' });
        // }

        // Helper function to sum up column values
        const sumColumn = (data, index) => 
            data.reduce((total, row) => {
                const value = Number(row[index]);
                return !isNaN(value) ? total + value : total;
            }, 0);

        // Calculate the sums for the filtered data
        const eventCounts = filteredData.length;
        const opex = sumColumn(filteredData, 8);
        const revenue = sumColumn(filteredData, 9);
        const profitability = sumColumn(filteredData, 11);
        const payload = sumColumn(filteredData, 14);
        const user = sumColumn(filteredData, 18);

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

        // Send the response
        return res.status(200).json({
            status: 'success',
            data: data
        });

    } catch (error) {
        console.error(`Error fetching data for region ${region}:`, error);
        return res.status(500).send('Error fetching data from Google Sheets');
    }
};

// Controllers
const getEJRegionData = async (req, res) => {
    await fetchRegionData('Jawa Timur', req.query, res);
};

const getCJRegionData = async (req, res) => {
    await fetchRegionData('Jawa Tengah', req.query, res);
};

const getBNRegionData = async (req, res) => {
    await fetchRegionData('Bali Nusra', req.query, res);
};

module.exports = { getEJRegionData, getCJRegionData, getBNRegionData };
