// cacheUtils.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 120 });

// Cache helper functions
function setCache(key, value) {
    cache.set(key, value);
}

function getCache(key) {
    return cache.get(key);
}

function clearAllCache() {
    cache.flushAll();
    console.log("All cache cleared");
}

// Export the cache instance and helper functions
module.exports = {
    cache,
    setCache,
    getCache,
    clearAllCache,
};
