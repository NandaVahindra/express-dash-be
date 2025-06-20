const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils'); // Assuming cacheUtils handles TTL if needed

// --- Helper Function (moved outside) ---
/**
 * Helper function to sum a specific column from filtered data.
 * Handles string numbers with commas and actual numbers.
 * @param {Array<Array<any>>} data - The filtered data rows.
 * @param {number} index - The zero-based index of the column to sum.
 * @returns {number} The sum of the column values.
 */
const sumColumn = (data, index) =>
    data.reduce((total, row) => {
        // Ensure row exists and has the required index
        if (!row || index >= row.length) {
            return total;
        }
        const value = row[index];
        if (value === null || value === undefined || value === '') {
             return total; // Skip empty cells explicitly
        }
        if (typeof value === 'string') {
            const cleanedValue = value.replace(/,/g, ''); // Remove commas
            const parsedValue = parseFloat(cleanedValue);
            return !isNaN(parsedValue) ? total + parsedValue : total;
        } else if (typeof value === 'number') {
            // Directly add if it's already a number
            return total + value;
        }
        // Skip rows where the value is not a processable string or number
        return total;
    }, 0);

// --- Cache Key for Raw Data ---
// Define a cache key specifically for the raw sheet data
// This key is independent of request query parameters or region
const rawDataCacheKey = `rawData_${sheetName}`;

// --- Modified Core Logic Function ---
/**
 * Fetches raw data (from cache or API), filters by region and query,
 * processes it, and returns the calculated data.
 * @param {string} region - The region to filter (e.g., 'Jawa Timur'). Case-insensitive matching.
 * @param {object} query - The query parameters { month, category, action }.
 * @returns {Promise<object>} - A promise that resolves with the processed data object.
 * @throws {Error} - Throws an error if fetching or processing fails.
 */
const fetchAndProcessRegionData = async (region, query) => {
    let rawSheetData; // To store the data from Sheets API or cache

    // 1. Check cache for RAW sheet data
    const cachedRawData = getCache(rawDataCacheKey);

    if (cachedRawData) {
        // console.log(`Raw data for ${sheetName} fetched from cache`);
        rawSheetData = cachedRawData;
    } else {
        // console.log(`Workspaceing raw data for ${sheetName} from Google Sheets`);
        // 2. If not in cache, fetch from Google Sheets API
        const range = `${sheetName}!A2:X`; // Fetch all relevant columns
        try {
            // console.time('Google Sheets API Request');
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            // console.timeEnd('Google Sheets API Request');

            const values = response.data.values;

            if (!values || values.length === 0) {
                console.log('No data found in Google Sheet range:', range);
                // Decide how to handle: throw error, or return empty structure?
                // Caching an empty array prevents repeated API calls for an empty sheet.
                setCache(rawDataCacheKey, []); // Cache empty result
                rawSheetData = []; // Use empty data for processing below
            } else {
                 rawSheetData = values; // Store fetched data
                 // 3. Cache the fetched RAW data
                 setCache(rawDataCacheKey, rawSheetData);
                 // console.log(`Raw data for ${sheetName} cached`);
            }
        } catch (apiError) {
            console.error('Google Sheets API Error:', apiError.message || apiError);
             // Re-throw a more specific error for the controller to catch
            throw new Error('Failed to fetch data from Google Sheets API.');
        }
    }

    // --- Processing Stage ---
    // This part now always runs, using rawSheetData from either cache or API

    // 4. Parse query parameters for filtering
    const { month, category, action } = query;
    const queryMonths = month ? month.toLowerCase().split(',') : null;
    const queryCategories = category ? category.toLowerCase().split(',') : null;
    const queryActions = action ? action.toLowerCase().split(',') : null;
    const targetRegionLower = region ? region.toLowerCase() : null; // Prepare region for filtering

    // 5. Filter the RAW data based on region and query parameters
    const filteredData = rawSheetData.filter(row => {
        // Basic row validation
        if (!row || row.length < 24) return false;

        // Adjust indices based on your A2:X range (A=0, ..., E=4, ..., T=19, U=20, V=21, W=22, X=23)
        const eventRegion = row[4] ? String(row[4]).toLowerCase() : null;     // Column E (index 4) - Region
        const eventAction = row[19] ? String(row[19]).toLowerCase() : null;   // Column T (index 19)
        const eventCategory = row[20] ? String(row[20]).toLowerCase() : null; // Column U (index 20)
        const eventMonth = row[21] ? String(row[21]).toLowerCase() : null;    // Column V (index 21)

        // Apply filters
        const regionMatch = !targetRegionLower || eventRegion === targetRegionLower;
        const monthMatch = !queryMonths || (eventMonth && queryMonths.includes(eventMonth));
        const categoryMatch = !queryCategories || (eventCategory && queryCategories.includes(eventCategory));
        const actionMatch = !queryActions || (eventAction && queryActions.includes(eventAction));

        return regionMatch && monthMatch && categoryMatch && actionMatch;
    });

    // Optional: Handle case where filtering results in no data for this specific region/query
    // if (filteredData.length === 0) {
    //     // You might want to return a specific structure indicating no match
    //     return { eventCounts: 0, totals: { /* zeroed out totals */ } };
    // }

    // 6. Perform calculations on the filtered data
    // Verify indices against your A2:X range
    const eventCounts = new Set(filteredData.map(row => row[0])).size; // Column A (index 0) assumed as unique event ID

    const opex = sumColumn(filteredData, 22);          // Column W (index 22)
    const profitability = sumColumn(filteredData, 23); // Column X (index 23)

    const revenueBaseline = sumColumn(filteredData, 9);  // Column J (index 9)
    const revenue = sumColumn(filteredData, 10);         // Column K (index 10)
    const deltaRevenue = sumColumn(filteredData, 11);    // Column L (index 11)
    const revenueGrowth = (revenueBaseline !== 0 && !isNaN(revenueBaseline)) ? (deltaRevenue / revenueBaseline) * 100 : 0;

    const userBaseline = sumColumn(filteredData, 12); // Column M (index 12)
    const user = sumColumn(filteredData, 13);         // Column N (index 13)
    const deltaUser = sumColumn(filteredData, 14);    // Column O (index 14)
    const userGrowth = (userBaseline !== 0 && !isNaN(userBaseline)) ? (deltaUser / userBaseline) * 100 : 0;

    const payloadBaseline = sumColumn(filteredData, 6); // Column G (index 6)
    const payload = sumColumn(filteredData, 7);         // Column H (index 7)
    const deltaPayload = sumColumn(filteredData, 8);    // Column I (index 8)
    const payloadGrowth = (payloadBaseline !== 0 && !isNaN(payloadBaseline)) ? (deltaPayload / payloadBaseline) * 100 : 0;

    // 7. Structure the final response data
    const processedData = {
        eventCounts,
        totals: {
            opex,
            profitability,
            revenue,
            revenueGrowth: isFinite(revenueGrowth) ? revenueGrowth : 0, // Ensure finite number
            user,
            userGrowth: isFinite(userGrowth) ? userGrowth : 0, // Ensure finite number
            payload,
            payloadGrowth: isFinite(payloadGrowth) ? payloadGrowth : 0 // Ensure finite number
            // Include baseline/delta values if needed by the frontend
        }
    };

    // 8. Return the processed data (Controllers will handle the response)
    return processedData;
};

// --- Controllers ---
// Each controller now calls the central function and handles the response
const getEJRegionData = async (req, res) => {
    try {
        const data = await fetchAndProcessRegionData('Jawa Timur', req.query);
        res.status(200).json({
            status: 'success',
            message: 'Data retrieved successfully for Jawa Timur',
            data: data
        });
    } catch (error) {
        console.error('Error in getEJRegionData controller:', error.message || error);
        // Send an appropriate error response
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to retrieve data for Jawa Timur.'
         });
    }
};

const getCJRegionData = async (req, res) => {
     try {
        const data = await fetchAndProcessRegionData('Jawa Tengah', req.query);
        res.status(200).json({
            status: 'success',
            message: 'Data retrieved successfully for Jawa Tengah',
            data: data
        });
    } catch (error) {
        console.error('Error in getCJRegionData controller:', error.message || error);
        res.status(500).json({
             status: 'error',
             message: error.message || 'Failed to retrieve data for Jawa Tengah.'
         });
    }
};

const getBNRegionData = async (req, res) => {
     try {
        const data = await fetchAndProcessRegionData('Bali Nusra', req.query);
        res.status(200).json({
            status: 'success',
            message: 'Data retrieved successfully for Bali Nusra',
            data: data
        });
    } catch (error) {
        console.error('Error in getBNRegionData controller:', error.message || error);
        res.status(500).json({
             status: 'error',
             message: error.message || 'Failed to retrieve data for Bali Nusra.'
         });
    }
};

module.exports = { getEJRegionData, getCJRegionData, getBNRegionData };