const vcf = require('vcf');
const fs = require('fs').promises;
const Contact = require('../models/contact');

class VCardImporter {
  static async importFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parser = new vcf().parse(content);
      const cards = Array.isArray(parser) ? parser : [parser];
      
      const results = {
        success: [],
        errors: []
      };

      for (const card of cards) {
        try {
          const contact = await this.convertVCardToContact(card);
          const savedContact = await Contact.create(contact);
          results.success.push(savedContact);
        } catch (error) {
          results.errors.push({
            name: this.getCardValue(card, 'fn') || 'Unknown',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to import vCard file: ${error.message}`);
    }
  }

  static getCardValue(card, property) {
    try {
      return card.get(property)?.valueOf() || null;
    } catch (error) {
      return null;
    }
  }

  static async convertVCardToContact(card) {
    const contact = {};

    // Get full name (required)
    const fullName = this.getCardValue(card, 'fn');
    if (!fullName) {
      throw new Error('Contact must have a name');
    }
    contact.name = fullName;

    // Get email (if exists)
    const email = this.getCardValue(card, 'email');
    if (email) {
      contact.email = email;
    }

    // Get phone (if exists)
    const phone = this.getCardValue(card, 'tel');
    if (phone) {
      contact.phone = phone;
    }

    // Get birthday (if exists)
    const birthday = this.getCardValue(card, 'bday');
    if (birthday) {
      try {
        contact.birthday = new Date(birthday).toISOString().split('T')[0];
      } catch (error) {
        console.warn(`Could not parse birthday for ${contact.name}: ${birthday}`);
      }
    }

    // Get notes (if exists)
    const notes = this.getCardValue(card, 'note');
    if (notes) {
      contact.notes = notes;
    }

    // Get categories as tags (if exists)
    const categories = this.getCardValue(card, 'categories');
    if (categories) {
      contact.tags = Array.isArray(categories) ? categories.join(', ') : categories;
    }

    // Set default relationToUser if not specified
    contact.relationToUser = 'Imported from vCard';

    return contact;
  }

  static async importFromDirectory(directoryPath) {
    try {
      const files = await fs.readdir(directoryPath);
      const vcfFiles = files.filter(file => file.toLowerCase().endsWith('.vcf'));
      
      const results = {
        totalFiles: vcfFiles.length,
        processed: 0,
        success: [],
        errors: []
      };

      for (const file of vcfFiles) {
        try {
          const filePath = `${directoryPath}/${file}`;
          const fileResults = await this.importFromFile(filePath);
          results.success.push(...fileResults.success);
          results.errors.push(...fileResults.errors);
          results.processed++;
        } catch (error) {
          results.errors.push({
            file,
            error: error.message
          });
          results.processed++;
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to import vCards from directory: ${error.message}`);
    }
  }
}

module.exports = VCardImporter;
