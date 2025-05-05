const express = require('express');
const router = express.Router();
// const auth = require('../middleware/authMiddleware'); // Import the auth middleware

// Import individual controllers
const getEvents = require('../controllers/getEventsAreaController');
const getEventsEJRegion = require('../controllers/getEventsRegionController').getEJRegionData;
const getEventsCJRegion = require('../controllers/getEventsRegionController').getCJRegionData;
const getEventsBNRegion = require('../controllers/getEventsRegionController').getBNRegionData;
const getMonth = require('../controllers/getFilterDataController').getMonth;
const getAction = require('../controllers/getFilterDataController').getAction;
const getCategory = require('../controllers/getFilterDataController').getCategory;
const clearCache = require('../controllers/clearCache');
const getGraphData = require('../controllers/getGraphData');
const getActionSummary = require('../controllers/getActionSummary');
const {getTableData} = require('../controllers/getTableData');



// Routes with auth middleware
router.get('/eventsArea', getEvents);
router.get('/eventsEJRegion', getEventsEJRegion);
router.get('/eventsCJRegion', getEventsCJRegion);
router.get('/eventsBNRegion', getEventsBNRegion);
router.get('/months', getMonth);
router.get('/actions', getAction);
router.get('/categories', getCategory);
router.get('/graphData', getGraphData);
router.get('/tableData', getTableData);
router.get('/actionSummary', getActionSummary);
router.post('/clearCache', clearCache);


module.exports = router;
