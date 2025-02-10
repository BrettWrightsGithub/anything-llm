const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Store contacts database in the server/utils/database directory to be consistent with project structure
const dbPath = path.join(__dirname, 'database', 'contacts.db');

// Create a new database connection
function getDatabase() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
}

// Initialize the database and create tables
function initializeDatabase() {
  const db = getDatabase();
  
  db.serialize(() => {
    // Enable full-text search
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts5(
      name, 
      relationToUser, 
      personalValues,
      tags,
      notes
    )`);

    // Create contacts table with enhanced fields
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        relationToUser TEXT,
        personalValues TEXT,
        birthday DATE,
        email TEXT,
        phone TEXT,
        tags TEXT,
        notes TEXT,
        last_contacted DATE,
        is_deleted BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating contacts table:', err);
      } else {
        console.log('Contacts table created successfully');
      }
    });

    // Create trigger to update FTS table
    db.run(`
      CREATE TRIGGER IF NOT EXISTS contacts_ai AFTER INSERT ON contacts BEGIN
        INSERT INTO contacts_fts(rowid, name, relationToUser, personalValues, tags, notes)
        VALUES (new.id, new.name, new.relationToUser, new.personalValues, new.tags, new.notes);
      END;
    `);

    db.run(`
      CREATE TRIGGER IF NOT EXISTS contacts_ad AFTER DELETE ON contacts BEGIN
        DELETE FROM contacts_fts WHERE rowid = old.id;
      END;
    `);

    db.run(`
      CREATE TRIGGER IF NOT EXISTS contacts_au AFTER UPDATE ON contacts BEGIN
        DELETE FROM contacts_fts WHERE rowid = old.id;
        INSERT INTO contacts_fts(rowid, name, relationToUser, personalValues, tags, notes)
        VALUES (new.id, new.name, new.relationToUser, new.personalValues, new.tags, new.notes);
      END;
    `);
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
  });
}

module.exports = {
  getDatabase,
  initializeDatabase
};
