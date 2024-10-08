const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import individual controllers
const getData = require('../controllers/getDataController');
const getSectorData = require('../controllers/getSectorDataController');
const getRegionData = require('../controllers/getRegionDataController');
const getTotalPKS = require('../controllers/getTotalPKSController');
const getEvents = require('../controllers/getEventsController');

// Routes with auth middleware
router.get('/data', auth, getData);
router.get('/sectorData', auth, getSectorData);
router.get('/regionData', auth, getRegionData);
router.get('/totalPKS', auth, getTotalPKS);
router.get('/eventsArea', auth, getEvents);

module.exports = router;
