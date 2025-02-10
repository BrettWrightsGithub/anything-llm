const { getDatabase } = require('../utils/database');

class Contact {
  static create(contact) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const { 
        name, relationToUser, personalValues, birthday,
        email, phone, tags, notes 
      } = contact;
      
      if (!name) {
        reject(new Error('Name is required'));
        return;
      }

      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        reject(new Error('Invalid email format'));
        return;
      }
      
      db.run(
        `INSERT INTO contacts (
          name, relationToUser, personalValues, birthday,
          email, phone, tags, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, relationToUser, personalValues, birthday, email, phone, tags, notes],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...contact });
          }
        }
      );
      
      db.close();
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.get('SELECT * FROM contacts WHERE id = ? AND is_deleted = 0', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
      
      db.close();
    });
  }

  static findAll(options = {}) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const { 
        searchTerm, 
        relationToUser,
        upcomingBirthdays,
        tags,
        limit = 100,
        offset = 0
      } = options;
      
      let query = 'SELECT * FROM contacts WHERE is_deleted = 0';
      const params = [];

      if (searchTerm) {
        query = `
          SELECT c.* 
          FROM contacts c
          JOIN contacts_fts fts ON c.id = fts.rowid
          WHERE c.is_deleted = 0 
          AND contacts_fts MATCH ?
        `;
        params.push(searchTerm);
      }

      if (relationToUser) {
        query += ' AND relationToUser = ?';
        params.push(relationToUser);
      }

      if (upcomingBirthdays) {
        // Get birthdays in the next 30 days
        query += ` 
          AND strftime('%m-%d', birthday) 
          BETWEEN strftime('%m-%d', 'now') 
          AND strftime('%m-%d', 'now', '+30 days')
        `;
      }

      if (tags) {
        query += ' AND tags LIKE ?';
        params.push(`%${tags}%`);
      }

      query += ' ORDER BY name LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
      
      db.close();
    });
  }

  static update(id, updates) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const { 
        name, relationToUser, personalValues, birthday,
        email, phone, tags, notes, last_contacted 
      } = updates;
      
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        reject(new Error('Invalid email format'));
        return;
      }

      db.run(
        `UPDATE contacts 
         SET name = ?, relationToUser = ?, personalValues = ?, 
             birthday = ?, email = ?, phone = ?, tags = ?,
             notes = ?, last_contacted = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND is_deleted = 0`,
        [name, relationToUser, personalValues, birthday, 
         email, phone, tags, notes, last_contacted, id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...updates });
          }
        }
      );
      
      db.close();
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      // Soft delete
      db.run(
        'UPDATE contacts SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
      
      db.close();
    });
  }

  static restore(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.run(
        'UPDATE contacts SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
      
      db.close();
    });
  }

  static updateLastContacted(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.run(
        `UPDATE contacts 
         SET last_contacted = CURRENT_DATE, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND is_deleted = 0`,
        [id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
      
      db.close();
    });
  }
}

module.exports = Contact;
