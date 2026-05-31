const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const database = {
  // Belegung speichern
  saveOccupancy: async (data) => {
    const { data: result, error } = await supabase
      .from('occupancy')
      .insert([{
        studio_id: data.studio_id || 'default',
        current_occupancy: data.current_occupancy,
        max_capacity: data.max_capacity,
        percentage: (data.current_occupancy / data.max_capacity * 100),
        raw_data: JSON.stringify(data)
      }]);

    if (error) throw error;
    return result[0]?.id;
  },

  // Belegungsdaten abrufen
  getOccupancy: async (hours = 24) => {
    const { data, error } = await supabase
      .from('occupancy')
      .select('*')
      .gt('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Token speichern (Session)
  saveSession: async (username, token, expiresIn = 24) => {
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        token,
        username,
        expires_at: expiresAt.toISOString()
      }]);

    if (error) throw error;
    return token;
  },

  // Statistiken
  getStats: async () => {
    const { data, error } = await supabase
      .from('occupancy')
      .select('timestamp, percentage')
      .gt('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Gruppierung in JavaScript
    const grouped = {};
    data.forEach(row => {
      const hour = new Date(row.timestamp).toISOString().slice(0, 13) + ':00';
      if (!grouped[hour]) {
        grouped[hour] = { times: [], percentages: [] };
      }
      grouped[hour].percentages.push(row.percentage);
    });

    return Object.entries(grouped).map(([hour, stats]) => ({
      hour,
      avg_occupancy: stats.percentages.reduce((a, b) => a + b, 0) / stats.percentages.length,
      max_occupancy: Math.max(...stats.percentages),
      min_occupancy: Math.min(...stats.percentages),
      measurements: stats.percentages.length
    }));
  }
};

module.exports = database;
