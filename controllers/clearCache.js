const { clearAllCache } = require("../utils/cacheUtils");

// Clear all cache data
const clearCache = (req, res) => {
    clearAllCache();
    res.status(200).send("Cache cleared");
};

module.exports = clearCache;