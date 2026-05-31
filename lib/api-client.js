const fetch = require('node-fetch');

class ElementsAPIClient {
  constructor() {
    this.baseUrl = process.env.ELEMENTS_API_URL || 'https://api.elements.club';
    this.token = null;
  }

  // Login
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) throw new Error('Login fehlgeschlagen');
      
      const data = await response.json();
      this.token = data.token;
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  // Belegung abrufen
  async getOccupancy(studioId) {
    try {
      if (!this.token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(
        `${this.baseUrl}/studios/${studioId}/occupancy`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }
      );

      if (!response.ok) throw new Error('Fehler beim Abrufen der Belegung');
      
      return await response.json();
    } catch (error) {
      console.error('Occupancy Error:', error);
      throw error;
    }
  }

  // Alle Studios abrufen
  async getStudios() {
    try {
      if (!this.token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(`${this.baseUrl}/studios`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Fehler beim Abrufen der Studios');
      
      return await response.json();
    } catch (error) {
      console.error('Studios Error:', error);
      throw error;
    }
  }
}

module.exports = new ElementsAPIClient();
