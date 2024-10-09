const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import individual controllers
const getData = require('../controllers/getDataController');
const getSectorData = require('../controllers/getSectorDataController');
const getRegionData = require('../controllers/getRegionDataController');
const getTotalPKS = require('../controllers/getTotalPKSController');
const getEvents = require('../controllers/getEventsAreaController');
const getEventsEJRegion = require('../controllers/getEventsRegionController').getEJRegionData;
const getEventsCJRegion = require('../controllers/getEventsRegionController').getCJRegionData;
const getEventsBNRegion = require('../controllers/getEventsRegionController').getBNRegionData;

// Routes with auth middleware
router.get('/data', auth, getData);
router.get('/sectorData', auth, getSectorData);
router.get('/regionData', auth, getRegionData);
router.get('/totalPKS', auth, getTotalPKS);
router.get('/eventsArea', auth, getEvents);
router.get('/eventsEJRegion', auth, getEventsEJRegion);
router.get('/eventsCJRegion', auth, getEventsCJRegion);
router.get('/eventsBNRegion', auth, getEventsBNRegion);

module.exports = router;
