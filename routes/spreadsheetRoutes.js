const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import individual controllers
const getEvents = require('../controllers/getEventsAreaController');
const getEventsEJRegion = require('../controllers/getEventsRegionController').getEJRegionData;
const getEventsCJRegion = require('../controllers/getEventsRegionController').getCJRegionData;
const getEventsBNRegion = require('../controllers/getEventsRegionController').getBNRegionData;
const getMonth = require('../controllers/getFilterDataController').getMonth;
const getAction = require('../controllers/getFilterDataController').getAction;
const getCategory = require('../controllers/getFilterDataController').getCategory;

// Routes with auth middleware
router.get('/eventsArea', auth, getEvents);
router.get('/eventsEJRegion', auth, getEventsEJRegion);
router.get('/eventsCJRegion', auth, getEventsCJRegion);
router.get('/eventsBNRegion', auth, getEventsBNRegion);
router.get('/months', auth, getMonth);
router.get('/actions', auth, getAction);
router.get('/categories', auth, getCategory);

module.exports = router;
