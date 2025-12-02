// Test with empty environment variables
process.env.MONGO_URL = "";  // Empty string
process.env.JWT_SECRET = undefined;  // Undefined
// EMAIL_FROM not set at all

// Import the validation function
require('./server.js');
