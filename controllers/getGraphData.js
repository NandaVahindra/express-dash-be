const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

const getGraphData = async (req, res) => {
    const cacheKey = 'graphData';
    // Check if the data is already in the cache
    const cachedData = getCache(cacheKey);
    if (cachedData) {
        return res.status(200).json({
            status: 'success',
            data: cachedData
        });
    }

    try {
        const range = `${sheetName}!A2:X`; // Adjust the range as needed
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const values = response.data.values;

        if (!values || values.length === 0) {
            return res.status(404).json({ message: 'Graph data not found' });
        }

        const regionData = {}; // Store sums by region and month

        values.forEach(row => {
            const month = row[21]; // Assuming first column is month
            const region = row[4]; // Assuming second column is region 
            const columnsToSum = [22, 10, 23, 7, 13];
            
            // Initialize the region object if it doesn't exist
            if (!regionData[region]) {
                regionData[region] = {};
            }

            // Initialize the month object for the region if it doesn't exist
            if (!regionData[region][month]) {
                regionData[region][month] = {
                    opex: 0,
                    revenue: 0,
                    profitability: 0,
                    payload: 0,
                    user: 0
                };
            }

          // Sum the values for each relevant column
          columnsToSum.forEach((col, index) => {
            // Clean the value by removing commas and convert to float
            const value = row[col];
            let parsedValue = 0;

            if (value && typeof value === 'string') {
                const cleanedValue = value.replace(/,/g, ''); // Remove commas
                parsedValue = parseFloat(cleanedValue); // Convert to float
            }

            // Only sum if parsed value is a valid number
            if (!isNaN(parsedValue)) {
                // Sum the values based on the column index
                switch (index) {
                    case 0:
                        regionData[region][month].opex += parsedValue;
                        break;
                    case 1:
                        regionData[region][month].revenue += parsedValue;
                        break;
                    case 2:
                        regionData[region][month].profitability += parsedValue;
                        break;
                    case 3:
                        regionData[region][month].payload += parsedValue;
                        break;
                    case 4:
                        regionData[region][month].user += parsedValue;
                        break;
                    default:
                        break;
                    }
                }
            });
        });

        // Convert regionData to an array of formatted data
        const result = Object.keys(regionData).map(region => ({
            region,
            months: Object.keys(regionData[region]).map(month => ({
                month,
                ...regionData[region][month]
            }))
        }));

        // Store in cache
        setCache(cacheKey, result);

        return res.status(200).json({
            status: 'success',
            data: result
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = getGraphData;