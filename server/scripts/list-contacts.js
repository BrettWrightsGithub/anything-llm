const Contact = require('../models/contact');

async function listContacts() {
  try {
    const contacts = await Contact.findAll();
    console.log('\nContacts in database:');
    contacts.forEach(contact => {
      console.log('\n-------------------');
      console.log(`Name: ${contact.name}`);
      if (contact.email) console.log(`Email: ${contact.email}`);
      if (contact.phone) console.log(`Phone: ${contact.phone}`);
      if (contact.birthday) console.log(`Birthday: ${contact.birthday}`);
      if (contact.tags) console.log(`Tags: ${contact.tags}`);
      if (contact.notes) console.log(`Notes: ${contact.notes}`);
      console.log(`Relation: ${contact.relationToUser}`);
    });
  } catch (error) {
    console.error('Failed to list contacts:', error.message);
  }
}

listContacts();
