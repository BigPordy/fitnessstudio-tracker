const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Datenbank-Verzeichnis erstellen
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'fitnessstudio.db');

// Datenbankverbindung
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Error:', err);
  else console.log('✅ Datenbank verbunden:', dbPath);
});

// Tabellen initialisieren
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS occupancy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      studio_id TEXT,
      current_occupancy INTEGER,
      max_capacity INTEGER,
      percentage REAL,
      raw_data TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);
});

// Hilfsfunktionen
const database = {
  // Belegung speichern
  saveOccupancy: (data) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO occupancy 
         (studio_id, current_occupancy, max_capacity, percentage, raw_data) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.studio_id || 'default',
          data.current_occupancy,
          data.max_capacity,
          (data.current_occupancy / data.max_capacity * 100),
          JSON.stringify(data)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Belegungsdaten abrufen
  getOccupancy: (hours = 24) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM occupancy 
         WHERE timestamp > datetime('now', '-' || ? || ' hours')
         ORDER BY timestamp DESC`,
        [hours],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Token speichern
  saveSession: (username, token, expiresIn = 24) => {
    return new Promise((resolve, reject) => {
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
      db.run(
        `INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, ?)`,
        [token, username, expiresAt.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve(token);
        }
      );
    });
  },

  // Statistiken
  getStats: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           strftime('%Y-%m-%d %H:00', timestamp) as hour,
           AVG(percentage) as avg_occupancy,
           MAX(percentage) as max_occupancy,
           MIN(percentage) as min_occupancy,
           COUNT(*) as measurements
         FROM occupancy
         WHERE timestamp > datetime('now', '-7 days')
         GROUP BY hour
         ORDER BY hour DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
};

module.exports = database;
