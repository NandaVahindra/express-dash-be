const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils'); // Assuming cacheUtils handles TTL if needed

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
        } else if (typeof value === 'number') {
             // Directly add if it's already a number
             return total + value;
        }
        // Skip rows where the value is not a valid string or number
        return total;
    }, 0);

// Define a cache key specifically for the raw sheet data
// This key is independent of request query parameters
const rawDataCacheKey = `rawData_${sheetName}`;

const getAreaData = async (req, res) => {
    let rawSheetData; // To store the data from Sheets API or cache

    try {
        // 1. Check cache for RAW sheet data
        const cachedRawData = getCache(rawDataCacheKey);

        if (cachedRawData) {
            // console.log('Raw data fetched from cache');
            rawSheetData = cachedRawData;
        } else {
            // console.log('Fetching raw data from Google Sheets');
            // 2. If not in cache, fetch from Google Sheets API
            const range = `${sheetName}!A2:X`; // Fetch all relevant columns
            // console.time('Google Sheets API Request');
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            // console.timeEnd('Google Sheets API Request');

            const values = response.data.values;

            if (!values || values.length === 0) {
                // Handle case where the sheet itself is empty or API returned nothing
                // Cache an empty array to prevent repeated API calls for an empty sheet? Optional.
                // setCache(rawDataCacheKey, []); // Cache empty result if desired
                console.log('No data found in Google Sheet range:', range);
                return res.status(404).json({ status: 'error', message: 'No data found in source sheet' });
            }

            rawSheetData = values; // Store fetched data

            // 3. Cache the fetched RAW data
            // Consider adding a TTL (Time-To-Live) in your setCache function
            setCache(rawDataCacheKey, rawSheetData);
            // console.log('Raw data cached');
        }

        // --- Processing Stage ---
        // This part now always runs, using rawSheetData from either cache or API

        // 4. Parse query parameters for filtering
        const { month, category, action } = req.query;
        const queryMonths = month ? month.toLowerCase().split(',') : null;
        const queryCategories = category ? category.toLowerCase().split(',') : null;
        const queryActions = action ? action.toLowerCase().split(',') : null;

        // 5. Filter the RAW data based on query parameters
        const filteredData = rawSheetData.filter(row => {
            // Ensure row has enough columns to avoid errors
            if (!row || row.length < 24) return false;

            // Adjust indices based on your A2:X range (A=0, B=1, ..., J=9, K=10, L=11, ..., T=19, U=20, V=21, W=22, X=23)
            const eventAction = row[19] ? String(row[19]).toLowerCase() : null;   // Column T
            const eventCategory = row[20] ? String(row[20]).toLowerCase() : null; // Column U
            const eventMonth = row[21] ? String(row[21]).toLowerCase() : null;    // Column V

            const monthMatch = !queryMonths || (eventMonth && queryMonths.includes(eventMonth));
            const categoryMatch = !queryCategories || (eventCategory && queryCategories.includes(eventCategory));
            const actionMatch = !queryActions || (eventAction && queryActions.includes(eventAction));

            return monthMatch && categoryMatch && actionMatch;
        });

        // Optional: Check if filtering resulted in no data
        // if (filteredData.length === 0) {
        //     return res.status(404).json({ status: 'success', message: 'No data matches the specified filters', data: { eventCounts: 0, totals: {} } });
        // }

        // 6. Perform calculations on the filtered data
        // Verify indices against your A2:X range
        const eventCounts = new Set(filteredData.map(row => row[0])).size; // Column A (index 0) assumed as unique event ID

        const opex = sumColumn(filteredData, 22);          // Column W (index 22)
        const profitability = sumColumn(filteredData, 23); // Column X (index 23) - Assuming this is Profitability

        // Double-check these column indices based on A2:X range
        const revenueBaseline = sumColumn(filteredData, 9);  // Column J (index 9) - Assuming Baseline Revenue
        const revenue = sumColumn(filteredData, 10);         // Column K (index 10) - Assuming Actual Revenue
        const deltaRevenue = sumColumn(filteredData, 11);    // Column L (index 11) - Assuming Delta Revenue
        const revenueGrowth = (revenueBaseline !== 0) ? (deltaRevenue / revenueBaseline) * 100 : 0; // Avoid division by zero

        const userBaseline = sumColumn(filteredData, 12); // Column M (index 12) - Assuming Baseline User
        const user = sumColumn(filteredData, 13);         // Column N (index 13) - Assuming Actual User
        const deltaUser = sumColumn(filteredData, 14);    // Column O (index 14) - Assuming Delta User
        const userGrowth = (userBaseline !== 0) ? (deltaUser / userBaseline) * 100 : 0; // Avoid division by zero

        const payloadBaseline = sumColumn(filteredData, 6); // Column G (index 6) - Assuming Baseline Payload
        const payload = sumColumn(filteredData, 7);         // Column H (index 7) - Assuming Actual Payload
        const deltaPayload = sumColumn(filteredData, 8);    // Column I (index 8) - Assuming Delta Payload
        const payloadGrowth = (payloadBaseline !== 0) ? (deltaPayload / payloadBaseline) * 100 : 0; // Avoid division by zero


        // 7. Structure the final response data
        const responseData = {
            eventCounts,
            totals: {
                opex,
                profitability, // Added profitability based on index 23
                revenue,
                // revenueBaseline, // Include if needed
                // deltaRevenue, // Include if needed
                revenueGrowth: isFinite(revenueGrowth) ? revenueGrowth : 0, // Ensure finite number
                user,
                // userBaseline, // Include if needed
                // deltaUser, // Include if needed
                userGrowth: isFinite(userGrowth) ? userGrowth : 0, // Ensure finite number
                payload,
                // payloadBaseline, // Include if needed
                // deltaPayload, // Include if needed
                payloadGrowth: isFinite(payloadGrowth) ? payloadGrowth : 0 // Ensure finite number
            }
        };

        // 8. Return the processed data
        return res.status(200).json({
            status: 'success',
            data: responseData
        });

    } catch (error) {
        // Log the specific error
        console.error('Error in getAreaData controller:', error);

        // Distinguish between API errors and processing errors if possible
        if (error.response && error.response.data) { // Google API specific error
             console.error('Google Sheets API Error:', error.response.data.error);
             return res.status(500).json({ status: 'error', message: 'Error fetching data from Google Sheets API' });
        } else { // General processing error
            return res.status(500).json({ status: 'error', message: 'Internal server error during data processing' });
        }
    }
};

module.exports = getAreaData;