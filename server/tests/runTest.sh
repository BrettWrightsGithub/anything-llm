#!/bin/bash

# Set environment variables
export NODE_ENV=development
export STORAGE_DIR="./storage"
export COLLECTOR_PORT=8888
export TEXT_EXTRACTION_URL="http://localhost:3005"

# Run the test
node tests/simpleDocTest.js
