require('dotenv').config();
const jwt = require('jsonwebtoken');

// Load the secret key from environment variables
const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
    throw new Error('Secret key is not defined');
}

// Generate a token with an empty payload and no expiration
const token = jwt.sign({}, secretKey);

console.log('Generated Token:', token);
