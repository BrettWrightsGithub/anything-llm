// Load environment variables for tests
const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '.env.test') });

process.env.NODE_ENV = 'test';
process.env.CHROMA_ENDPOINT = 'http://localhost:8000';
process.env.SERVER_URL = 'http://localhost:3001';
