const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const { setCache, getCache } = require('../utils/cacheUtils');

// --- Helper Function to Fetch Data ---
const fetchTableData = async (range) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        // Return empty array if no values, let the caller handle it
        return response.data.values || [];
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        // Rethrow a more specific error or handle as needed
        throw new Error('Failed to fetch data from Google Sheets');
    }
};

// --- Helper Function to Structure Data ---
// Takes the raw rows from Google Sheets and returns an array of objects
const structureData = (rawData) => {
    if (!rawData || rawData.length === 0) {
        return [];
    }
    // Assumes the first row fetched (A2:X) is data, not headers
    return rawData.map(row => ({
        id: row[0] || null,          // A column
        name: row[1] || '',          // B column
        startDate: row[2] || null,   // C column
        endDate: row[3] || null,     // D column
        // Add other columns as needed, ensure index is correct
        payload: row[7] || null,     // H column
        revenue: row[10] || null,    // K column - Convert to number if appropriate
        user: row[13] || null        // N column
        // Add more columns by index if necessary (up to X - index 23)
    })).filter(item => item.id); // Basic filter: ensure at least an ID exists
    // Add more robust filtering/validation if needed
};


// --- Main Route Handler ---
const getTableData = async (req, res) => {
    const range = `${sheetName}!A2:X`; // Fetch from row 2 downwards in columns A to X
    const cacheKey = 'tableData_structured'; // Use a distinct key for structured data
    let allStructuredData = [];

    try {
        // 1. Check Cache for *Structured* Data
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            console.log("Serving structured data from cache");
            allStructuredData = cachedData;
        } else {
            console.log("Fetching data from Google Sheets");
            const fetchedRawData = await fetchTableData(range);

            if (fetchedRawData.length === 0) {
                 console.log('No data found in the specified sheet range.');
                 // Decide how to handle: empty array response or error?
                 // Sending empty array is often better for tables.
                 return res.status(200).json({
                     status: 'success',
                     data: [],
                     pagination: {
                         totalItems: 0,
                         totalPages: 0,
                         currentPage: 1,
                         limit: 20 // Or use default limit
                     }
                 });
            }

            // 2. Structure the raw data
            allStructuredData = structureData(fetchedRawData);

            // 3. Cache the *Structured* Data (Set TTL as appropriate)
            // Cache for 1 hour (3600 seconds) - adjust as needed
            setCache(cacheKey, allStructuredData);
            console.log("Structured data cached.");
        }

        // 4. Apply Sorting (if requested)
        const { sortBy, sortOrder = 'asc' } = req.query; // Default to ascending
        let sortedData = [...allStructuredData]; // Create a copy to sort

        if (sortBy && typeof sortedData[0]?.[sortBy] !== 'undefined') {
            console.log(`Sorting by: ${sortBy}, Order: ${sortOrder}`);
            sortedData.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];

                // Basic comparison - enhance if specific types need different logic (dates, numbers)
                let comparison = 0;
                if (valA > valB) {
                    comparison = 1;
                } else if (valA < valB) {
                    comparison = -1;
                }
                // Add specific handling for numbers if revenue needs numeric sort
                if (sortBy === 'revenue') {
                    const numA = parseFloat(valA) || 0;
                    const numB = parseFloat(valB) || 0;
                    comparison = numA - numB;
                }
                // Add specific handling for dates if needed
                if (sortBy === 'startDate' || sortBy === 'endDate') {
                    const dateA = new Date(valA);
                    const dateB = new Date(valB);
                    comparison = dateA - dateB;
                }


                return sortOrder.toLowerCase() === 'desc' ? (comparison * -1) : comparison;
            });
        } else if (sortBy) {
             console.warn(`Attempted to sort by invalid field: ${sortBy}`);
        }


        // 5. Apply Pagination
        const page = parseInt(req.query.page, 10) || 1; // Default to page 1
        const limit = parseInt(req.query.limit, 10) || 20; // Default to 20 items per page
        const totalItems = sortedData.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Ensure page requested is valid
        const currentPage = (page > 0 && page <= totalPages) ? page : 1;
        const paginatedData = sortedData.slice(startIndex, endIndex);

        console.log(`Pagination: Page ${currentPage}/${totalPages}, Limit ${limit}, Total ${totalItems}`);


        // 6. Send Response
        return res.status(200).json({
            status: 'success',
            data: paginatedData,
            pagination: {
                totalItems,
                totalPages,
                currentPage, // Use the validated current page
                limit
            }
        });

    } catch (error) {
        // Catch errors from fetching, structuring, or processing
        console.error('Error processing table data:', error);
        // Avoid sending detailed internal errors to the client in production
        return res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve or process table data. ' + error.message // Include error message for debugging
        });
    }
};

module.exports = {
    getTableData
    // Export other functions if needed elsewhere
};