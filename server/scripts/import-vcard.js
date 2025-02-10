const VCardImporter = require('../utils/vcard-importer');

async function importVCard(filePath) {
  try {
    console.log(`Importing vCard from: ${filePath}`);
    const results = await VCardImporter.importFromFile(filePath);
    
    console.log('\nImport Results:');
    console.log(`Successfully imported ${results.success.length} contacts`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors encountered (${results.errors.length}):`);
      results.errors.forEach(error => {
        console.log(`- ${error.name}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a path to your vCard file.');
  console.log('Usage: node import-vcard.js path/to/contacts.vcf');
  process.exit(1);
}

importVCard(filePath);
