const { CollectorApi } = require('../utils/collectorApi');
const textExtraction = require('../utils/textExtraction');
const path = require('path');
const fsSync = require('fs');

async function runTests() {
  console.log('Starting document ingestion tests...\n');
  
  // Initialize services
  const collectorApi = new CollectorApi();
  let types, rawTextResult, extractionResult;
  
  try {
    // Test 1: Check if collector is online
    console.log('Test 1: Checking if collector is online...');
    const online = await collectorApi.online();
    if (!online) {
      console.log('⚠️  Collector service is not running. Please start the collector service first.');
      console.log('Hint: The collector service should be running on port 8888');
      process.exit(1);
    }
    console.log(`✓ Collector online status: ${online}\n`);

    // Test 2: Get accepted file types
    try {
      console.log('Test 2: Getting accepted file types...');
      types = await collectorApi.acceptedFileTypes();
      if (Array.isArray(types)) {
        console.log(`✓ Accepted file types: ${types.join(', ')}\n`);
      } else {
        console.log('⚠️  Unexpected response format for accepted file types');
      }
    } catch (error) {
      console.log('⚠️  Could not get accepted file types:', error.message);
    }

    // Test 3: Process a sample text document
    try {
      console.log('Test 3: Processing raw text...');
      rawTextResult = await collectorApi.processRawText(
        'This is a test document content',
        { source: 'test.txt' }
      );
      if (rawTextResult.success) {
        console.log(`✓ Raw text processing result: ${JSON.stringify(rawTextResult)}\n`);
      } else {
        console.log(`⚠️  Raw text processing failed: ${rawTextResult.reason}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not process raw text:', error.message);
    }

    // Test 4: Process a PDF file if available
    const testPdfPath = path.join(__dirname, 'fixtures', 'Hospital Plan Summary.pdf');
    if (fsSync.existsSync(testPdfPath)) {
      try {
        console.log('Test 4: Extracting text from PDF...');
        extractionResult = await textExtraction.extractText(testPdfPath);
        if (extractionResult && extractionResult.content) {
          console.log(`✓ PDF extraction successful. First 200 chars:\n${extractionResult.content.substring(0, 200)}...\n`);
          
          // Now try to process this PDF through the collector
          console.log('Test 5: Processing PDF through collector...');
          const pdfResult = await collectorApi.processDocument(testPdfPath);
          if (pdfResult.success) {
            console.log(`✓ PDF processing successful through collector\n`);
          } else {
            console.log(`⚠️  PDF processing failed through collector: ${pdfResult.reason}\n`);
          }
        } else {
          console.log('⚠️  PDF extraction returned empty or invalid result\n');
        }
      } catch (error) {
        console.log('⚠️  Could not extract text from PDF:', error.message);
      }
    } else {
      console.log('⚠️  Test PDF file not found:', testPdfPath);
    }

    console.log('\nTest Summary:');
    console.log('-------------');
    console.log('1. Collector Service:', online ? '✓ Online' : '❌ Offline');
    console.log('2. File Types:', types && Array.isArray(types) ? '✓ Available' : '❌ Not available');
    console.log('3. Raw Text Processing:', rawTextResult && rawTextResult.success ? '✓ Working' : '❌ Failed');
    console.log('4. PDF Extraction:', extractionResult && extractionResult.content ? '✓ Working' : '❌ Failed');
    console.log('5. PDF Processing:', extractionResult && extractionResult.content && pdfResult && pdfResult.success ? '✓ Working' : '❌ Failed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
