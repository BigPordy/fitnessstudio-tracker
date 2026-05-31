const database = require('../lib/database');
const jwt = require('jsonwebtoken');

function validateToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !validateToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await database.getStats();
    res.status(200).json({ success: true, data: stats });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
