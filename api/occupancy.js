const database = require('../lib/database');
const elementsApi = require('../lib/api-client');
const jwt = require('jsonwebtoken');

// Token validieren
function validateToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Token aus Header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token erforderlich' });
    }

    const decoded = validateToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Ungültiger Token' });
    }

    if (req.method === 'GET') {
      // Belegungsdaten abrufen
      const hours = req.query.hours || 24;
      const data = await database.getOccupancy(hours);
      
      return res.status(200).json({
        success: true,
        data,
        count: data.length
      });
    }

    if (req.method === 'POST') {
      // Belegungsdaten speichern
      const { studio_id, current_occupancy, max_capacity } = req.body;

      if (current_occupancy === undefined || max_capacity === undefined) {
        return res.status(400).json({ 
          error: 'current_occupancy und max_capacity erforderlich' 
        });
      }

      const id = await database.saveOccupancy({
        studio_id,
        current_occupancy,
        max_capacity
      });

      return res.status(201).json({
        success: true,
        id,
        message: 'Daten gespeichert'
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};
