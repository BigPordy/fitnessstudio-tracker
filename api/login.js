const database = require('../lib/database');
const elementsApi = require('../lib/api-client');
const jwt = require('jsonwebtoken');

export default async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Password erforderlich' });
    }

    // Bei Elements API anmelden
    const elementsData = await elementsApi.login(username, password);
    
    // JWT Token erzeugen
    const token = jwt.sign(
      { username, elementsToken: elementsData.token },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    // Session in Supabase speichern
    await database.saveSession(username, token);

    res.status(200).json({
      success: true,
      token,
      user: { username }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({
      error: 'Login fehlgeschlagen',
      message: error.message
    });
  }
};
